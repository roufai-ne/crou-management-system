const fs = require('fs');
const crypto = require('crypto');

// Read the login response
const data = JSON.parse(fs.readFileSync('response.json', 'utf8'));
const refreshTokenJWT = data.data.tokens.refreshToken;

console.log('=== DEBUG REFRESH TOKEN ===\n');
console.log('1. JWT token:', refreshTokenJWT.substring(0, 80) + '...\n');

// Decode JWT manually (just parse the payload, don't verify)
const parts = refreshTokenJWT.split('.');
if (parts.length === 3) {
  const payload = Buffer.from(parts[1], 'base64').toString('utf8');
  const decoded = JSON.parse(payload);

  console.log('2. Decoded JWT payload:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log();

  // Extract raw token
  const rawToken = decoded.token;
  console.log('3. Raw token from JWT:', rawToken);
  console.log();

  // Calculate hash
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  console.log('4. Token hash (SHA-256):', tokenHash);
  console.log();

  console.log('5. Checking last 3 refresh tokens in database...');
  console.log('   Run this SQL to see what is in the DB:');
  console.log(`   SELECT LEFT("tokenHash", 20) || '...' as hash_prefix, "expiresAt", "isRevoked" FROM refresh_tokens ORDER BY "createdAt" DESC LIMIT 3;`);
} else {
  console.log('ERROR: Invalid JWT format');
}
