import { currentUser } from "@clerk/nextjs/server";
import { db, users, isDbConfigured } from "@/db";
import { eq } from "drizzle-orm";
import type { User } from "@/db/schema";

/**
 * Checks if the current authenticated user exists in the Neon database.
 * If not, automatically saves their profile information to the database.
 * If they do exist, updates any modified information (name, avatar, email).
 * 
 * This avoids needing external webhooks and ensures the database is always
 * up-to-date every time the user accesses the application.
 */
export async function checkAndSyncUser(
  cachedClerkUser?: Awaited<ReturnType<typeof currentUser>>
): Promise<User | null> {
  try {
    const clerkUser =
      cachedClerkUser !== undefined ? cachedClerkUser : await currentUser();

    if (!clerkUser) {
      return null;
    }

    if (!isDbConfigured) {
      // In development or when DATABASE_URL is not provided yet, warn gracefully
      return null;
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      "";

    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";
    const imageUrl = clerkUser.imageUrl || null;

    // Check if the user already exists in Neon DB
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      // Update fields if they changed in Clerk
      const hasChanged =
        existingUser.email !== email ||
        existingUser.firstName !== firstName ||
        existingUser.lastName !== lastName ||
        existingUser.imageUrl !== imageUrl;

      if (hasChanged && email) {
        const [updatedUser] = await db
          .update(users)
          .set({
            email,
            firstName,
            lastName,
            imageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, clerkUser.id))
          .returning();

        return updatedUser || existingUser;
      }

      return existingUser;
    }

    // New sign-up user! Insert their info into Neon DB
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: clerkUser.id,
        email: email || `${clerkUser.id}@noemail.vidshorts.ai`,
        firstName,
        lastName,
        imageUrl,
      })
      .returning();

    console.log(`[Neon DB] Successfully registered new user: ${email} (${clerkUser.id})`);
    return newUser;
  } catch (error: unknown) {
    // Preserve Next.js internal control flow (e.g., dynamic server bailouts, redirects)
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string"
    ) {
      throw error;
    }
    console.error("[Neon DB] Error checking or syncing user:", error);
    return null;
  }
}
