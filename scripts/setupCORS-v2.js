import fetch from 'node-fetch';

// You'll need to get these from Cloudflare Dashboard
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID || !BUCKET_NAME) {
  console.error('Missing required environment variables:');
  console.error('CLOUDFLARE_API_TOKEN - Get from Cloudflare Dashboard > My Profile > API Tokens');
  console.error('R2_ACCOUNT_ID - Should be in your .env file');
  console.error('R2_BUCKET_NAME - Should be in your .env file');
  process.exit(1);
}

async function setupCORSWithAPI() {
  console.log('Setting up CORS using Cloudflare API...');
  console.log(`Account ID: ${CLOUDFLARE_ACCOUNT_ID}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  
  const corsConfig = {
    cors: {
      allowed_origins: ["*"],
      allowed_methods: ["GET", "HEAD"],
      allowed_headers: ["*"],
      max_age_seconds: 3600
    }
  };

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corsConfig)
      }
    );

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ CORS policy configured successfully via API!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Failed to configure CORS via API:', result);
    }
  } catch (error) {
    console.error('❌ Error calling Cloudflare API:', error.message);
  }
}

setupCORSWithAPI();



