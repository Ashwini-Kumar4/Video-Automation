import { auth } from "@clerk/nextjs/server";
import { checkAndSyncUser } from "@/lib/db/user";

/**
 * Server component that runs on page visits to ensure the active user
 * is recorded in the Neon database without needing any webhooks.
 */
export async function UserSync() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  await checkAndSyncUser();
  return null;
}
