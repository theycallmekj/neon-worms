$ErrorActionPreference = "Stop"

# Paths
$sdkRoot = "d:\neon-worms.io\android\sdk"
$cmdlineZip = "$sdkRoot\cmdline-tools.zip"
$cmdlineDir = "$sdkRoot\cmdline-tools"
$latestDir = "$cmdlineDir\latest"

# 0. Setup JDK 17
$jdkRoot = "d:\neon-worms.io\android\jdk"
$jdkZip = "$jdkRoot\openjdk.zip"
Write-Host "Setting up JDK 17..."
if (Test-Path $jdkZip) {
    Expand-Archive -Path $jdkZip -DestinationPath $jdkRoot -Force
    # Find the extracted folder (jdk-17.0.2)
    $jdkFolder = Get-ChildItem -Path $jdkRoot -Directory | Select-Object -First 1
    if ($jdkFolder) {
        $javaHome = $jdkFolder.FullName
        Write-Host "Using JAVA_HOME: $javaHome"
        $env:JAVA_HOME = $javaHome
        $env:PATH = "$javaHome\bin;$env:PATH"
        
        # Persist JAVA_HOME for user? Maybe not necessary if we run everything from script or session
        [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$javaHome\bin*") {
             [Environment]::SetEnvironmentVariable("PATH", "$javaHome\bin;$currentPath", "User")
        }
    }
}

# 1. Unzip safe
Write-Host "Unzipping cmdline-tools..."
$tempDir = "$sdkRoot\temp_extract"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null
Expand-Archive -Path $cmdlineZip -DestinationPath $tempDir -Force

# 2. Restructure
Write-Host "Restructuring..."
# We want: android/sdk/cmdline-tools/latest/bin
# Zip gives: cmdline-tools/bin (inside temp)

$source = "$tempDir\cmdline-tools"
if (Test-Path $source) {
    # Prepare destination: android/sdk/cmdline-tools
    if (!(Test-Path $cmdlineDir)) { New-Item -ItemType Directory -Path $cmdlineDir | Out-Null }
    
    # Destination final: android/sdk/cmdline-tools/latest
    if (Test-Path $latestDir) { Remove-Item -Recurse -Force $latestDir }
    
    Move-Item -Path $source -Destination $latestDir -Force -ErrorAction Continue
    if (!$?) {
        Write-Host "Move failed, trying Copy..."
        Copy-Item -Path $source -Destination $latestDir -Recurse -Force
    }
}
Start-Sleep -Seconds 2
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue

# 3. Set Environment persistently
Write-Host "Setting environment variables..."
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkRoot, "User")
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$latestDir\bin*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$latestDir\bin;$sdkRoot\platform-tools;$sdkRoot\emulator", "User")
}

# Set for current session too
$env:ANDROID_HOME = $sdkRoot
$env:PATH += ";$latestDir\bin;$sdkRoot\platform-tools;$sdkRoot\emulator"

# 4. Accept Licenses
Write-Host "Accepting licenses..."
# Create a dummy input for yes
"y`ny`ny`ny`ny`ny`ny`n" | Set-Content -Path "yes.txt"
Get-Content "yes.txt" | & "$latestDir\bin\sdkmanager.bat" --licenses

# 5. Install Packages
Write-Host "Installing platform-tools, platforms, build-tools, system-images..."
# We need: platform-tools, platforms;android-33, build-tools;33.0.0, system-images;android-33;google_apis;x86_64
# Using API 33 (Android 13) as it's stable and widely supported
Get-Content "yes.txt" | & "$latestDir\bin\sdkmanager.bat" "platform-tools" "platforms;android-33" "build-tools;33.0.2" "system-images;android-33;google_apis;x86_64" "emulator"

# 6. Create AVD
Write-Host "Creating AVD..."
# Check if AVD already exists to avoid error
$avdList = & "$latestDir\bin\avdmanager.bat" list avd
if ($avdList -notmatch "pixel_test") {
    echo "no" | & "$latestDir\bin\avdmanager.bat" create avd -n pixel_test -k "system-images;android-33;google_apis;x86_64" --device "pixel" --force
}

Write-Host "SDK Setup Complete."
