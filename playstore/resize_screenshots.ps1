param(
    [Parameter(Mandatory=$true)][string]$Path,
    [int]$MaxDim = 1600
)

Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile($Path)
$w = $img.Width
$h = $img.Height

if ($w -le $MaxDim -and $h -le $MaxDim) {
    Write-Output "SKIP ${Path}: ${w}x${h} already <= ${MaxDim}px"
    $img.Dispose()
    return
}

if ($w -ge $h) {
    $newW = $MaxDim
    $newH = [int]($h * $MaxDim / $w)
} else {
    $newH = $MaxDim
    $newW = [int]($w * $MaxDim / $h)
}

$bmp = New-Object System.Drawing.Bitmap $newW, $newH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $newW, $newH)
$g.Dispose()
$img.Dispose()

$tmp = "${Path}.tmp"
$bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Move-Item -Path $tmp -Destination $Path -Force
Write-Output "RESIZED ${Path}: ${w}x${h} -> ${newW}x${newH}"
