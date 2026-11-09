"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, type RootState, type ThreeEvent } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// The homepage hero's background: a wireframe "terrain" whose ridges come
// from a synthetic price-style random walk (same "clearly-not-real-data"
// convention as every other decorative chart on the site — this is an
// abstract mood graphic, not a claim about any real market).
//
// This isn't just a static shape with a camera moving past it — the
// terrain itself reacts: it bulges gently toward wherever the cursor is
// (a live raycast onto the ground plane, fed into the vertex shader as a
// uniform) and clicking sends a real ripple outward from that point, both
// computed on the GPU so it costs nothing extra per vertex. A bloom pass
// gives the brightest ridges an actual light-glow instead of just being a
// bright colour.
//
// All state that changes every frame (scroll progress, pointer position,
// click timing) is read from refs/uniforms, never React state — this
// updates many times a second and funnelling it through React state would
// mean a full re-render per frame.

const GOLD_BRIGHT = new THREE.Color("#f5d76e");
const GOLD_DEEP = new THREE.Color("#8a6a1f");
const BG = new THREE.Color("#070708");

const SEG_X = 70;
const SEG_Z = 46;
const WIDTH = 46;
const DEPTH = 46;

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A synthetic random walk (the "price data" the brief asks the ridges to
// come from) plus a handful of randomised sine waves standing in for
// terrain noise — cheap, deterministic per seed, no noise library needed.
function buildHeightField(seed: number) {
  const random = mulberry32(seed);
  const n = SEG_X + 1;
  const walk = new Float32Array(n);
  let v = 0;
  for (let i = 0; i < n; i++) {
    v += (random() - 0.5) * 0.9;
    v = Math.max(-3, Math.min(3, v));
    walk[i] = v;
  }
  let max = 0.0001;
  for (let i = 0; i < n; i++) max = Math.max(max, Math.abs(walk[i]));
  for (let i = 0; i < n; i++) walk[i] /= max;

  const waves = Array.from({ length: 4 }, () => ({
    fx: 0.5 + random() * 1.4,
    fz: 0.5 + random() * 1.4,
    phase: random() * Math.PI * 2,
    amp: 0.12 + random() * 0.18,
  }));

  return { walk, waves };
}

function heightAt(xi: number, zi: number, field: ReturnType<typeof buildHeightField>) {
  const u = xi / SEG_X;
  const w = zi / SEG_Z;
  const base = field.walk[xi];
  let noise = 0;
  for (const wave of field.waves) {
    noise += Math.sin(u * Math.PI * 2 * wave.fx + w * Math.PI * 2 * wave.fz + wave.phase) * wave.amp;
  }
  const depthFalloff = 1 - w * 0.55; // ridges calmer the further they recede
  return (base * 1.5 + noise * 0.55) * depthFalloff;
}

function buildTerrainGeometry() {
  const field = buildHeightField(1337);
  const geometry = new THREE.PlaneGeometry(WIDTH, DEPTH, SEG_X, SEG_Z);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < position.count; i++) {
    const xi = i % (SEG_X + 1);
    const zi = Math.floor(i / (SEG_X + 1));
    const h = heightAt(xi, zi, field);
    position.setY(i, h * 1.5);

    const w = zi / SEG_Z;
    // Capped below 1 so no vertex ever hits raw GOLD_BRIGHT at full
    // strength — a handful of ridge peaks sitting near the camera were
    // otherwise bright enough to make the bloom pass blow out into a
    // wide glare instead of a tasteful glow.
    const heightT = THREE.MathUtils.clamp((h + 1.6) / 3.2, 0, 0.72);
    tmpColor.copy(GOLD_DEEP).lerp(GOLD_BRIGHT, heightT);
    tmpColor.lerp(BG, Math.min(1, w * 0.6 + 0.12));
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.translate(0, 0, -DEPTH * 0.32);
  return geometry;
}

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uClickPos;
  uniform float uClickTime;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vGlow;

  void main() {
    vec3 pos = position;

    // A gentle bulge that follows the cursor's projection onto the
    // ground plane — the terrain visibly "notices" where you are.
    float dPointer = distance(pos.xz, uPointer);
    float pointerBump = exp(-dPointer * dPointer * 0.038) * 1.25;

    // A real ripple radiating from the last click point, decaying with
    // both distance and time so it reads as one wave passing through,
    // not a standing distortion.
    float ripple = 0.0;
    if (uClickTime > -500.0) {
      float clickAge = uTime - uClickTime;
      float dClick = distance(pos.xz, uClickPos);
      float wave = sin(dClick * 1.1 - clickAge * 6.5);
      float envelope = exp(-clickAge * 1.1) * exp(-dClick * dClick * 0.006);
      ripple = wave * envelope * 2.6;
    }

    // A small ambient sway so the surface is never perfectly still even
    // with no interaction at all.
    float ambient = sin(pos.x * 0.15 + uTime * 0.35) * 0.05;

    pos.y += pointerBump + ripple + ambient;

    vColor = color;
    vGlow = clamp(pointerBump * 0.7 + abs(ripple) * 0.6, 0.0, 1.4);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uGlowColor;
  varying vec3 vColor;
  varying float vGlow;

  void main() {
    vec3 col = vColor + uGlowColor * vGlow;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Terrain({ uniformsRef }: { uniformsRef: React.MutableRefObject<TerrainUniforms | null> }) {
  const geometry = useMemo(() => buildTerrainGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        wireframe: true,
        transparent: false,
        uniforms: {
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(0, 1000) },
          uClickPos: { value: new THREE.Vector2(0, 0) },
          uClickTime: { value: -1000 },
          uGlowColor: { value: new THREE.Color("#fff3d1") },
        },
      }),
    [],
  );

  // Handing the uniforms up to the Rig (which drives them every frame) has
  // to happen after render, not during it — mutating a ref while useMemo
  // itself is running is exactly what react-hooks/refs warns against.
  useEffect(() => {
    uniformsRef.current = material.uniforms as unknown as TerrainUniforms;
  }, [material, uniformsRef]);

  function handleClick(e: ThreeEvent<PointerEvent>) {
    const u = uniformsRef.current;
    if (!u) return;
    u.uClickPos.value.set(e.point.x, e.point.z);
    u.uClickTime.value = u.uTime.value;
  }

  return <mesh geometry={geometry} material={material} onPointerDown={handleClick} />;
}

