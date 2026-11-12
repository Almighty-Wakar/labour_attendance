import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  Layers,
  Shield,
  FolderGit2,
  CheckCircle2,
  Settings2,
} from 'lucide-react';

interface ApkStudioViewProps {
  onBackToHome?: () => void;
}

export const ApkStudioView: React.FC<ApkStudioViewProps> = ({ onBackToHome }) => {
  const [selectedMethod, setSelectedMethod] = useState<'native' | 'capacitor'>('native');
  const [activeCodeFile, setActiveCodeFile] = useState<'kotlin' | 'manifest' | 'layout' | 'gradle'>('kotlin');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://your-app-url.run.app';

  const [appName, setAppName] = useState('Labour Attendance');
  const [packageName, setPackageName] = useState('com.apex.labourattendance');
  const [targetUrl, setTargetUrl] = useState(currentOrigin);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const finalLoadUrl = isOfflineMode
    ? 'file:///android_asset/dist/index.html'
    : targetUrl || currentOrigin;

  const kotlinCode = `package ${packageName}

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    // Target URL: Live URL or Local Offline Assets
    private val appUrl = "${finalLoadUrl}"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

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
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                view?.loadUrl(request?.url.toString())
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
        }

        // Hardware Back button handling
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
}`;

  const manifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.AppCompat.NoActionBar">

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
</manifest>`;

  const layoutCode = `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#5C2D91">

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="0dp"
        android:layout_height="4dp"
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

</androidx.constraintlayout.widget.ConstraintLayout>`;

  const gradleCode = `// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "${packageName}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${packageName}"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
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
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.11.0")
}`;

  const getActiveCode = () => {
    switch (activeCodeFile) {
      case 'kotlin':
        return { filename: 'MainActivity.kt', code: kotlinCode, lang: 'kotlin' };
      case 'manifest':
        return { filename: 'AndroidManifest.xml', code: manifestCode, lang: 'xml' };
      case 'layout':
        return { filename: 'activity_main.xml', code: layoutCode, lang: 'xml' };
      case 'gradle':
        return { filename: 'build.gradle.kts', code: gradleCode, lang: 'kotlin' };
    }
  };

  const handleDownloadAllBundle = () => {
    const bundleText = `=== LABOUR ATTENDANCE ANDROID STUDIO BUILD BUNDLE ===
Application Name: ${appName}
Package Name: ${packageName}
Target URL: ${finalLoadUrl}
Mode: ${isOfflineMode ? 'Offline Local Assets (dist/)' : 'Live URL'}

Steps in Android Studio:
1. Open Android Studio -> New Project -> "Empty Views Activity"
2. Package: ${packageName}
3. Replace files with the code below
4. Click 'Build' -> 'Build Bundle(s) / APK(s)' -> 'Build APK(s)'
5. Your APK will be at app/build/outputs/apk/debug/app-debug.apk!

========================================
FILE 1: app/src/main/AndroidManifest.xml
========================================
${manifestCode}

========================================
FILE 2: app/src/main/java/${packageName.replace(/\./g, '/')}/MainActivity.kt
========================================
${kotlinCode}

========================================
FILE 3: app/src/main/res/layout/activity_main.xml
========================================
${layoutCode}

