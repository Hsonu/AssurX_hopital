Add-Type -AssemblyName System.Drawing
$srcPath = "c:\Users\SunAdmin\Desktop\SONU\New folder\site\AssurX_hopital\assets\smiling_specialist.png"
$destPath = "c:\Users\SunAdmin\Desktop\SONU\New folder\site\AssurX_hopital\assets\smiling_specialist_trans.png"

Write-Host "Loading image..."
$img = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap($img)

Write-Host "Getting reference background color..."
$refColor = $bmp.GetPixel(0, 0)
Write-Host "Ref Color: R=$($refColor.R), G=$($refColor.G), B=$($refColor.B)"

Write-Host "Processing pixels..."
for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $c = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($c.R - $refColor.R) + [Math]::Abs($c.G - $refColor.G) + [Math]::Abs($c.B - $refColor.B)
        $isBg = ($c.R -gt 210 -and $c.G -gt 210 -and $c.B -gt 210 -and [Math]::Abs($c.R - $c.G) -lt 12 -and [Math]::Abs($c.G - $c.B) -lt 12)
        if ($diff -lt 35 -or $isBg) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        }
    }
}

Write-Host "Saving processed image..."
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$img.Dispose()
$bmp.Dispose()
Write-Host "Background removed successfully and saved to: $destPath"
