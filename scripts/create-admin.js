#!/usr/bin/env node

/**
 * Helper script to create the first admin account after deployment
 * Usage: node scripts/create-admin.js
 */

const readline = require('readline');
const https = require('https');
const http = require('http');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('\n=== Lanka Chemist - Create Admin Account ===\n');

  const appUrl = await question('Enter your app URL (e.g., https://your-app.vercel.app): ');
  const email = await question('Admin email: ');
  const password = await question('Admin password (min 8 chars, uppercase, lowercase, digit): ');
  const name = await question('Admin name: ');

  rl.close();

  console.log('\nCreating admin account...');

  const url = new URL('/api/admin/setup', appUrl.trim());
  const protocol = url.protocol === 'https:' ? https : http;

  const data = JSON.stringify({
    email: email.trim(),
    password: password.trim(),
    name: name.trim()
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = protocol.request(url, options, (res) => {
    let body = '';

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(body);

        if (res.statusCode === 201) {
          console.log('\n✅ Success! Admin account created.');
          console.log(`Email: ${email.trim()}`);
          console.log(`\nYou can now login at: ${appUrl.trim()}/admin/login`);
        } else {
          console.error('\n❌ Error:', response.error || 'Failed to create admin account');
          if (response.errors) {
            console.error('Validation errors:', response.errors);
          }
        }
      } catch (err) {
        console.error('\n❌ Error parsing response:', err.message);
        console.error('Response body:', body);
      }
    });
  });

  req.on('error', (err) => {
    console.error('\n❌ Request failed:', err.message);
  });

  req.write(data);
  req.end();
}

createAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
