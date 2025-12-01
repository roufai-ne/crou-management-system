# Test de l'API Housing
$baseUrl = "http://localhost:3001/api"

Write-Host "`n=== Test API Housing ===" -ForegroundColor Cyan

# Test 1: Get Complexes
Write-Host "`n1. Test GET /housing/complexes" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/housing/complexes" -Method Get -Headers @{
        "Accept" = "application/json"
    }
    Write-Host "✅ Success - Complexes count: $($response.complexes.Count)" -ForegroundColor Green
    if ($response.complexes.Count -gt 0) {
        Write-Host "Sample complex:" -ForegroundColor Gray
        $response.complexes[0] | ConvertTo-Json -Depth 2
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 2: Get Rooms
Write-Host "`n2. Test GET /housing/rooms" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/housing/rooms" -Method Get -Headers @{
        "Accept" = "application/json"
    }
    Write-Host "✅ Success - Rooms count: $($response.rooms.Count)" -ForegroundColor Green
    if ($response.rooms.Count -gt 0) {
        Write-Host "Sample room:" -ForegroundColor Gray
        $response.rooms[0] | ConvertTo-Json -Depth 2
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 3: Get Beds
Write-Host "`n3. Test GET /housing/beds" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/housing/beds" -Method Get -Headers @{
        "Accept" = "application/json"
    }
    Write-Host "✅ Success - Beds count: $($response.beds.Count)" -ForegroundColor Green
    if ($response.beds.Count -gt 0) {
        Write-Host "Sample bed:" -ForegroundColor Gray
        $response.beds[0] | ConvertTo-Json -Depth 2
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
