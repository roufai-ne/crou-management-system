const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Read the login response
const data = JSON.parse(fs.readFileSync('response.json', 'utf8'));
const refreshTokenJWT = data.data.tokens.refreshToken;

console.log('=== DEBUG REFRESH TOKEN ===\n');
console.log('1. JWT token:', refreshTokenJWT.substring(0, 50) + '...\n');

// Decode JWT
const decoded = jwt.decode(refreshTokenJWT);
console.log('2. Decoded JWT:');
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

console.log('5. This hash should be in the database refresh_tokens table');
console.log('   You can verify with:');
console.log(`   SELECT "tokenHash", "expiresAt", "isRevoked" FROM refresh_tokens WHERE "tokenHash" = '${tokenHash}';`);
