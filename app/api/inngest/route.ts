import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  processVideoUpload,
  analyzeAndTranscribeVideo,
  renderShortVideoClip,
  checkAndSchedulePostsEvery15Min,
} from "@/lib/inngest/functions";

// Create an API handler that serves Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processVideoUpload,
    analyzeAndTranscribeVideo,
    renderShortVideoClip,
    checkAndSchedulePostsEvery15Min,
  ],
});
