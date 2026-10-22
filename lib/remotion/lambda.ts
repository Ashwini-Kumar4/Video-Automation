import {
  renderMediaOnLambda,
  getRenderProgress,
  deploySite,
  AwsRegion,
} from "@remotion/lambda";
import path from "path";
import { ShortCompositionProps } from "@/components/remotion/ShortVideoComposition";

export interface LambdaRenderParams {
  shortId: string;
  title: string;
  inputProps: ShortCompositionProps;
}

export interface LambdaRenderResult {
  renderId: string;
  bucketName: string;
  serveUrl: string;
  functionName: string;
}

export interface LambdaProgressResult {
  overallProgress: number; // 0 to 1
  percent: number; // 0 to 100
  renderedFrames: number;
  encodedFrames: number;
  totalFrames: number;
  done: boolean;
  fatalErrorEncountered: boolean;
  errors: string[];
  outputFile: string | null;
}

function initRemotionAwsEnv(): {
  region: AwsRegion;
  bucketName: string;
  functionName: string;
} {
  const region = (process.env.REMOTION_AWS_REGION || "ap-southeast-2") as AwsRegion;
  const accessKeyId =
    process.env.REMOTION_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey =
    process.env.REMOTION_AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    "";

  if (accessKeyId) process.env.AWS_ACCESS_KEY_ID = accessKeyId;
  if (secretAccessKey) process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;
  if (region) process.env.AWS_REGION = region;

  const bucketName =
    process.env.REMOTION_BUCKET_NAME || "remotionlambda-apsoutheast2-12ov6bkohs";
  const functionName =
    process.env.REMOTION_FUNCTION_NAME ||
    "remotion-render-4-0-536-mem2048mb-disk2048mb-600sec";

  return { region, bucketName, functionName };
}

/**
 * Gets the deployed serveUrl or deploys the Remotion project site to S3 if needed.
 */
export async function getOrDeployServeUrl(): Promise<string> {
  const { region, bucketName } = initRemotionAwsEnv();

  // 1. Use configured serve URL if present
  if (process.env.REMOTION_SERVE_URL) {
    return process.env.REMOTION_SERVE_URL;
  }

  // 2. Fallback to default expected S3 site location
  const siteName = process.env.REMOTION_SITE_NAME || "vidshorts-site";
  const expectedUrl = `https://${bucketName}.s3.${region}.amazonaws.com/sites/${siteName}/index.html`;

  try {
    const checkRes = await fetch(expectedUrl, { method: "HEAD" });
    if (checkRes.ok) {
      return expectedUrl;
    }
  } catch {
    // continue to deploy
  }

  // 3. Deploy site if not found
  console.log("[Remotion Lambda] Deploying site bundle to S3...");
  const entryPoint = path.resolve(process.cwd(), "remotion/index.ts");

  const { serveUrl } = await deploySite({
    bucketName,
    entryPoint,
    region,
    siteName,
    options: {
      webpackOverride: (config: any) => ({
        ...config,
        resolve: {
          ...(config?.resolve || {}),
          alias: {
            ...(config?.resolve?.alias || {}),
            "@": process.cwd(),
          },
        },
      }),
    },
  });

  return serveUrl;
}

/**
 * Initiates video rendering on AWS Lambda using Remotion
 */
export async function renderShortVideoOnLambda({
  shortId,
  title,
  inputProps,
}: LambdaRenderParams): Promise<LambdaRenderResult> {
  const { region, bucketName, functionName } = initRemotionAwsEnv();
  const serveUrl = await getOrDeployServeUrl();

  console.log(`[Remotion Lambda] Starting render for short: "${title}" (${shortId})`);
  console.log(`[Remotion Lambda] Function: ${functionName}, Bucket: ${bucketName}`);

  const safeFileName = `${(title || "vidshort").replace(/[^a-zA-Z0-9_-]/g, "_")}_9x16.mp4`;

  const { renderId, bucketName: usedBucket } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl,
    composition: "ShortVideoComposition",
    inputProps: inputProps as unknown as Record<string, unknown>,
    codec: "h264",
    imageFormat: "jpeg",
    maxRetries: 3,
    privacy: "public",
    outName: `renders/${shortId}_${Date.now()}.mp4`,
    timeoutInMilliseconds: 600000,
    concurrency: Number(process.env.REMOTION_CONCURRENCY) || 2,
    downloadBehavior: {
      type: "download",
      fileName: safeFileName,
    },
  });

  console.log(`[Remotion Lambda] Render triggered successfully. Render ID: ${renderId}`);

  return {
    renderId,
    bucketName: usedBucket,
    serveUrl,
    functionName,
  };
}

/**
 * Checks progress of an in-flight Remotion Lambda render
 */
export async function getShortRenderProgress(
  renderId: string,
  customBucket?: string
): Promise<LambdaProgressResult> {
  const { region, bucketName, functionName } = initRemotionAwsEnv();
  const bucket = customBucket || bucketName;

  const res = await getRenderProgress({
    renderId,
    bucketName: bucket,
    functionName,
    region,
  });

  const raw = res as any;
  const overall = typeof raw.overallProgress === "number" ? raw.overallProgress : 0;
  const percent = Math.min(100, Math.max(0, Math.round(overall * 100)));

  return {
    overallProgress: overall,
    percent,
    renderedFrames: raw.renderedFrames || 0,
    encodedFrames: raw.encodedFrames || 0,
    totalFrames: raw.totalFrames || 0,
    done: Boolean(raw.done),
    fatalErrorEncountered: Boolean(raw.fatalErrorEncountered),
    errors: (raw.errors || []).map((e: any) =>
      typeof e === "string" ? e : e?.message || JSON.stringify(e)
    ),
    outputFile: raw.outputFile || null,
  };
}