========================================
FILE 4: app/build.gradle.kts
========================================
${gradleCode}
`;

    const blob = new Blob([bundleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `android_studio_${packageName.replace(/\./g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCodeData = getActiveCode();

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Header */}
      <div className="bg-white border border-purple-100 rounded-2xl p-4 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#5C2D91] text-[11px] font-bold mb-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Studio APK Creator</span>
        </div>
        <h2 className="text-base font-bold text-neutral-900">
          Build Labour Attendance APK in Android Studio
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
          Customize package settings and copy ready-to-compile Kotlin and XML files for Android Studio.
        </p>
      </div>

      {/* Package Customization Controls */}
      <div className="p-4 bg-white border border-purple-100 rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#5C2D91]" />
            <span className="text-xs font-bold text-neutral-900">Custom Android App Settings</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-mono font-bold">Live Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-semibold text-neutral-600 block mb-1">
              App Name (Launcher label)
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] font-medium"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-neutral-600 block mb-1">
              Android Package ID
            </label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-1.5 text-xs text-[#5C2D91] font-mono focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
            />
          </div>
        </div>

        {/* Offline vs Live Mode Toggle */}
        <div className="pt-2 border-t border-purple-50 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-800 block">Offline Mode (Local assets)</span>
            <span className="text-[10px] text-neutral-500">
              Loads from <code className="text-[#5C2D91]">android_asset/dist</code> without internet
            </span>
          </div>
          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
              isOfflineMode ? 'bg-[#5C2D91] justify-end' : 'bg-neutral-200 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {/* Method Switcher Tabs */}
      <div className="flex p-1 bg-white border border-purple-100 rounded-2xl shadow-xs">
        <button
          onClick={() => setSelectedMethod('native')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            selectedMethod === 'native'
              ? 'bg-[#5C2D91] text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Method 1: Native Android Studio (Recommended)
        </button>
        <button
          onClick={() => setSelectedMethod('capacitor')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
            selectedMethod === 'capacitor'
              ? 'bg-[#5C2D91] text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Method 2: Capacitor CLI
        </button>
      </div>

      {selectedMethod === 'native' ? (
        <>
          {/* Step Guide */}
          <div className="p-4 bg-white border border-purple-100 rounded-2xl space-y-2.5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#5C2D91]" />
              <span>5 Steps to Create the APK</span>
            </h3>

            <div className="space-y-2 text-xs text-neutral-700">
              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <strong className="text-[#5C2D91] block">1. Open Android Studio:</strong>
                New Project &rarr; Empty Views Activity &rarr; Package: <code className="font-mono">{packageName}</code>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <strong className="text-[#5C2D91] block">2. Copy Code:</strong>
                Paste the 4 files below into your Android Studio project.
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <strong className="text-[#5C2D91] block">3. URL:</strong>
                Pointing to: <code className="font-mono text-[#5C2D91] break-all">{finalLoadUrl}</code>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <strong className="text-[#5C2D91] block">4. Build APK:</strong>
                Click <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <strong className="text-emerald-800 block">5. Done!</strong>
                Grab <code className="font-mono font-bold text-emerald-700">app/build/outputs/apk/debug/app-debug.apk</code> and install on your phone!
              </div>
            </div>
          </div>

          {/* Interactive Code Viewer */}
          <div className="p-4 bg-white border border-purple-100 rounded-2xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#5C2D91]" />
                <span className="text-xs font-bold text-neutral-900">Source Files</span>
              </div>
              <button
                onClick={handleDownloadAllBundle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5C2D91] text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Bundle (.txt)</span>
              </button>
            </div>

            {/* File Switcher Chips */}
            <div className="flex flex-wrap gap-1 p-1 bg-purple-50/60 rounded-xl">
              <button
                onClick={() => setActiveCodeFile('kotlin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeCodeFile === 'kotlin' ? 'bg-[#5C2D91] text-white font-bold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                MainActivity.kt
              </button>
              <button
                onClick={() => setActiveCodeFile('manifest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeCodeFile === 'manifest' ? 'bg-[#5C2D91] text-white font-bold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                AndroidManifest.xml
              </button>
              <button
                onClick={() => setActiveCodeFile('layout')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeCodeFile === 'layout' ? 'bg-[#5C2D91] text-white font-bold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                activity_main.xml
              </button>
              <button
                onClick={() => setActiveCodeFile('gradle')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeCodeFile === 'gradle' ? 'bg-[#5C2D91] text-white font-bold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                build.gradle.kts
              </button>
            </div>

            {/* Code Box */}
            <div className="relative rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden text-neutral-100">
              <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800">
                <span className="text-[11px] font-mono text-neutral-400">
                  {activeCodeData.filename}
                </span>
                <button
                  onClick={() => copyToClipboard(activeCodeData.code, activeCodeFile)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  {copiedKey === activeCodeFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-72 leading-relaxed selectable-text">
                <code>{activeCodeData.code}</code>
              </pre>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 bg-white border border-purple-100 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#5C2D91]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Capacitor 4-Command Setup
            </h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Run these commands in your project root to open the project directly inside Android Studio:
          </p>

          <div className="space-y-2">
            {[
              {
                step: '1. Install Capacitor packages',
                cmd: 'npm install @capacitor/core @capacitor/cli @capacitor/android',
              },
              {
                step: '2. Initialize Capacitor',
                cmd: `npx cap init "${appName}" "${packageName}" --web-dir dist`,
              },
              {
                step: '3. Build & add Android platform',
                cmd: 'npm run build && npx cap add android',
              },
              {
                step: '4. Open in Android Studio',
                cmd: 'npx cap open android',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300 block">{item.step}</span>
                <div className="flex items-center justify-between gap-2 bg-neutral-900 p-2 rounded-lg">
                  <code className="text-xs font-mono text-emerald-400 break-all">{item.cmd}</code>
                  <button
                    onClick={() => copyToClipboard(item.cmd, `cap-${idx}`)}
                    className="p-1 rounded text-neutral-400 hover:text-white shrink-0 cursor-pointer"
                  >
                    {copiedKey === `cap-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
