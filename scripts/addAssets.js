import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addAssets() {
  console.log('🚀 Starting complete asset workflow...');
  
  try {
    // Step 1: Upload assets to R2
    console.log('\n📤 Step 1: Uploading assets to R2...');
    await runCommand('node', ['scripts/uploadToR2.js']);
    
    // Step 2: Build for production (includes manifest generation and build)
    console.log('\n🔨 Step 2: Building for production...');
    await runCommand('node', ['scripts/buildProduction.js']);
    
    console.log('\n✅ Asset workflow completed successfully!');
    console.log('Your app is ready to deploy with the new assets.');
  } catch (error) {
    console.error('❌ Asset workflow failed:', error.message);
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

addAssets();

