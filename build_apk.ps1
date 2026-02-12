$ErrorActionPreference = "Stop"

# Use local SDK/JDK
$env:ANDROID_HOME = "d:\neon-worms.io\android\sdk"
$env:JAVA_HOME = "d:\neon-worms.io\android\jdk\jdk-17.0.2"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:_JAVA_OPTIONS = "-Xmx1024m"

Write-Host "Building APK with local SDK/JDK..."
Set-Location "$PSScriptRoot\android"

# Run Gradle
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build complete!"
    $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Host "APK located at: android\$apkPath"
        # Open output folder
        Invoke-Item (Split-Path $apkPath -Parent)
    }
}
else {
    Write-Host "Build failed."
}
