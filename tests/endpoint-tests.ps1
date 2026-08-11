param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SHIVINFRA ENDPOINT TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

function Invoke-Test {
    param(
        [string]$Name,
        [string]$Uri,
        [string]$Method = "GET",
        [object]$Body,
        [hashtable]$Headers,
        [int]$ExpectedStatus = 200
    )

    Write-Host ""
    Write-Host "TEST: $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Uri" -ForegroundColor Gray
    Write-Host "  METHOD: $Method" -ForegroundColor Gray

    $hdrs = @{}
    if ($Headers) { $hdrs = $Headers }
    $hdrs["Content-Type"] = "application/json"

    $bodyJson = if ($Body) { $Body | ConvertTo-Json -Depth 10 } else { $null }

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $hdrs
            UseBasicParsing = $true
            TimeoutSec = 30
        }
        if ($bodyJson) { $params.Body = $bodyJson }

        $response = Invoke-WebRequest @params -ErrorAction SilentlyContinue
        if (-not $response) {
            Write-Host "  STATUS: TIMEOUT/ERROR" -ForegroundColor Red
            Write-Host "  [FAIL] Request timed out or failed" -ForegroundColor Red
            return @{ Success = $false; Response = $null; Content = $null }
        }
        $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        $contentStr = if ($content) { $content | ConvertTo-Json -Depth 10 -Compress } else { $response.Content }

        Write-Host "  STATUS: $($response.StatusCode)" -ForegroundColor $(if ($response.StatusCode -eq $ExpectedStatus) { "Green" } else { "Red" })
        Write-Host "  RESULT:" $contentStr.Substring(0, [Math]::Min(500, $contentStr.Length)) -ForegroundColor Gray

        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host "  [PASS]" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Expected $ExpectedStatus" -ForegroundColor Red
        }
        return @{ Success = ($response.StatusCode -eq $ExpectedStatus); Response = $response; Content = $content }
    }
    catch [System.Net.WebException] {
        $webResponse = $_.Exception.Response
        if ($webResponse -and $webResponse -is [System.Net.HttpWebResponse]) {
            $statusCode = $webResponse.StatusCode.value__
            $responseStream = $webResponse.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($responseStream)
            $contentStr = $reader.ReadToEnd()
            $reader.Close()
            $responseStream.Close()
            $content = $contentStr | ConvertFrom-Json -ErrorAction SilentlyContinue

            Write-Host "  STATUS: $statusCode" -ForegroundColor $(if ($statusCode -eq $ExpectedStatus) { "Green" } else { "Red" })
            Write-Host "  RESULT:" $contentStr.Substring(0, [Math]::Min(500, $contentStr.Length)) -ForegroundColor Gray

            if ($statusCode -eq $ExpectedStatus) {
                Write-Host "  [PASS]" -ForegroundColor Green
            } else {
                Write-Host "  [FAIL] Expected $ExpectedStatus" -ForegroundColor Red
            }
            $respObj = New-Object System.Management.Automation.PSObject
            $respObj | Add-Member -NotePropertyName StatusCode -NotePropertyValue $statusCode
            $respObj | Add-Member -NotePropertyName Content -NotePropertyValue $contentStr
            return @{ Success = ($statusCode -eq $ExpectedStatus); Response = $respObj; Content = $content }
        }
        Write-Host "  STATUS: ERROR" -ForegroundColor Red
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Response = $null; Content = $null }
    }
    catch {
        Write-Host "  STATUS: ERROR" -ForegroundColor Red
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Response = $null; Content = $null }
    }
}

function New-JwtToken {
    param(
        [string]$Email = "test@shivinfra.com",
        [string]$Role = "Admin",
        [string]$UserId = "40d7f92f-29fc-4661-baeb-61eadbbd1739",
        [string]$CompanyId = "3e9e9ae1-8593-473f-9aa3-9bcee469d795"
    )

    $header = @{
        alg = "HS256"
        typ = "JWT"
    }

    $payload = @{
        id = $UserId
        company_id = $CompanyId
        email = $Email
        role = $Role
    }

    $headerJson = $header | ConvertTo-Json -Compress
    $payloadJson = $payload | ConvertTo-Json -Compress

    $headerB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($headerJson)).Replace("+", "-").Replace("/", "_").TrimEnd("=")
    $payloadB64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payloadJson)).Replace("+", "-").Replace("/", "_").TrimEnd("=")

    $jwtSecret = $env:JWT_SECRET
    if (-not $jwtSecret) { $jwtSecret = "shivinfra_jwt_secret_2026" }

    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($jwtSecret)
    $signature = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes("$headerB64.$payloadB64"))
    $sigB64 = [Convert]::ToBase64String($signature).Replace("+", "-").Replace("/", "_").TrimEnd("=")

    return "$headerB64.$payloadB64.$sigB64"
}

