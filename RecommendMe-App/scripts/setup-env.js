#!/usr/bin/env node

/**
 * Quick Setup Script for RecommendMe Frontend
 * 
 * Usage:
 *   npm run setup        # Interactive setup
 *   npm run setup:local  # Setup for local development
 *   npm run setup:prod   # Setup for production
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

async function setupLocal() {
  console.log('\n📍 Setting up for LOCAL DEVELOPMENT\n');

  const config = `VITE_ENVIRONMENT=development
VITE_LOCAL_API_URL=http://localhost:8000/v1
VITE_PRODUCTION_API_URL=https://recommendme-api-production.up.railway.app/v1
VITE_API_TIMEOUT=30000
VITE_DEBUG_API=true
`;

  fs.writeFileSync(envPath, config);
  console.log('✅ Created .env for local development');
  console.log('\n📋 Next steps:');
  console.log('  1. Start backend: cd ../RecommendMe-API && python -m uvicorn app.main:app --port 8000');
  console.log('  2. Start frontend: npm run dev');
  console.log('  3. Open http://localhost:5173 in your browser\n');
}

async function setupProduction() {
  console.log('\n☁️  Setting up for PRODUCTION/CLOUD DEPLOYMENT\n');

  const backendUrl = await question(
    'Enter your production backend URL (e.g., https://my-api.railway.app/v1): '
  );

  if (!backendUrl.trim()) {
    console.log('❌ Backend URL is required!');
    process.exit(1);
  }

  const config = `VITE_ENVIRONMENT=production
VITE_LOCAL_API_URL=http://localhost:8000/v1
VITE_PRODUCTION_API_URL=${backendUrl.trim()}
VITE_API_TIMEOUT=30000
VITE_DEBUG_API=false
`;

  fs.writeFileSync(envPath, config);
  console.log('✅ Created .env for production');
  console.log('\n📋 Next steps:');
  console.log('  1. Build: npm run build');
  console.log('  2. Deploy /dist folder to Railway, Vercel, or your host');
  console.log('  3. Verify backend is accessible at:', backendUrl, '\n');
}

async function interactiveSetup() {
  console.log('\n🚀 RecommendMe Frontend Setup\n');

  const choice = await question(
    'Where are you deploying? (1=local, 2=production): '
  );

  if (choice === '1') {
    await setupLocal();
  } else if (choice === '2') {
    await setupProduction();
  } else {
    console.log('❌ Invalid choice');
    process.exit(1);
  }

  rl.close();
}

// Determine which setup to run
const args = process.argv.slice(2);
const setupType = args[0] || 'interactive';

(async () => {
  try {
    switch (setupType) {
      case 'local':
        await setupLocal();
        process.exit(0);
      case 'prod':
      case 'production':
        await setupProduction();
        process.exit(0);
      default:
        await interactiveSetup();
    }
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
})();
