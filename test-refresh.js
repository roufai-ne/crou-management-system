const fs = require('fs');
const { execSync } = require('child_process');

// Read the login response
const data = JSON.parse(fs.readFileSync('response.json', 'utf8'));
const refreshToken = data.data.tokens.refreshToken;

console.log(`Refresh token: ${refreshToken.substring(0, 50)}...`);
console.log('\nTesting refresh endpoint...\n');

// Test refresh endpoint
try {
  const result = execSync(`curl -s -X POST http://localhost:3001/api/auth/refresh -H "Content-Type: application/json" -d "{\\"refreshToken\\":\\"${refreshToken}\\"}"`, {
    encoding: 'utf8'
  });

  console.log('Refresh response:');
  console.log(result);

  const response = JSON.parse(result);
  if (response.success) {
    console.log('\n✓ Refresh token test PASSED');
  } else {
    console.log('\n✗ Refresh token test FAILED');
  }
} catch (error) {
  console.error('Error:', error.message);
}