# ==========================================
# 1. HEALTH CHECK
# ==========================================
Invoke-Test -Name "Server Health" -Uri "$BaseUrl/health" -Method "GET"

# ==========================================
# 2. AI HEALTH
# ==========================================
Invoke-Test -Name "AI Health" -Uri "$BaseUrl/api/v1/ai/health" -Method "GET"

# ==========================================
# 3. AI STATUS
# ==========================================
Invoke-Test -Name "AI Status" -Uri "$BaseUrl/api/v1/ai/status" -Method "GET"

# ==========================================
# 4. Generate JWT Token
# ==========================================
Write-Host ""
Write-Host "TEST: JWT Token Generation" -ForegroundColor Yellow
$token = New-JwtToken -Email "admin@shivinfra.com" -Role "Admin"
Write-Host "  TOKEN: $($token.Substring(0, 50))..." -ForegroundColor Gray
Write-Host "  [PASS]" -ForegroundColor Green

$authHeaders = @{ Authorization = "Bearer $token" }

# ==========================================
# 5. AI CHAT (no auth should now fail - SECURITY FIXED)
# ==========================================
Invoke-Test -Name "AI Chat - no auth (should fail)" -Uri "$BaseUrl/api/v1/ai/chat" -Method "POST" -Body @{
    message = "Show me all projects"
} -ExpectedStatus 401

# ==========================================
# 6. AI CHAT - General conversation (with JWT)
# ==========================================
Invoke-Test -Name "AI Chat - general conversation" -Uri "$BaseUrl/api/v1/ai/chat" -Method "POST" -Body @{
    message = "What is the status of project Shiv Milan"
} -Headers $authHeaders

# ==========================================
# 7. AI Chat - intent detection (with JWT)
# ==========================================
Invoke-Test -Name "AI Chat - add expense" -Uri "$BaseUrl/api/v1/ai/chat" -Method "POST" -Body @{
    message = "add expense 5000 for materials"
} -Headers $authHeaders

# ==========================================
# 8. Expense - Create
# ==========================================
Invoke-Test -Name "Expense Create (with JWT)" -Uri "$BaseUrl/api/v1/expenses" -Method "POST" -Body @{
    expense_title = "Cement Purchase"
    amount = 25000
    expense_category = "Materials"
    payment_method = "Cash"
    description = "Cement for project"
} -Headers $authHeaders -ExpectedStatus 201

# ==========================================
# 9. Expense - List
# ==========================================
Invoke-Test -Name "Expense List (with JWT)" -Uri "$BaseUrl/api/v1/expenses" -Method "GET" -Headers $authHeaders

# ==========================================
# 10. Expense - Update
# ==========================================
$expensesResult = Invoke-Test -Name "Expense List for Update" -Uri "$BaseUrl/api/v1/expenses" -Method "GET" -Headers $authHeaders
$expId = if ($expensesResult.Content -and $expensesResult.Content.data -and $expensesResult.Content.data.Count -gt 0) {
    $expensesResult.Content.data[0].id
} else { "nonexistent-id" }
Write-Host "  Using expense ID: $expId" -ForegroundColor Gray
Invoke-Test -Name "Expense Update" -Uri "$BaseUrl/api/v1/expenses/$expId" -Method "PUT" -Body @{
    expense_title = "Updated Cement Purchase"
    amount = 30000
} -Headers $authHeaders

# ==========================================
# 11. Expense - Delete
# ==========================================
Invoke-Test -Name "Expense Delete" -Uri "$BaseUrl/api/v1/expenses/$expId" -Method "DELETE" -Headers $authHeaders

# ==========================================
# 12. Expense - No Auth (security check)
# ==========================================
Invoke-Test -Name "Expense Create (NO AUTH - should fail)" -Uri "$BaseUrl/api/v1/expenses" -Method "POST" -Body @{
    expense_title = "Test"
    amount = 100
} -ExpectedStatus 401

# ==========================================
# 13. Expense - Customer role (permission check)
# ==========================================
$customerToken = New-JwtToken -Email "customer@shivinfra.com" -Role "Customer"
$customerHeaders = @{ Authorization = "Bearer $customerToken" }
Invoke-Test -Name "Expense Delete as Customer (should fail)" -Uri "$BaseUrl/api/v1/expenses/$expId" -Method "DELETE" -Headers $customerHeaders -ExpectedStatus 403

# ==========================================
# 14. Report - Generate (with JWT)
# ==========================================
Invoke-Test -Name "Report Generate (with JWT)" -Uri "$BaseUrl/api/v1/reports/generate?type=Finance&format=PDF" -Method "GET" -Headers $authHeaders

# ==========================================
# 15. Report - No Auth (should fail)
# ==========================================
Invoke-Test -Name "Report Generate (NO AUTH)" -Uri "$BaseUrl/api/v1/reports/generate?type=Finance&format=PDF" -Method "GET" -ExpectedStatus 401

