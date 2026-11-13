===========================================================
LABOUR ATTENDANCE - ANDROID STUDIO APK & APP BUNDLE (.AAB)
===========================================================

Package ID   : com.apex.labourattendance
Version      : 1.0.0 (versionCode 1)
Mode         : Live Server URL (https://ais-dev-khu4hvuhttwirhhvwj5vxa-897335332915.asia-east1.run.app)

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
