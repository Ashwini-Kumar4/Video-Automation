import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

process.env.AWS_ACCESS_KEY_ID = process.env.REMOTION_AWS_ACCESS_KEY_ID;
process.env.AWS_SECRET_ACCESS_KEY = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;
process.env.AWS_REGION = process.env.REMOTION_AWS_REGION;

import { deploySite } from '@remotion/lambda';
import path from 'path';

async function deploy() {
  console.log('[Deploy] Starting Remotion Lambda site deployment...');
  console.log('[Deploy] Region:', process.env.REMOTION_AWS_REGION);
  console.log('[Deploy] Bucket:', process.env.REMOTION_BUCKET_NAME);
  console.log('[Deploy] Entry point:', path.resolve('src/index.ts'));

  const result = await deploySite({
    bucketName: process.env.REMOTION_BUCKET_NAME,
    entryPoint: path.resolve('src/index.ts'),
    region: process.env.REMOTION_AWS_REGION,
    siteName: 'my-video',
    options: {
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...(config?.resolve || {}),
          alias: {
            ...(config?.resolve?.alias || {}),
            '@': process.cwd(),
          },
        },
      }),
    },
  });

  console.log('[Deploy] Site successfully deployed!');
  console.log('[Deploy] Serve URL:', result.serveUrl);
  console.log('[Deploy] Site Name:', result.siteName);
}

deploy().catch((err) => {
  console.error('[Deploy] FAILED with error:', err);
  process.exit(1);
});
