import { Inngest } from "inngest";

// Initialize the Inngest client for VidShorts
export const inngest = new Inngest({
  id: "vidshorts-app",
  name: "VidShorts AI Video Engine",
  eventKey: process.env.INNGEST_EVENT_KEY,
  isDev: process.env.NODE_ENV !== "production" || process.env.INNGEST_DEV === "1",
});