# ==========================================
# 16. WhatsApp Webhook - Verify (GET)
# ==========================================
Invoke-Test -Name "WhatsApp Webhook Verify" -Uri "$BaseUrl/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=MY_VERIFY_TOKEN&hub.challenge=123456" -Method "GET" -ExpectedStatus 200

# ==========================================
# 17. WhatsApp Webhook - Incoming message (POST)
# ==========================================
$whatsappPayload = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            id = "entry1"
            changes = @(
                @{
                    value = @{
                        messages = @(
                            @{
                                from = "919999999999"
                                id = "wamid.test123"
                                type = "text"
                                text = @{ body = "Hello, I want to know about projects" }
                                timestamp = "1234567890"
                            }
                        )
                    }
                }
            )
        }
    )
}
Invoke-Test -Name "WhatsApp Webhook - Incoming message" -Uri "$BaseUrl/api/v1/whatsapp/webhook" -Method "POST" -Body $whatsappPayload

# ==========================================
# 18. WhatsApp AI Handler (via ai route)
# ==========================================
Invoke-Test -Name "WhatsApp AI Handler" -Uri "$BaseUrl/api/v1/ai/whatsapp" -Method "POST" -Body @{
    message = "Show me my projects"
    company_id = "3e9e9ae1-8593-473f-9aa3-9bcee469d795"
}

# ==========================================
# 19. AI Memory (with JWT)
# ==========================================
Invoke-Test -Name "AI Memory Fetch" -Uri "$BaseUrl/api/v1/ai/memory" -Method "GET" -Headers $authHeaders

# ==========================================
# 20. AI Intent Detection (with JWT)
# ==========================================
Invoke-Test -Name "AI Intent Detection" -Uri "$BaseUrl/api/v1/ai/intent" -Method "POST" -Body @{
    message = "Add a new project called Shiv Milan in Pune"
} -Headers $authHeaders

# ==========================================
# 21. Simple AI Chat (with JWT)
# ==========================================
Invoke-Test -Name "Simple AI Chat" -Uri "$BaseUrl/api/v1/ai/simple" -Method "POST" -Body @{
    message = "Hello, how are you?"
} -Headers $authHeaders

# ==========================================
# 22. Login test (register first)
# ==========================================
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"

Invoke-Test -Name "Register User" -Uri "$BaseUrl/api/v1/auth/register" -Method "POST" -Body @{
    company_id = "3e9e9ae1-8593-473f-9aa3-9bcee469d795"
    name = "Test Admin"
    email = "testadmin$testTimestamp@shivinfra.com"
    password = "password123"
    phone = "919999$testTimestamp"
    role = "Admin"
} -ExpectedStatus 201

Invoke-Test -Name "Login User" -Uri "$BaseUrl/api/v1/auth/login" -Method "POST" -Body @{
    email = "testadmin$testTimestamp@shivinfra.com"
    password = "password123"
} -ExpectedStatus 200

# ==========================================
# 23. Project CRUD
# ==========================================
Invoke-Test -Name "Project Create" -Uri "$BaseUrl/api/v1/projects" -Method "POST" -Body @{
    project_name = "Test Project Alpha"
    location = "Pune"
    city = "Pune"
    state = "Maharashtra"
    pincode = "411001"
    price = 5000000
    project_type = "Residential"
} -Headers $authHeaders -ExpectedStatus 201

Invoke-Test -Name "Project Search" -Uri "$BaseUrl/api/v1/projects?query=Alpha" -Method "GET" -Headers $authHeaders

# ==========================================
# 24. Customers CRUD
# ==========================================
Invoke-Test -Name "Customer Create" -Uri "$BaseUrl/api/v1/customers" -Method "POST" -Body @{
    full_name = "Test Customer $(Get-Date -Format 'HHmmss')"
    phone = "9198765$(Get-Date -Format 'HHmm')"
    email = "testcustomer$(Get-Date -Format 'HHmmss')@example.com"
    city = "Pune"
    budget = 8000000
    source = "Web"
} -Headers $authHeaders -ExpectedStatus 201

Invoke-Test -Name "Customer Search" -Uri "$BaseUrl/api/v1/customers" -Method "GET" -Headers $authHeaders

# ==========================================
# 25. Leads CRUD
# ==========================================
Invoke-Test -Name "Lead Create" -Uri "$BaseUrl/api/v1/leads" -Method "POST" -Body @{
    requirement = "2 BHK apartment needed in Pune"
    budget = 6000000
    preferred_location = "Wakad, Pune"
    lead_source = "Website"
    status = "New"
    remarks = "Interested in ready possession"
} -Headers $authHeaders -ExpectedStatus 201

Invoke-Test -Name "Lead Search" -Uri "$BaseUrl/api/v1/leads" -Method "GET" -Headers $authHeaders

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTS COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
