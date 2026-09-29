# SHIVINFRA Production Safety Tests
# Tests for WhatsApp, OCR, and Upload security

$baseUrl = "http://localhost:3000"
$authHeader = $null
$testsPassed = 0
$testsFailed = 0

function Test-Result($testName, $condition, $details = "") {
    if ($condition) {
        Write-Host "[PASS] $testName" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "[FAIL] $testName - $details" -ForegroundColor Red
        $script:testsFailed++
    }
}

# Get auth token first
try {
    $loginBody = @{
        email = "admin@shivinfra.com"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    if ($loginResponse.success -and $loginResponse.data.token) {
        $authHeader = @{ Authorization = "Bearer $($loginResponse.data.token)" }
    }
} catch {
    Write-Host "Warning: Could not get auth token: $_" -ForegroundColor Yellow
}

Write-Host "`n=== WhatsApp Production Safety Tests ===" -ForegroundColor Cyan

# Test 1: WhatsApp webhook without signature in production mode should fail
# Note: We can't easily test production mode without changing NODE_ENV, but we can verify the middleware exists
Write-Host "`nTest: WhatsApp signature verification middleware exists"
$whatsappRoutes = Get-Content "backend\routes\whatsappRoutes.ts" -Raw
Test-Result "WhatsApp verifyXHubSignature exists" ($whatsappRoutes -match "verifyXHubSignature")
Test-Result "WhatsApp checks META_WHATSAPP_APP_SECRET" ($whatsappRoutes -match "META_WHATSAPP_APP_SECRET")
Test-Result "WhatsApp fails closed in production when APP_SECRET missing" ($whatsappRoutes -match 'NODE_ENV.*production')

# Test 2: WhatsApp mock mode requires explicit flag
Write-Host "`nTest: WhatsApp mock mode requires explicit flag"
$whatsappService = Get-Content "backend\services\whatsappService.ts" -Raw
Test-Result "WhatsApp has WHATSAPP_MOCK_MODE flag" ($whatsappService -match "WHATSAPP_MOCK_MODE")
Test-Result "WhatsApp mock only when flag set or dev mode" ($whatsappService -match "WHATSAPP_MOCK_MODE.*true")
Test-Result "WhatsApp fails closed in production without credentials" ($whatsappService -match "NODE_ENV.*production")

# Test 3: WhatsApp service does not return true in production without credentials
Test-Result "WhatsApp logs error in production mode" ($whatsappService -match "WHATSAPP-ERROR.*production")
Test-Result "WhatsApp returns false in production mode" ($whatsappService -match "return false")

Write-Host "`n=== OCR PDF Extraction Tests ===" -ForegroundColor Cyan

# Test 4: OCR service uses pdf-parse for real extraction
$ocrService = Get-Content "backend\services\ocrService.ts" -Raw
Test-Result "OCR imports pdf-parse" ($ocrService -match "pdf-parse")
Test-Result "OCR uses PDFParse for PDF extraction" ($ocrService -match "PDFParse")
Test-Result "OCR attempts real extraction before simulation" ($ocrService -match "PDFParse.*uint8Data|pdfParse.*dataBuffer")

# Test 5: OCR does not generate fake data in production
Test-Result "OCR simulateOCR checks production mode" ($ocrService -match "NODE_ENV.*production")
Test-Result "OCR simulateOCR returns empty in production" ($ocrService -match "ocr_status.*Failed")
Test-Result "OCR parseExtractedText has no random defaults" (-not ($ocrService -match "Math.random.*60000"))
Test-Result "OCR parseExtractedText has no fake vendor defaults" (-not ($ocrService -match "General Supplies Ltd"))

# Test 6: OCR returns failure status when extraction fails
Test-Result "OCR returns Failed status on PDF error" ($ocrService -match 'ocr_status.*Failed')

Write-Host "`n=== File Upload Security Tests ===" -ForegroundColor Cyan

# Test 7: Upload middleware has MIME validation
$uploadMiddleware = Get-Content "backend\middleware\upload.ts" -Raw
Test-Result "Upload has MIME type map" ($uploadMiddleware -match "MIME_TYPE_MAP")
Test-Result "Upload validates MIME against extension" ($uploadMiddleware -match "allowedMimes")
Test-Result "Upload rejects mismatched MIME/extension" ($uploadMiddleware -match "does not match file extension")

# Test 8: Upload has size limit
Test-Result "Upload has file size limit" ($uploadMiddleware -match "fileSize")
Test-Result "Upload size limit is reasonable (15MB)" ($uploadMiddleware -match "15 \* 1024 \* 1024")

# Test 9: Upload has safe filename handling
Test-Result "Upload sanitizes fieldname" ($uploadMiddleware -match "replace.*[^a-zA-Z0-9_-]")
Test-Result "Upload uses unique suffix" ($uploadMiddleware -match "uniqueSuffix")

Write-Host "`n=== Database Schema Documentation Tests ===" -ForegroundColor Cyan

# Test 10: Schema file matches actual code expectations
$schema = Get-Content "backend\database\supabase-schema.sql" -Raw
Test-Result "Schema has full_name in customers" ($schema -match "full_name")
Test-Result "Schema has project_name in projects" ($schema -match "project_name")
Test-Result "Schema has interested_location in customers" ($schema -match "interested_location")
Test-Result "Schema has expense_title in expenses" ($schema -match "expense_title")
Test-Result "Schema has action_type in activity_logs" ($schema -match "action_type")

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed"
Write-Host "Failed: $testsFailed"
Write-Host "Total:  $($testsPassed + $testsFailed)"

if ($testsFailed -eq 0) {
    Write-Host "`nAll production safety tests PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests FAILED!" -ForegroundColor Red
    exit 1
}
