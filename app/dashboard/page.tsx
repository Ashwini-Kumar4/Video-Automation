import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";

export const metadata = {
  title: "Studio Workspace — VidShorts",
  description: "Generate viral short clips from your long-form videos with AI.",
};

async function DashboardContent() {
  const user = await currentUser();

  return (
    <DashboardWorkspace
      userFirstName={user?.firstName}
      userEmail={user?.primaryEmailAddress?.emailAddress}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="size-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
