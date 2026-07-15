Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("c:\Users\SunAdmin\Desktop\SONU\New folder\site\AssurX_hopital\assets\smiling_specialist_trans.png")
$bmp = New-Object System.Drawing.Bitmap($img)
$w = $bmp.Width
$h = $bmp.Height
Write-Host "Width: $w, Height: $h"

$transparent = 0
$whiteish = 0
$other = 0

for ($x = 0; $x -lt $w; $x += 10) {
    for ($y = 0; $y -lt $h; $y += 10) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -eq 0) {
            $transparent++
        } elseif ($c.R -gt 200 -and $c.G -gt 200 -and $c.B -gt 200) {
            $whiteish++
        } else {
            $other++
        }
    }
}

Write-Host "Sampled pixels statistics for smiling_specialist_trans.png:"
Write-Host "Transparent: $transparent"
Write-Host "White-ish (>200 R,G,B): $whiteish"
Write-Host "Other: $other"

$img.Dispose()
$bmp.Dispose()
