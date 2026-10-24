/**
 * Run this to diagnose environment configuration issues:
 * node scripts/test-env.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Read .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");

function getEnvVar(name) {
  const match = envContent.match(new RegExp(`^${name}=([^\\r\\n#]+)`, "m"));
  return match ? match[1].trim() : null;
}

const geminiKey = getEnvVar("GEMINI_API_KEY");
const deepgramKey = getEnvVar("DEEPGRAM_API_KEY");
const geminiModel = getEnvVar("GEMINI_MODEL");
const awsKeyId = getEnvVar("AWS_ACCESS_KEY_ID");
const awsSecret = getEnvVar("AWS_SECRET_ACCESS_KEY");
const awsRegion = getEnvVar("AWS_REGION");
const awsBucket = getEnvVar("AWS_BUCKET_NAME");

console.log("\n=== VidShorts Environment Diagnostics ===\n");

// --- Gemini ---
console.log("🤖 GEMINI AI:");
console.log(`  Model: ${geminiModel || "(not set)"}`);
if (!geminiKey) {
  console.log("  ❌ GEMINI_API_KEY: NOT SET");
} else if (geminiKey.length < 20) {
  console.log(`  ❌ GEMINI_API_KEY: INVALID LENGTH ("${geminiKey.slice(0, 15)}...")`);
} else {
  console.log(`  ✅ GEMINI_API_KEY: set (${geminiKey.slice(0, 8)}...)`);
}

// --- Deepgram ---
console.log("\n🎙️ DEEPGRAM:");
if (!deepgramKey) {
  console.log("  ❌ DEEPGRAM_API_KEY: NOT SET");
} else if (deepgramKey.length < 20) {
  console.log(`  ⚠️  DEEPGRAM_API_KEY: suspiciously short (${deepgramKey.length} chars)`);
} else {
  console.log(`  ✅ DEEPGRAM_API_KEY: looks set (${deepgramKey.slice(0, 8)}...)`);
}

// --- AWS ---
console.log("\n☁️  AWS S3:");
console.log(`  Region:    ${awsRegion || "(not set)"}`);
console.log(`  Bucket:    ${awsBucket || "(not set)"}`);
if (!awsKeyId || awsKeyId.includes("your-")) {
  console.log("  ❌ AWS_ACCESS_KEY_ID: NOT SET or placeholder");
} else {
  console.log(`  ✅ AWS_ACCESS_KEY_ID: ${awsKeyId.slice(0, 8)}...`);
}
if (!awsSecret || awsSecret.includes("your-")) {
  console.log("  ❌ AWS_SECRET_ACCESS_KEY: NOT SET or placeholder");
} else {
  console.log(`  ✅ AWS_SECRET_ACCESS_KEY: set (${awsSecret.length} chars)`);
}

// --- Test Gemini API ---
if (geminiKey && geminiKey.length > 20) {
  console.log("\n🧪 Testing Gemini API connection...");
  const postData = JSON.stringify({
    contents: [{ parts: [{ text: "Say: OK" }] }],
    generationConfig: { maxOutputTokens: 5 }
  });

  const modelToUse = geminiModel || "gemini-3.5-flash-lite";
  const req = https.request({
    hostname: "generativelanguage.googleapis.com",
    path: `/v1beta/models/${modelToUse}:generateContent?key=${geminiKey}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      if (res.statusCode === 200) {
        console.log(`  ✅ Gemini API connection (${modelToUse}): SUCCESS`);
      } else {
        console.log(`  ❌ Gemini API returned: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log("     Error:", json.error?.message || data.slice(0, 200));
        } catch {
          console.log("     Response:", data.slice(0, 200));
        }
      }
    });
  });
  req.on("error", (e) => console.log(`  ❌ Gemini API network error: ${e.message}`));
  req.write(postData);
  req.end();
} else {
  console.log("\n⏭️  Skipping Gemini API test (missing key)");
}

console.log("\n💡 SUMMARY OF ACTIONS NEEDED:");
console.log("  1. Ensure your AWS S3 bucket has CORS configured (see below)");
console.log("\n📋 Add this CORS policy to your S3 bucket (vidshorts-uploads-ashwini) in AWS Console:");
console.log(JSON.stringify([
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000", "https://*.vercel.app", "*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3000
  }
], null, 2));
console.log("\n");
