import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  Smartphone,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  Layers,
  Settings2,
  ArrowLeft,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import {
  generateAndroidProjectFiles,
  renderLauncherIconPngBase64,
} from '../utils/androidProjectTemplate';

interface ApkStudioViewProps {
  onBackToHome?: () => void;
}

export const ApkStudioView: React.FC<ApkStudioViewProps> = ({ onBackToHome }) => {
  const [selectedMethod, setSelectedMethod] = useState<'native' | 'capacitor'>('native');
  const [activeCodeFile, setActiveCodeFile] = useState<
    'kotlin' | 'manifest' | 'appGradle' | 'settingsGradle' | 'layout'
  >('kotlin');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://your-app-url.run.app';

  const [appName, setAppName] = useState('Labour Attendance');
  const [packageName, setPackageName] = useState('com.apex.labourattendance');
  const [versionName, setVersionName] = useState('1.0.0');
  const [versionCode, setVersionCode] = useState<number>(1);
  const [targetUrl, setTargetUrl] = useState(currentOrigin);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [isBuildingZip, setIsBuildingZip] = useState(false);
  const [zipStatus, setZipStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const projectData = useMemo(
    () =>
      generateAndroidProjectFiles({
        appName,
        packageName,
        versionCode,
        versionName,
        targetUrl,
        isOfflineMode,
      }),
    [appName, packageName, versionCode, versionName, targetUrl, isOfflineMode],
  );

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getActiveCode = () => {
    switch (activeCodeFile) {
      case 'kotlin':
        return { filename: 'app/src/main/java/.../MainActivity.kt', code: projectData.kotlinCode };
      case 'manifest':
        return { filename: 'app/src/main/AndroidManifest.xml', code: projectData.manifestCode };
      case 'appGradle':
        return { filename: 'app/build.gradle.kts', code: projectData.appGradleCode };
      case 'settingsGradle':
        return { filename: 'settings.gradle.kts', code: projectData.settingsGradleCode };
      case 'layout':
        return { filename: 'app/src/main/res/layout/activity_main.xml', code: projectData.layoutCode };
    }
  };

  const handleDownloadAndroidStudioZip = async () => {
    if (isBuildingZip) return;
    setIsBuildingZip(true);
    setZipStatus(null);

    try {
      const zip = new JSZip();
      const rootFolderName = `${packageName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'labour_attendance'}_android_studio`;
      const root = zip.folder(rootFolderName) || zip;

      for (const f of projectData.files) {
        root.file(f.path, f.content);
      }

      // Generate mipmap PNG launcher icons so Android Studio builds without missing resources on API 24+
      const [iconSquareB64, iconRoundB64] = await Promise.all([
        renderLauncherIconPngBase64(appName, false),
        renderLauncherIconPngBase64(appName, true),
      ]);
      if (iconSquareB64) {
        root.file('app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', iconSquareB64, { base64: true });
      }
      if (iconRoundB64) {
        root.file('app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', iconRoundB64, {
          base64: true,
        });
      }

      let bundledAssetsCount = 0;
      if (isOfflineMode) {
        const res = await fetch('/api/android-dist-files');
        if (res.ok) {
          const data = (await res.json()) as {
            available?: boolean;
            files?: Array<{ path: string; base64: string }>;
          };
          if (data.available && Array.isArray(data.files)) {
            for (const asset of data.files) {
              root.file(`app/src/main/assets/dist/${asset.path}`, asset.base64, { base64: true });
              bundledAssetsCount += 1;
            }
          }
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rootFolderName}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      if (isOfflineMode && bundledAssetsCount === 0) {
        setZipStatus({
          type: 'error',
          msg: 'Project ZIP downloaded, but dist/ assets were not found on server. Run `npm run build` first or switch Offline Mode off to load live URL.',
        });
      } else {
        setZipStatus({
          type: 'success',
          msg: isOfflineMode
            ? `Android Studio project ZIP ready with ${bundledAssetsCount} offline web bundle files!`
            : 'Android Studio project ZIP downloaded! Extract and open directly in Android Studio.',
        });
      }
    } catch (err) {
      setZipStatus({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to generate Android Studio project bundle.',
      });
    } finally {
      setIsBuildingZip(false);
    }
  };

  const activeCodeData = getActiveCode();

  return (
    <div className="space-y-3.5 pb-6 select-none">
      {/* Header */}
      <div className="bg-white border border-purple-100 rounded-3xl p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#5C2D91] text-[11px] font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Studio APK &amp; Bundle (.aab)</span>
          </div>
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="min-h-[34px] px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5C2D91] text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>

        <div>
          <h2 className="text-base font-extrabold text-neutral-900">
            Create APK &amp; AAB Bundle in Android Studio
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
            Exports a complete Gradle + Kotlin Android Studio project with Camera/Gallery support for worker photos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadAndroidStudioZip}
          disabled={isBuildingZip}
          className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-[#5C2D91] hover:bg-[#4E247D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          <span>
            {isBuildingZip
              ? 'Generating Android Studio ZIP...'
              : 'Download Android Studio Project (.zip)'}
          </span>
        </button>

        {zipStatus && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-start gap-2 border ${
              zipStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {zipStatus.type === 'success' ? (
              <PackageCheck className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{zipStatus.msg}</span>
          </div>
        )}
      </div>

      {/* Package Customization Controls */}
      <div className="p-4 bg-white border border-purple-100 rounded-3xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#5C2D91]" />
            <span className="text-xs font-bold text-neutral-900">Android App Bundle Configuration</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono font-bold">Gradle 8.7</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              App Name (Launcher Label)
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full min-h-[40px] bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-1.5 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5C2D91] font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              Application ID (Package)
            </label>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              className="w-full min-h-[40px] bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-1.5 text-xs text-[#5C2D91] font-mono focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              Version Name
            </label>
            <input
              type="text"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              className="w-full min-h-[40px] bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-1.5 text-xs text-neutral-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              Version Code
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={versionCode}
              onChange={(e) => setVersionCode(Math.max(1, Number(e.target.value) || 1))}
              className="w-full min-h-[40px] bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-1.5 text-xs text-neutral-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
            />
          </div>
        </div>

        {!isOfflineMode && (
          <div>
            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
              Live App URL (used inside WebView)
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full min-h-[40px] bg-purple-50/40 border border-purple-100 rounded-xl px-3 py-1.5 text-xs text-[#5C2D91] font-mono focus:outline-none focus:ring-2 focus:ring-[#5C2D91]"
            />
          </div>
        )}

        {/* Offline vs Live Mode Toggle */}
        <div className="pt-2 border-t border-purple-50 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-neutral-800 block">
              Include Compiled Offline Assets (dist/)
            </span>
            <span className="text-[11px] text-neutral-500">
              Embeds built web UI into <code className="text-[#5C2D91]">assets/dist/</code> via WebViewAssetLoader
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
              isOfflineMode ? 'bg-[#5C2D91] justify-end' : 'bg-neutral-200 justify-start'
            }`}
            aria-label="Toggle offline bundle assets"
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {/* Method Switcher Tabs */}
      <div className="flex p-1 bg-white border border-purple-100 rounded-2xl shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setSelectedMethod('native')}
          className={`flex-1 min-h-[40px] py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            selectedMethod === 'native'
              ? 'bg-[#5C2D91] text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Android Studio (.apk / .aab)
        </button>
        <button
          type="button"
          onClick={() => setSelectedMethod('capacitor')}
          className={`flex-1 min-h-[40px] py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            selectedMethod === 'capacitor'
              ? 'bg-[#5C2D91] text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Capacitor CLI
        </button>
      </div>

      {selectedMethod === 'native' ? (
        <>
          {/* Step Guide */}
          <div className="p-4 bg-white border border-purple-100 rounded-3xl space-y-2.5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#5C2D91]" />
              <span>How to Build APK or App Bundle (.aab)</span>
            </h3>

            <div className="space-y-2 text-xs text-neutral-700">
              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <strong className="text-[#5C2D91] block">1. Download &amp; Extract ZIP:</strong>
                Tap <strong>Download Android Studio Project (.zip)</strong> above and unzip it on your computer.
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <strong className="text-[#5C2D91] block">2. Open Folder in Android Studio:</strong>
                Click <strong>Open</strong> in Android Studio, choose the extracted folder, and let Gradle 8.7 sync.
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                <strong className="text-[#5C2D91] block">3. Build APK (Direct Install):</strong>
                Menu: <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> &rarr;{' '}
                <code className="font-mono text-[#5C2D91]">app-debug.apk</code>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <strong className="text-emerald-800 block">4. Build Signed Bundle (.aab for Play Store):</strong>
                Menu: <strong>Build &gt; Generate Signed Bundle / APK</strong> &rarr; select{' '}
                <strong>Android App Bundle</strong> &rarr; <code className="font-mono font-bold text-emerald-700">app-release.aab</code>
              </div>
            </div>
          </div>

          {/* Interactive Code Viewer */}
          <div className="p-4 bg-white border border-purple-100 rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#5C2D91]" />
                <span className="text-xs font-bold text-neutral-900">Included Project Files</span>
              </div>
            </div>

            {/* File Switcher Chips */}
            <div className="flex flex-wrap gap-1 p-1 bg-purple-50/60 rounded-xl">
              {[
                { id: 'kotlin', label: 'MainActivity.kt' },
                { id: 'manifest', label: 'AndroidManifest.xml' },
                { id: 'appGradle', label: 'app/build.gradle.kts' },
                { id: 'settingsGradle', label: 'settings.gradle.kts' },
                { id: 'layout', label: 'activity_main.xml' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveCodeFile(
                      tab.id as 'kotlin' | 'manifest' | 'appGradle' | 'settingsGradle' | 'layout',
                    )
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    activeCodeFile === tab.id
                      ? 'bg-[#5C2D91] text-white font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Box */}
            <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden text-neutral-100">
              <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800">
                <span className="text-[11px] font-mono text-neutral-400 truncate">
                  {activeCodeData.filename}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeCodeData.code, activeCodeFile)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg text-xs font-medium transition cursor-pointer shrink-0"
                >
                  {copiedKey === activeCodeFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
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
        <div className="p-4 bg-white border border-purple-100 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#5C2D91]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Capacitor CLI (Using Included capacitor.config.json)
            </h3>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Run these commands in the downloaded repository folder to open directly in Android Studio and build an APK or App Bundle (.aab):
          </p>

          <div className="space-y-2">
            {[
              {
                step: '1. Install Capacitor Android packages',
                cmd: 'npm install @capacitor/core @capacitor/cli @capacitor/android',
              },
              {
                step: '2. Build web bundle & create Android project',
                cmd: 'npm run build && npx cap add android && npx cap sync android',
              },
              {
                step: '3. Open in Android Studio (Build > Generate Signed Bundle / APK)',
                cmd: 'npx cap open android',
              },
              {
                step: '4. Or build Release App Bundle (.aab) via Gradle CLI',
                cmd: 'cd android && ./gradlew bundleRelease',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300 block">{item.step}</span>
                <div className="flex items-center justify-between gap-2 bg-neutral-900 p-2 rounded-lg">
                  <code className="text-xs font-mono text-emerald-400 break-all">{item.cmd}</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.cmd, `cap-${idx}`)}
                    className="p-1 rounded text-neutral-400 hover:text-white shrink-0 cursor-pointer"
                    aria-label="Copy command"
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
