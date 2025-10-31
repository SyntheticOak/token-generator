import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const ASSETS_DIR = path.join(__dirname, '../public/assets');

async function fileExists(bucket, key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

async function uploadFile(bucket, key, filePath) {
  const fileContent = fs.readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileContent,
    ContentType: getContentType(filePath),
  });
  
  return await s3Client.send(command);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function uploadDirectory(localDir, bucket, prefix = '') {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const key = prefix ? `${prefix}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      await uploadDirectory(localPath, bucket, key);
    } else {
      // Check if file already exists
      const stats = fs.statSync(localPath);
      const exists = await fileExists(bucket, key);
      
      if (exists) {
        console.log(`  ✓ Skipping ${key} (already exists)`);
      } else {
        try {
          console.log(`  ↑ Uploading ${key} (${(stats.size / 1024).toFixed(1)} KB)...`);
          await uploadFile(bucket, key, localPath);
          console.log(`  ✓ Successfully uploaded ${key}`);
        } catch (error) {
          console.error(`  ✗ Failed to upload ${key}:`, error.message);
          throw error; // Re-throw to stop the process
        }
      }
    }
  }
}

async function uploadAssets() {
  console.log('Starting asset upload to Cloudflare R2...');
  console.log(`Bucket: ${R2_BUCKET_NAME}`);
  console.log(`Public URL: ${R2_PUBLIC_URL}`);
  console.log(`Local directory: ${ASSETS_DIR}`);
  console.log('');
  
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`✗ Assets directory not found: ${ASSETS_DIR}`);
    process.exit(1);
  }
  
  // Count files to upload
  let totalFiles = 0;
  let newFiles = 0;
  function countFiles(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const localPath = path.join(dir, entry.name);
      const key = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        countFiles(localPath, key);
      } else {
        totalFiles++;
      }
    }
  }
  countFiles(ASSETS_DIR, 'assets');
  
  console.log(`Found ${totalFiles} files to process`);
  console.log('');
  
  try {
    await uploadDirectory(ASSETS_DIR, R2_BUCKET_NAME, 'assets');
    console.log('');
    console.log('✅ Upload completed successfully!');
    console.log(`Assets are now available at: ${R2_PUBLIC_URL}`);
  } catch (error) {
    console.error('');
    console.error('❌ Upload failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

uploadAssets();
