#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Determine project root directory
const projectRoot = path.resolve(__dirname, '..');
const androidDir = path.join(projectRoot, 'android');
const buildsDir = path.join(projectRoot, 'builds');

// Read and auto-increment app version (Zero-Git-Changes)
// Version is tracked in .build_version (listed in .gitignore, so Git stays 100% clean!)
const buildVersionPath = path.join(projectRoot, '.build_version');
let appVersion = '1.0.0';
const appName = 'SerrataKost';

let appJson = {};
try {
    appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'app.json'), 'utf8'));
    if (appJson.expo?.version) appVersion = appJson.expo.version;
} catch (e) {}

// If .build_version exists, use it as the source of truth for incremental builds
if (fs.existsSync(buildVersionPath)) {
    try {
        const stored = fs.readFileSync(buildVersionPath, 'utf8').trim();
        if (stored) appVersion = stored;
    } catch (e) {}
}

// Parse CLI flags for versioning
const noBump = process.argv.includes('--no-bump');
const bumpMinor = process.argv.includes('--minor');
const bumpMajor = process.argv.includes('--major');
const versionArg = process.argv.find((arg) => arg.startsWith('--version=') || arg.startsWith('-v='));

let nextVersion = appVersion;
if (versionArg) {
    nextVersion = versionArg.split('=')[1].trim();
} else if (!noBump) {
    const parts = appVersion.split('.').map((n) => parseInt(n, 10) || 0);
    while (parts.length < 3) parts.push(0);
    if (bumpMajor) {
        parts[0] += 1;
        parts[1] = 0;
        parts[2] = 0;
    } else if (bumpMinor) {
        parts[1] += 1;
        parts[2] = 0;
    } else {
        parts[2] += 1; // Default auto-increment patch
    }
    nextVersion = parts.join('.');
}

// Persist only to untracked .build_version (never touches app.json or package.json!)
if (nextVersion !== appVersion || !fs.existsSync(buildVersionPath)) {
    fs.writeFileSync(buildVersionPath, nextVersion + '\n', 'utf8');
    console.log(`\n🚀 Versi aplikasi otomatis dinaikkan: v${appVersion} ➜ v${nextVersion} (Git tetap bersih!)`);
    appVersion = nextVersion;
}

// Generate dynamic timestamp-based versionCode (Seconds since Jan 1, 2024)
// Guaranteed strictly increasing on every build, fits within 32-bit integer!
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
    EXPO_PUBLIC_APP_VERSION: appVersion,
};

// 3. Determine gradlew command
const isWindows = process.platform === 'win32';
const gradlewCmd = isWindows ? 'gradlew.bat' : './gradlew';

// 4. Auto-sync native assets if assets/images or asset configs were modified
function syncAssetsIfNeeded() {
    const assetsImagesDir = path.join(projectRoot, 'assets', 'images');
    const syncMarkerFile = path.join(androidDir, '.last_asset_sync');

    let assetSignature = '';
    try {
        if (appJson.expo) {
            const { icon, splash, android } = appJson.expo;
            assetSignature += JSON.stringify({ icon, splash, adaptiveIcon: android?.adaptiveIcon }) + '|';
        }
        if (fs.existsSync(assetsImagesDir)) {
            const files = fs.readdirSync(assetsImagesDir).sort();
            for (const file of files) {
                const stat = fs.statSync(path.join(assetsImagesDir, file));
                assetSignature += `${file}:${stat.size}:${stat.mtimeMs};`;
            }
        }
    } catch {}

    let lastSignature = '';
    if (fs.existsSync(syncMarkerFile)) {
        try {
            lastSignature = fs.readFileSync(syncMarkerFile, 'utf8');
        } catch {}
    }

    const forceSync = process.argv.includes('--sync-assets') || process.argv.includes('--sync') || process.argv.includes('-s');
    if (forceSync || (assetSignature && assetSignature !== lastSignature)) {
        console.log('🔄 Mendeteksi aset/konfigurasi diperbarui, menyinkronkan aset native Android...');

        const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
        const pkgJsonPath = path.join(projectRoot, 'package.json');
        const buildGradleBak = fs.existsSync(buildGradlePath) ? fs.readFileSync(buildGradlePath, 'utf8') : null;
        const pkgJsonBak = fs.existsSync(pkgJsonPath) ? fs.readFileSync(pkgJsonPath, 'utf8') : null;

        const prebuildCmd = isWindows ? 'npx.cmd' : 'npx';
        const prebuildResult = spawnSync(prebuildCmd, ['expo', 'prebuild', '-p', 'android', '--no-install'], {
            cwd: projectRoot,
            env: process.env,
            stdio: 'inherit',
        });

        if (buildGradleBak && fs.existsSync(buildGradlePath)) {
            fs.writeFileSync(buildGradlePath, buildGradleBak, 'utf8');
        }
        if (pkgJsonBak && fs.existsSync(pkgJsonPath)) {
            fs.writeFileSync(pkgJsonPath, pkgJsonBak, 'utf8');
        }

        if (prebuildResult.status === 0) {
            fs.writeFileSync(syncMarkerFile, assetSignature, 'utf8');
            console.log('✅ Aset native Android berhasil disinkronkan!\n');
        } else {
            console.warn('⚠️ Gagal menyinkronkan aset native otomatis, melanjutkan kompilasi...\n');
        }
    }
}

syncAssetsIfNeeded();

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
