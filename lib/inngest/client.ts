import { Inngest } from "inngest";

// Initialize the Inngest client for VidShorts
// In production (Vercel): reads INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY from env automatically
// In development: set INNGEST_DEV=1 to use local Inngest dev server
export const inngest = new Inngest({
  id: "vidshorts-app",
  name: "VidShorts AI Video Engine",
  isDev: process.env.NODE_ENV !== "production" && process.env.INNGEST_DEV === "1",
});
