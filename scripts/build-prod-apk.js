#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Determine project root directory
const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const buildsDir = path.join(projectRoot, 'builds');

// Read app version (read-only, does not modify app.json so Git stays clean)
let appVersion = '1.0.0';
const appName = 'SerrataKost';
try {
    const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));
    if (appJson.expo?.version) appVersion = appJson.expo.version;
} catch (e) {
    // fallback defaults
}

// Generate dynamic timestamp-based versionCode (Seconds since Jan 1, 2024)
// Guaranteed strictly increasing on every build, fits within 32-bit integer, zero git changes!
const EPOCH_START = 1704067200000; // 2024-01-01T00:00:00Z
const buildVersionCode = Math.floor((Date.now() - EPOCH_START) / 1000);

// Parse CLI flags
const isUniversal = process.argv.includes('--universal') || process.argv.includes('-u');
const architectures = isUniversal ? 'arm64-v8a,armeabi-v7a' : 'arm64-v8a';
const archLabel = isUniversal ? 'universal' : 'arm64';

console.log('\n======================================================');
console.log('📦  BUILD PRODUCTION APK - SERRATA KOST');
console.log('======================================================');
console.log(`📌 Target Arsitektur : ${architectures} (${isUniversal ? 'Universal fisik: arm64 + armv7' : 'Super Ramping: arm64-v8a (95%+ HP Android)'})`);
console.log(`🌐 Production URL   : https://serrata.xyz/api`);
console.log(`🏷️  Versi Aplikasi   : v${appVersion} (versionCode: ${buildVersionCode})`);
console.log('------------------------------------------------------\n');

// 1. Ensure android/local.properties has Android SDK path
const localPropertiesPath = path.join(androidDir, 'local.properties');
if (!fs.existsSync(localPropertiesPath)) {
    const defaultSdkPaths = [
        process.env.ANDROID_HOME,
        process.env.ANDROID_SDK_ROOT,
        path.join(process.env.HOME || '', 'Library/Android/sdk'),
        path.join(process.env.HOME || '', 'Android/Sdk'),
    ].filter(Boolean);

    const foundSdk = defaultSdkPaths.find(p => fs.existsSync(p));
    if (foundSdk) {
        fs.writeFileSync(localPropertiesPath, `sdk.dir=${foundSdk}\n`);
        console.log(`ℹ️  Dibuat android/local.properties dengan sdk.dir=${foundSdk}`);
    } else {
        console.warn('⚠️  Peringatan: Android SDK tidak terdeteksi otomatis. Pastikan ANDROID_HOME sudah tersetel.');
    }
}

// 2. Prepare environment variables
const env = {
    ...process.env,
    NODE_ENV: 'production',
    EXPO_PUBLIC_API_URL: 'https://serrata.xyz/api',
};

// 3. Determine gradlew command
const isWindows = process.platform === 'win32';
const gradlewCmd = isWindows ? 'gradlew.bat' : './gradlew';

console.log('⚙️  Menjalankan kompilasi Gradle Release...\n');

const gradleArgs = [
    'assembleRelease',
    `-PreactNativeArchitectures=${architectures}`,
    `-PversionCode=${buildVersionCode}`,
    `-PversionName=${appVersion}`,
];

const result = spawnSync(gradlewCmd, gradleArgs, {
    cwd: androidDir,
    env,
    stdio: 'inherit',
});

if (result.status !== 0) {
    console.error('\n❌ Build gagal! Silakan periksa pesan error di atas.');
    process.exit(result.status || 1);
}

// 4. Locate generated APK
const apkDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release');
if (!fs.existsSync(apkDir)) {
    console.error(`\n❌ Direktori output APK tidak ditemukan: ${apkDir}`);
    process.exit(1);
}

// Find all .apk files in apkDir
const apkFiles = fs.readdirSync(apkDir).filter(f => f.endsWith('.apk'));
if (apkFiles.length === 0) {
    console.error('\n❌ File APK tidak ditemukan di ' + apkDir);
    process.exit(1);
}

// Prefer serrata.apk, app-release.apk or first matching
let sourceApk = apkFiles.find(f => f === 'serrata.apk' || f === 'app-release.apk') || apkFiles[0];
const sourceApkPath = path.join(apkDir, sourceApk);

// 5. Ensure builds directory exists
if (!fs.existsSync(buildsDir)) {
    fs.mkdirSync(buildsDir, { recursive: true });
}

// 6. Copy APK to builds directory with branded filename
const targetFileName = `${appName}-v${appVersion}-${archLabel}.apk`;
const directApkPath = path.join(buildsDir, `${appName}.apk`);
const targetFilePath = path.join(buildsDir, targetFileName);
const latestFilePath = path.join(buildsDir, `${appName}-latest.apk`);

fs.copyFileSync(sourceApkPath, directApkPath);
fs.copyFileSync(sourceApkPath, targetFilePath);
fs.copyFileSync(sourceApkPath, latestFilePath);

// 7. Calculate and display file size
const stats = fs.statSync(directApkPath);
const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log('\n======================================================');
console.log('🎉  BUILD PRODUCTION APK SELESAI & BERHASIL!');
console.log('======================================================');
console.log(`🏷️  Versi Aplikasi   : v${appVersion} (versionCode: ${buildVersionCode})`);
console.log(`📁 File APK Utama     : builds/${appName}.apk`);
console.log(`📁 File Versi         : builds/${targetFileName}`);
console.log(`📁 Shortcut Terbaru   : builds/${appName}-latest.apk`);
console.log(`📦 Ukuran File        : ${sizeInMB} MB`);
console.log(`🔗 API URL Terpasang  : https://serrata.xyz/api`);
console.log('======================================================\n');
console.log(`💡 File APK siap dibagikan ke pengguna atau diinstall langsung ke HP Android!`);
