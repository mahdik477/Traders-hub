import { DirectorySkeleton } from "@/components/SignalGroupDirectory";
import SignalGroupsIntro from "@/components/SignalGroupsIntro";

export default function Loading() {
  return (
    <>
      <SignalGroupsIntro />
      <div className="mt-8">
        <DirectorySkeleton />
      </div>
    </>
  );
}
