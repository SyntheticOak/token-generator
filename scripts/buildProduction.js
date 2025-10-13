import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

// Run the build process
async function runBuild() {
  console.log('Building for production...');
  
  try {
    // Generate manifest with production URLs
    await runCommand('node', ['scripts/generateManifest.js']);
    
    // TypeScript compilation
    await runCommand('npx', ['tsc']);
    
    // Vite build
    await runCommand('npx', ['vite', 'build']);
    
    console.log('Production build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
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

runBuild();
