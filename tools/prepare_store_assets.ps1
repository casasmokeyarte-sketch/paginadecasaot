Add-Type -AssemblyName System.Drawing

$projectRoot = "c:\Users\PC\Downloads\horizons-export-9c34d6a0-7f3d-4ce5-a2cd-77bc39639101"
$publicDir = Join-Path $projectRoot "public"
$outDir = Join-Path $publicDir "play_store_assets"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

function Create-AppIcon {
    param (
        [string]$SourcePath,
        [string]$TargetPath
    )
    Write-Output "Generating App Icon (512x512) from $SourcePath..."
    $src = [System.Drawing.Image]::FromFile($SourcePath)
    $bmp = New-Object System.Drawing.Bitmap(512, 512)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Keep it transparent
    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Draw image fitting the 512x512 area (with 96% scaling to avoid edge clipping)
    $size = 512
    $targetSize = [int]($size * 0.96)
    $offset = [int](($size - $targetSize) / 2)
    
    $g.DrawImage($src, $offset, $offset, $targetSize, $targetSize)
    
    $bmp.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
    Write-Output "App Icon saved to $TargetPath"
}

function Create-FeatureGraphic {
    param (
        [string]$SourcePath,
        [string]$TargetPath,
        [string]$BgType = "gradient", # "gradient" or "solid"
        [int]$LogoHeight = 350
    )
    Write-Output "Generating Feature Graphic (1024x500) using $SourcePath..."
    $src = [System.Drawing.Image]::FromFile($SourcePath)
    $bmp = New-Object System.Drawing.Bitmap(1024, 500)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Background
    if ($BgType -eq "gradient") {
        # Linear gradient from dark dark blue to deep violet (Neon Smoke / Tattoo vibes)
        $rect = New-Object System.Drawing.Rectangle(0, 0, 1024, 500)
        $color1 = [System.Drawing.ColorTranslator]::FromHtml("#050510") # App default dark background
        $color2 = [System.Drawing.ColorTranslator]::FromHtml("#1a082b") # Neon deep purple
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $color1, $color2, 45.0)
        $g.FillRectangle($brush, 0, 0, 1024, 500)
        $brush.Dispose()
    } else {
        # Solid dark color matching the app
        $color = [System.Drawing.ColorTranslator]::FromHtml("#050510")
        $brush = New-Object System.Drawing.SolidBrush($color)
        $g.FillRectangle($brush, 0, 0, 1024, 500)
        $brush.Dispose()
    }
    
    # Calculate aspect ratio of logo to fit into height $LogoHeight
    $ratio = $LogoHeight / $src.Height
    $newW = [int]($src.Width * $ratio)
    $newH = $LogoHeight
    
    # Check if width exceeds canvas width with margins
    if ($newW -gt 920) {
        $ratio = 920 / $src.Width
        $newW = 920
        $newH = [int]($src.Height * $ratio)
    }
    
    $posX = [int]((1024 - $newW) / 2)
    $posY = [int]((500 - $newH) / 2)
    
    $g.DrawImage($src, $posX, $posY, $newW, $newH)
    
    $bmp.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $g.Dispose()
    $bmp.Dispose()
    $src.Dispose()
    Write-Output "Feature Graphic saved to $TargetPath"
}

# Run generations
$logo2Path = Join-Path $publicDir "logo2.png"
$logoPath = Join-Path $publicDir "logo.png"

# 1. Generate App Icon (512x512)
if (Test-Path $logo2Path) {
    Create-AppIcon $logo2Path (Join-Path $outDir "app_icon_512.png")
} else {
    Write-Warning "logo2.png not found. Cannot generate app icon."
}

# 2. Generate Feature Graphic (1024x500)
if (Test-Path $logo2Path) {
    # Generate one with square logo in the center and gradient background
    Create-FeatureGraphic $logo2Path (Join-Path $outDir "feature_graphic_gradient_logo2.png") "gradient" 360
    # Generate one with square logo in the center and solid background
    Create-FeatureGraphic $logo2Path (Join-Path $outDir "feature_graphic_solid_logo2.png") "solid" 360
}

if (Test-Path $logoPath) {
    # Generate one with landscape logo in the center and gradient background
    Create-FeatureGraphic $logoPath (Join-Path $outDir "feature_graphic_gradient_logo.png") "gradient" 280
    # Generate one with landscape logo in the center and solid background
    Create-FeatureGraphic $logoPath (Join-Path $outDir "feature_graphic_solid_logo.png") "solid" 280
}

Write-Output "--- Finished generating Play Store assets! ---"
Write-Output "You can find your assets in:"
Write-Output (Resolve-Path $outDir).Path
