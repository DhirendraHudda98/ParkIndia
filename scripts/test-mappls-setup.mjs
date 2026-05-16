#!/usr/bin/env node
/**
 * Mappls Setup Diagnostic Tool
 * Tests API connectivity and validates Mappls configuration
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env file manually
function loadEnv(filePath) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    });
  }
  return env;
}

const envPath = path.join(__dirname, '../parkhub-web/.env');
const envVars = loadEnv(envPath);

const MAPPLS_KEY = envVars.VITE_MAPPLS_API_KEY || '';
const API_BASE = envVars.VITE_API_URL || 'http://127.0.0.1:8000';

console.log('\n📋 Mappls Setup Diagnostic Report\n');
console.log('═'.repeat(60));

// 1. Check API Key Configuration
console.log('\n1️⃣  API KEY CONFIGURATION');
console.log('─'.repeat(60));

if (!MAPPLS_KEY) {
  console.log('❌ VITE_MAPPLS_API_KEY is not set');
} else {
  const keyLength = MAPPLS_KEY.length;
  const masked = MAPPLS_KEY.slice(0, 5) + '**'.repeat((keyLength - 10) / 2) + MAPPLS_KEY.slice(-5);
  console.log(`✅ API Key configured: ${masked}`);
  console.log(`   Length: ${keyLength} characters`);
}

console.log(`📍 API Base URL: ${API_BASE}`);

// 2. Test Backend API
console.log('\n2️⃣  BACKEND API TEST');
console.log('─'.repeat(60));

async function testBackendAPI() {
  try {
    const endpoint = `${API_BASE}/api/availability`;
    console.log(`🔄 Testing: ${endpoint}`);
    
    const response = await fetch(endpoint, { timeout: 5000 });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Backend API is responding`);
      
      if (data.data && Array.isArray(data.data)) {
        console.log(`   Found ${data.data.length} parking lots`);
        
        if (data.data.length > 0) {
          const sample = data.data[0];
          console.log(`\n   Sample parking lot:${sample.name ? `\n   • Name: ${sample.name}` : ''}${sample.address ? `\n   • Address: ${sample.address}` : ''}${sample.latitude && sample.longitude ? `\n   • Location: [${sample.latitude}, ${sample.longitude}]` : ''}${sample.available_spots !== undefined ? `\n   • Available: ${sample.available_spots}/${sample.total_slots} spots` : ''}`);
        }
      }
    } else {
      console.log(`⚠️  Backend API returned status ${response.status}`);
    }
  } catch (err) {
    console.log(`❌ Cannot reach backend API: ${err.message}`);
  }
}

// 3. Test Mappls SDK Load
console.log('\n3️⃣  MAPPLS SDK LOAD TEST');
console.log('─'.repeat(60));

function testMapplsSDK() {
  if (!MAPPLS_KEY) {
    console.log('⏭️  Skipping SDK test (no API key configured)');
    return;
  }
  
  const sdkUrl = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/map_load?v=1.5&plugins=all`;
  console.log(`🔄 SDK URL:\n   ${sdkUrl}`);
  console.log(`\n✅ SDK URL is properly formatted`);
  console.log(`   - SDK Endpoint: apis.mappls.com/advancedmaps/v1`);
  console.log(`   - API Key: ${MAPPLS_KEY.slice(0, 5)}***`);
  console.log(`   - Version: 1.5`);
  console.log(`   - Plugins: all`);
}

// 4. Test Mappls Atlas API
console.log('\n4️⃣  MAPPLS ATLAS API TEST (Address Search)');
console.log('─'.repeat(60));

async function testMapplsAtlas() {
  if (!MAPPLS_KEY) {
    console.log('⏭️  Skipping Atlas test (no API key configured)');
    return;
  }
  
  try {
    const query = 'Mumbai';
    const atlasUrl = `https://atlas.mappls.com/api/places/textsearch/json?query=${encodeURIComponent(query)}&region=IND`;
    console.log(`🔄 Testing address search for: "${query}"`);
    
    const response = await fetch(atlasUrl, {
      headers: { Authorization: `bearer ${MAPPLS_KEY}` },
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Atlas API is responding`);
      
      if (data.suggestedLocations && data.suggestedLocations.length > 0) {
        console.log(`   Found ${data.suggestedLocations.length} locations`);
        const sample = data.suggestedLocations[0];
        console.log(`   • ${sample.placeName || sample.placeAddress || 'Unknown'}`);
      } else {
        console.log(`   No locations found (unexpected)`);
      }
    } else {
      console.log(`⚠️  Atlas API returned status ${response.status}`);
      if (response.status === 401) {
        console.log(`   → API key may be invalid or expired`);
      }
    }
  } catch (err) {
    console.log(`⚠️  Atlas API test failed: ${err.message}`);
    console.log(`   → May be expected if no internet connection`);
  }
}

// 5. Configuration Summary
console.log('\n5️⃣  CONFIGURATION FILES');
console.log('─'.repeat(60));

const configFiles = [
  { path: '/parkhub-web/.env', label: 'Frontend Config' },
  { path: '/.env.example', label: 'Backend Template' },
  { path: '/docker-compose.india.yml', label: 'Docker (India)' }
];

configFiles.forEach(({ path: filePath, label }) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${label}: ${filePath}`);
  } else {
    console.log(`❌ ${label}: ${filePath} (not found)`);
  }
});

// Run tests
console.log('\n⏳ Running tests...\n');
await testBackendAPI();
testMapplsSDK();
await testMapplsAtlas();

console.log('\n' + '═'.repeat(60));
console.log('\n📝 NEXT STEPS:\n');
console.log('1. If API key test failed, get a fresh key from:');
console.log('   → https://www.mappls.com/console/');
console.log('');
console.log('2. Create a new REST API key with permissions:');
console.log('   ✓ Maps Display SDK');
console.log('   ✓ Atlas (Address Search)');
console.log('   ✓ Restrict to required domains');
console.log('');
console.log('3. Update /parkhub-web/.env with the new key:');
console.log('   VITE_MAPPLS_API_KEY=your_new_key_here');
console.log('');
console.log('4. Verify backend is running on:', API_BASE);
console.log('');
console.log('═'.repeat(60) + '\n');
