# Check Cache Headers for dealy.tw
# Run this in PowerShell: .\check-cache-headers.ps1

Write-Host "Checking cache headers for https://dealy.tw/..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "https://dealy.tw/" -Method Head -UseBasicParsing
    
    Write-Host "=== Cache Headers ===" -ForegroundColor Green
    Write-Host ""
    
    # Cache-Control
    if ($response.Headers['Cache-Control']) {
        Write-Host "Cache-Control: " -NoNewline -ForegroundColor Yellow
        Write-Host $response.Headers['Cache-Control']
    } else {
        Write-Host "Cache-Control: " -NoNewline -ForegroundColor Red
        Write-Host "NOT FOUND"
    }
    
    # CF-Cache-Status (Cloudflare)
    if ($response.Headers['CF-Cache-Status']) {
        Write-Host "CF-Cache-Status: " -NoNewline -ForegroundColor Yellow
        Write-Host $response.Headers['CF-Cache-Status']
    } else {
        Write-Host "CF-Cache-Status: " -NoNewline -ForegroundColor Gray
        Write-Host "NOT FOUND (may not be using Cloudflare)"
    }
    
    # X-Vercel-Cache
    if ($response.Headers['X-Vercel-Cache']) {
        Write-Host "X-Vercel-Cache: " -NoNewline -ForegroundColor Yellow
        Write-Host $response.Headers['X-Vercel-Cache']
    } else {
        Write-Host "X-Vercel-Cache: " -NoNewline -ForegroundColor Gray
        Write-Host "NOT FOUND"
    }
    
    # X-Cache (Vercel)
    if ($response.Headers['X-Cache']) {
        Write-Host "X-Cache: " -NoNewline -ForegroundColor Yellow
        Write-Host $response.Headers['X-Cache']
    }
    
    # Age header (how long cached)
    if ($response.Headers['Age']) {
        Write-Host "Age: " -NoNewline -ForegroundColor Yellow
        Write-Host $response.Headers['Age'] "seconds"
    }
    
    Write-Host ""
    Write-Host "=== All Headers ===" -ForegroundColor Green
    Write-Host ""
    $response.Headers | Format-Table -AutoSize
    
    Write-Host ""
    Write-Host "=== Analysis ===" -ForegroundColor Green
    Write-Host ""
    
    $cacheControl = $response.Headers['Cache-Control']
    if ($cacheControl -match "no-cache|no-store") {
        Write-Host "⚠️  WARNING: Found 'no-cache' or 'no-store' in Cache-Control" -ForegroundColor Red
        Write-Host "   This prevents Cloudflare from caching your pages!" -ForegroundColor Red
    } elseif ($cacheControl -match "public|s-maxage") {
        Write-Host "✅ GOOD: Cache-Control allows public caching" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  INFO: Cache-Control header present but may need review" -ForegroundColor Yellow
    }
    
    $cfStatus = $response.Headers['CF-Cache-Status']
    if ($cfStatus -eq "HIT") {
        Write-Host "✅ Cloudflare cache: HIT (page is cached)" -ForegroundColor Green
    } elseif ($cfStatus -eq "MISS") {
        Write-Host "ℹ️  Cloudflare cache: MISS (first request or cache expired)" -ForegroundColor Yellow
    } elseif ($cfStatus -eq "EXPIRED") {
        Write-Host "⚠️  Cloudflare cache: EXPIRED (revalidating)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use browser DevTools (F12) -> Network tab -> Check Response Headers" -ForegroundColor Yellow
}