type TerrainUniforms = {
  uTime: { value: number };
  uPointer: { value: THREE.Vector2 };
  uClickPos: { value: THREE.Vector2 };
  uClickTime: { value: number };
  uGlowColor: { value: THREE.Color };
};

// Slow autonomous drift + gentle cursor parallax + the scroll-driven "zoom
// through" handoff into the next section, plus feeding the live pointer
// ground-position and clock into the terrain's shader uniforms.
function Rig({
  progressRef,
  uniformsRef,
}: {
  progressRef: React.MutableRefObject<{ t: number }>;
  uniformsRef: React.MutableRefObject<TerrainUniforms | null>;
}) {
  const startTime = useRef<number | null>(null);
  const smoothPointer = useRef({ x: 0, y: 0 });
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const hitPoint = useRef(new THREE.Vector3());

  useFrame((state: RootState) => {
    if (startTime.current == null) startTime.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - startTime.current;

    smoothPointer.current.x += (state.pointer.x - smoothPointer.current.x) * 0.035;
    smoothPointer.current.y += (state.pointer.y - smoothPointer.current.y) * 0.035;

    const drift = Math.sin(t * 0.08) * 0.7;
    const driftY = Math.cos(t * 0.06) * 0.18;
    const progress = progressRef.current.t;

    const { camera } = state;
    camera.position.x = drift + smoothPointer.current.x * 0.9;
    camera.position.y = 2.3 + driftY + smoothPointer.current.y * 0.35 - progress * 1.3;
    camera.position.z = 15.5 - progress * 12.5;
    camera.lookAt(0, 0.3 - progress * 2.2, -8);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 50 + progress * 16;
      camera.updateProjectionMatrix();
    }

    if (state.scene.fog instanceof THREE.FogExp2) {
      state.scene.fog.density = 0.032 + progress * 0.1;
    }

    const u = uniformsRef.current;
    if (u) {
      u.uTime.value = t;
      state.raycaster.setFromCamera(state.pointer, state.camera);
      const hit = state.raycaster.ray.intersectPlane(groundPlane.current, hitPoint.current);
      if (hit) u.uPointer.value.set(hitPoint.current.x, hitPoint.current.z);
    }
  });

  return null;
}

function Scene({ progressRef }: { progressRef: React.MutableRefObject<{ t: number }> }) {
  const uniformsRef = useRef<TerrainUniforms | null>(null);
  return (
    <>
      <color attach="background" args={["#070708"]} />
      <fogExp2 attach="fog" args={["#070708", 0.032]} />
      <Terrain uniformsRef={uniformsRef} />
      <Rig progressRef={progressRef} uniformsRef={uniformsRef} />
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.1} intensity={0.22} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export default function TerrainScene({
  progressRef,
  active,
}: {
  progressRef: React.MutableRefObject<{ t: number }>;
  active: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "low-power", alpha: false }}
      camera={{ position: [0, 2.3, 15.5], fov: 50, near: 0.1, far: 60 }}
      frameloop={active ? "always" : "never"}
    >
      <Scene progressRef={progressRef} />
    </Canvas>
  );
}
