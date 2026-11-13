export interface AndroidProjectConfig {
  appName: string;
  packageName: string;
  versionCode: number;
  versionName: string;
  targetUrl: string;
  isOfflineMode: boolean;
}

export interface AndroidProjectFile {
  path: string;
  content: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateAndroidProjectFiles(config: AndroidProjectConfig): {
  files: AndroidProjectFile[];
  kotlinCode: string;
  manifestCode: string;
  layoutCode: string;
  appGradleCode: string;
  rootGradleCode: string;
  settingsGradleCode: string;
} {
  const safePackage = config.packageName.trim() || 'com.apex.labourattendance';
  const safeAppName = config.appName.trim() || 'Labour Attendance';
  const safeVersionCode = Math.max(1, Math.floor(Number(config.versionCode) || 1));
  const safeVersionName = config.versionName.trim() || '1.0.0';
  const packagePath = safePackage.replace(/\./g, '/');

  const finalLoadUrl = config.isOfflineMode
    ? 'https://appassets.androidplatform.net/assets/dist/index.html'
    : config.targetUrl || 'https://your-app-url.run.app';

  const kotlinCode = `package ${safePackage}

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var cameraPhotoUri: Uri? = null

    private val appUrl = "${finalLoadUrl}"

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = filePathCallback
        filePathCallback = null
        if (callback == null) return@registerForActivityResult

        if (result.resultCode == Activity.RESULT_OK) {
            val dataUri = result.data?.data
            val clipData = result.data?.clipData
            when {
                clipData != null && clipData.itemCount > 0 -> {
                    val uris = Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                    callback.onReceiveValue(uris)
                }
                dataUri != null -> callback.onReceiveValue(arrayOf(dataUri))
                cameraPhotoUri != null -> callback.onReceiveValue(arrayOf(cameraPhotoUri!!))
                else -> callback.onReceiveValue(null)
            }
        } else {
            callback.onReceiveValue(null)
        }
        cameraPhotoUri = null
    }

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ ->
        openImagePickerIntent()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                val url = request?.url ?: return null
                return assetLoader.shouldInterceptRequest(url)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                view?.loadUrl(url)
                return true
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback

                val hasCameraPerm = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.CAMERA
                ) == PackageManager.PERMISSION_GRANTED

                if (!hasCameraPerm) {
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                } else {
                    openImagePickerIntent()
                }
                return true
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        webView.loadUrl(appUrl)
    }

    private fun openImagePickerIntent() {
        var captureIntent: Intent? = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (captureIntent?.resolveActivity(packageManager) != null) {
            val photoFile = createImageFile()
            if (photoFile != null) {
                val uri = FileProvider.getUriForFile(
                    this,
                    "\${applicationId}.fileprovider",
                    photoFile
                )
                cameraPhotoUri = uri
                captureIntent.putExtra(MediaStore.EXTRA_OUTPUT, uri)
            } else {
                captureIntent = null
            }
        } else {
            captureIntent = null
        }

        val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "image/*"
        }

        val chooserIntent = Intent.createChooser(contentIntent, "Select Worker Photo")
        if (captureIntent != null) {
            chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(captureIntent))
        }
        fileChooserLauncher.launch(chooserIntent)
    }

    private fun createImageFile(): File? {
        return try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
            File.createTempFile("WORKER_\${timestamp}_", ".jpg", storageDir)
        } catch (_: Exception) {
            null
        }
    }
}
`;

  const manifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.CAMERA" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.LabourAttendance">

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

  const layoutCode = `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/brand_purple">

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="0dp"
        android:layout_height="3dp"
        android:max="100"
        android:progressTint="#FFFFFF"
        android:visibility="gone"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <WebView
        android:id="@+id/webView"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintTop_toBottomOf="@id/progressBar"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
`;

  const appGradleCode = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${safePackage}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${safePackage}"
        minSdk = 24
        targetSdk = 35
        versionCode = ${safeVersionCode}
        versionName = "${safeVersionName}"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    bundle {
        language {
            enableSplit = false
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.12.1")
}
`;

  const rootGradleCode = `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`;

  const settingsGradleCode = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "LabourAttendanceAndroid"
include(":app")
`;

  const gradleProperties = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`;

  const gradleWrapperProperties = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

  const filePathsXml = `<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-files-path name="worker_pictures" path="Pictures" />
    <cache-path name="worker_cache" path="." />
</paths>
`;

  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${escapeXml(safeAppName)}</string>
</resources>
`;

  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="brand_purple">#5C2D91</color>
    <color name="brand_purple_dark">#381461</color>
</resources>
`;

  const themesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.LabourAttendance" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="android:statusBarColor">@color/brand_purple_dark</item>
        <item name="android:navigationBarColor">@color/brand_purple_dark</item>
    </style>
</resources>
`;

  const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/brand_purple" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;

  const foregroundVectorXml = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M54,32c5.52,0 10,4.48 10,10s-4.48,10 -10,10 -10,-4.48 -10,-10 4.48,-10 10,-10zM34,74c0,-8.84 8.95,-16 20,-16s20,7.16 20,16v4H34v-4z" />
</vector>
`;

  const readmeTxt = `===========================================================
${safeAppName.toUpperCase()} - ANDROID STUDIO APK & APP BUNDLE (.AAB)
===========================================================

Package ID   : ${safePackage}
Version      : ${safeVersionName} (versionCode ${safeVersionCode})
Mode         : ${config.isOfflineMode ? 'Offline Local Assets (app/src/main/assets/dist/)' : `Live Server URL (${finalLoadUrl})`}

-----------------------------------------------------------
HOW TO OPEN & BUILD IN ANDROID STUDIO
-----------------------------------------------------------
1. Unzip this folder onto your computer.
2. Open Android Studio -> Click "Open" -> Select this unzipped folder.
3. Wait for Android Studio to download/sync Gradle automatically.

OPTION A - BUILD APK (Direct phone install):
  Menu: Build -> Build Bundle(s) / APK(s) -> Build APK(s)
  Output: app/build/outputs/apk/debug/app-debug.apk

OPTION B - BUILD SIGNED APP BUNDLE (.AAB) OR RELEASE APK (Play Store):
  Menu: Build -> Generate Signed Bundle / APK...
  Choose "Android App Bundle" (.aab) or "APK"
  Select or create a keystore (.jks) and pick "release".
  Output (.aab): app/release/app-release.aab
  Output (.apk): app/release/app-release.apk
`;

  const files: AndroidProjectFile[] = [
    { path: 'README_ANDROID_STUDIO.txt', content: readmeTxt },
    { path: 'settings.gradle.kts', content: settingsGradleCode },
    { path: 'build.gradle.kts', content: rootGradleCode },
    { path: 'gradle.properties', content: gradleProperties },
    { path: 'gradle/wrapper/gradle-wrapper.properties', content: gradleWrapperProperties },
    { path: 'app/build.gradle.kts', content: appGradleCode },
    { path: 'app/proguard-rules.pro', content: '# Keep WebView JS interfaces if added\n' },
    { path: 'app/src/main/AndroidManifest.xml', content: manifestCode },
    { path: 'app/src/main/res/xml/file_paths.xml', content: filePathsXml },
    { path: 'app/src/main/res/layout/activity_main.xml', content: layoutCode },
    { path: 'app/src/main/res/values/strings.xml', content: stringsXml },
    { path: 'app/src/main/res/values/colors.xml', content: colorsXml },
    { path: 'app/src/main/res/values/themes.xml', content: themesXml },
    { path: 'app/src/main/res/drawable/ic_launcher_foreground.xml', content: foregroundVectorXml },
    { path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml', content: adaptiveIconXml },
    { path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml', content: adaptiveIconXml },
    { path: `app/src/main/java/${packagePath}/MainActivity.kt`, content: kotlinCode },
  ];

  return {
    files,
    kotlinCode,
    manifestCode,
    layoutCode,
    appGradleCode,
    rootGradleCode,
    settingsGradleCode,
  };
}

export async function renderLauncherIconPngBase64(appName: string, round = false): Promise<string> {
  const size = 192;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (round) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
  }

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#5C2D91');
  grad.addColorStop(1, '#381461');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const initials =
    appName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'LA';

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 74px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2 + 4);

  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.split(',')[1] || '';
}
