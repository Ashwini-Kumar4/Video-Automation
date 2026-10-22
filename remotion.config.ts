/**
 * Remotion Configuration File
 * Automatically loaded by Remotion CLI (e.g. `npx remotion ...` and `npx remotion lambda ...`)
 * Loads environment variables from `.env.local` so Remotion Lambda and AWS APIs have access to credentials.
 */

import { Config } from "@remotion/cli/config";
import * as dotenv from "dotenv";
import * as path from "path";

// 1. Load .env.local first (Next.js default for local secrets), then .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// 2. Prioritize REMOTION_AWS credentials for Remotion operations
if (process.env.REMOTION_AWS_ACCESS_KEY_ID) {
  process.env.AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID;
}
if (process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;
}
if (process.env.REMOTION_AWS_REGION) {
  process.env.AWS_REGION = process.env.REMOTION_AWS_REGION;
}

// 3. Recommended rendering defaults
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// 4. Resolve @/ alias
Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        "@": path.resolve(process.cwd()),
      },
    },
  };
});
