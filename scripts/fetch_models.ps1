$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ModelsDir = Join-Path (Split-Path -Parent $ScriptDir) "models"

Write-Host "== Vision model ==" -ForegroundColor Cyan
$VisionDir = Join-Path $ModelsDir "vision"
if (-not (Test-Path $VisionDir)) { New-Item -ItemType Directory -Path $VisionDir | Out-Null }

$VisionRepo = "haythembs/plant_disease_detection_vison_models"
$VisionFiles = @(
    "mobilenetv4_conv_small_fp32.onnx",
    "mobilenetv4_conv_small_fp32.onnx.data"
)

foreach ($f in $VisionFiles) {
    $dest = Join-Path $VisionDir $f
    if (Test-Path $dest) {
        Write-Host "  already present: $f" -ForegroundColor Yellow
        continue
    }
    Write-Host "  downloading: $f" -ForegroundColor Green
    $url = "https://huggingface.co/$VisionRepo/resolve/main/$f"
    curl.exe -L -o $dest $url
}
Write-Host "Vision model files are in $VisionDir`n"
