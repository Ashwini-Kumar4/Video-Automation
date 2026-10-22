import { Suspense } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { checkAndSyncUser } from "@/lib/db/user";

export const metadata = {
  title: "Dashboard — VidShorts AI Video Studio",
  description: "AI-powered long-to-short video generator and social scheduler.",
};

async function AuthenticatedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // If not signed in, redirect to sign-in page immediately
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const dbUser = await checkAndSyncUser(user);

  const userInfo = {
    firstName: dbUser?.firstName || user?.firstName || null,
    lastName: dbUser?.lastName || user?.lastName || null,
    email: dbUser?.email || user?.primaryEmailAddress?.emailAddress || null,
    imageUrl: dbUser?.imageUrl || user?.imageUrl || null,
  };

  return <DashboardShell user={userInfo}>{children}</DashboardShell>;
}

function DashboardShellFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-9 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground animate-pulse">
          Loading VidShorts workspace...
        </p>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellFallback />}>
      <AuthenticatedDashboardLayout>{children}</AuthenticatedDashboardLayout>
    </Suspense>
  );
}
