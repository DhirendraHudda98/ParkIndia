#!/usr/bin/env node
/**
 * Quick Mappls Key Validator
 * Usage: node validate-mappls-key.mjs YOUR_KEY_HERE
 */

const apiKey = process.argv[2];

if (!apiKey) {
  console.log(`
❌ Please provide an API key

Usage:
  node validate-mappls-key.mjs YOUR_KEY_HERE

Example:
  node validate-mappls-key.mjs abc123def456ghi789jkl012mno345pqr
  `);
  process.exit(1);
}

console.log('\n🔍 Validating Mappls API Key...\n');
console.log('Key format: ' + apiKey.substring(0, 8) + '****' + apiKey.substring(apiKey.length - 4));

async function validateKey() {
  // Test 1: SDK URL
  console.log('\n1️⃣  Testing Maps SDK URL...');
  const sdkUrl = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/map_load?v=1.5&plugins=all`;
  console.log(`   URL: ${sdkUrl.substring(0, 60)}...`);
  
  try {
    const response = await fetch(sdkUrl, { timeout: 5000 });
    if (response.ok || response.status === 200) {
      console.log('   ✅ Maps SDK: Valid');
    } else if (response.status === 403 || response.status === 401) {
      console.log('   ❌ Maps SDK: Invalid key or unauthorized');
    } else {
      console.log(`   ⚠️  Maps SDK: Status ${response.status}`);
    }
  } catch (err) {
    console.log('   ⚠️  Maps SDK: Could not verify (connection issue)');
  }
  
  // Test 2: Atlas API (Address Search)
  console.log('\n2️⃣  Testing Atlas API (Address Search)...');
  const atlasUrl = `https://atlas.mappls.com/api/places/textsearch/json?query=Mumbai&region=IND`;
  
  try {
    const response = await fetch(atlasUrl, {
      headers: { 'Authorization': `bearer ${apiKey}` },
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.suggestedLocations && data.suggestedLocations.length > 0) {
        console.log(`   ✅ Atlas API: Valid (found ${data.suggestedLocations.length} places)`);
      } else {
        console.log('   ✅ Atlas API: Valid (no results for query)');
      }
    } else if (response.status === 401) {
      console.log('   ❌ Atlas API: Unauthorized (invalid key or no Atlas service)');
    } else if (response.status === 403) {
      console.log('   ❌ Atlas API: Forbidden (domain not allowed)');
    } else {
      console.log(`   ⚠️  Atlas API: Status ${response.status}`);
    }
  } catch (err) {
    console.log('   ⚠️  Atlas API: Could not verify (connection issue)');
    console.log(`      Error: ${err.message}`);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('✅ If both tests passed, your key is ready!');
  console.log('\n📝 Update your .env file:');
  console.log(`   VITE_MAPPLS_API_KEY=${apiKey}`);
  console.log('\n🚀 Then restart your dev server:');
  console.log('   npm run dev');
  console.log('═'.repeat(50) + '\n');
}

validateKey();
