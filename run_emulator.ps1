$ErrorActionPreference = "Stop"

# Paths
$sdkRoot = "d:\neon-worms.io\android\sdk"
$jdkRoot = "d:\neon-worms.io\android\jdk"
# Find JDK folder
$jdkFolder = Get-ChildItem -Path $jdkRoot -Directory | Select-Object -First 1
$javaHome = $jdkFolder.FullName

# Set Env
$env:ANDROID_HOME = $sdkRoot
$env:JAVA_HOME = $javaHome
$env:PATH = "$javaHome\bin;$sdkRoot\cmdline-tools\latest\bin;$sdkRoot\platform-tools;$sdkRoot\emulator;$env:PATH"

# Check AVD
Write-Host "Checking AVD..."
& avdmanager list avd

# Launch Emulator
Write-Host "Launching Emulator pixel_test..."
$emulatorExe = "$sdkRoot\emulator\emulator.exe"
Start-Process -FilePath $emulatorExe -ArgumentList "-avd pixel_test -no-snapshot-load -no-snapshot-save -gpu swiftshader_indirect -memory 1024" -WindowStyle Minimized

Write-Host "Emulator launched in background. Please wait for it to boot."
