import json
import subprocess

# Read the login response
with open('/tmp/response.json', 'r') as f:
    data = json.load(f)

refresh_token = data['data']['tokens']['refreshToken']
print(f"Refresh token: {refresh_token[:50]}...")

# Test refresh endpoint
result = subprocess.run([
    'curl', '-s', '-X', 'POST',
    'http://localhost:3001/api/auth/refresh',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({'refreshToken': refresh_token})
], capture_output=True, text=True)

print("\nRefresh response:")
print(result.stdout)
