"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import * as THREE from "three";

// The homepage hero's background: a wireframe "terrain" whose ridges come
// from a synthetic price-style random walk (same "clearly-not-real-data"
// convention as every other decorative chart on the site — this is an
// abstract mood graphic, not a claim about any real market), lit only by
// vertex colour (cheaper than real scene lights, and gives full control
// over the gold gradient) and faded into the background colour by Three's
// fog, which also gives the "chaos resolving near the headline" read for
// free — ridges are brightest and sharpest near the camera, and dissolve
// into the dark at a distance.
//
// All state that changes every frame (scroll progress) is read from a
// ref, never React state — this is driven by a GSAP ScrollTrigger in
// CinematicHero.tsx many times a second while scrolling, and funnelling
// that through React state would mean a full re-render per scroll tick.

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
    const heightT = THREE.MathUtils.clamp((h + 1.6) / 3.2, 0, 1);
    tmpColor.copy(GOLD_DEEP).lerp(GOLD_BRIGHT, heightT);
    tmpColor.lerp(BG, Math.min(1, w * 0.6 + 0.05));
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.translate(0, 0, -DEPTH * 0.32);
  return geometry;
}

function Terrain() {
  const geometry = useMemo(() => buildTerrainGeometry(), []);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors wireframe transparent opacity={0.85} />
    </mesh>
  );
}

// Slow autonomous drift + gentle cursor parallax + the scroll-driven "zoom
// through" handoff into the next section, all in one useFrame so there's
// only one subscription doing per-frame camera/fog math.
function Rig({ progressRef }: { progressRef: React.MutableRefObject<{ t: number }> }) {
  const startTime = useRef<number | null>(null);
  const smoothPointer = useRef({ x: 0, y: 0 });

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
  });

  return null;
}

function Scene({ progressRef }: { progressRef: React.MutableRefObject<{ t: number }> }) {
  return (
    <>
      <color attach="background" args={["#070708"]} />
      <fogExp2 attach="fog" args={["#070708", 0.032]} />
      <Terrain />
      <Rig progressRef={progressRef} />
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
