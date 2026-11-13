# Labour Attendance — Android & Web Wage Manager

A mobile-first, Android-ready **Labour Attendance, Advance & Payroll Management** application for construction contractors, site supervisors, and worksite managers. Built with React, TypeScript, Tailwind CSS, Express, and native Android Studio / Capacitor export support.

---

## 📲 Download Android APK & App Bundle (`.aab`)

> **Before publishing on GitHub:** Replace `YOUR_USERNAME/YOUR_REPO` in the links below with your GitHub username and repository name.

- **Direct APK Download (Latest Release):**
  [⬇️ Download `app-debug.apk`](https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/app-debug.apk)
- **Android App Bundle (`.aab`) for Play Store:**
  [📦 Download `app-release.aab`](https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/app-release.aab)
- **All Releases & Changelogs:**
  [View GitHub Releases](https://github.com/YOUR_USERNAME/YOUR_REPO/releases)
- **Cloud Build Artifacts (Actions):**
  [View Latest APK/AAB Workflow Builds](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/build-android-apk.yml)

### How to Publish the Direct APK Download Link on GitHub
This repository includes `.github/workflows/build-android-apk.yml`, which automatically builds both `app-debug.apk` and `app-release.aab` in the cloud:
1. Push this repository to GitHub.
2. Create and push a version tag (e.g. `git tag v1.0.0 && git push origin v1.0.0`) — or trigger **Build Android APK & App Bundle (.aab)** from the **Actions** tab.
3. GitHub automatically attaches `app-debug.apk` and `app-release.aab` to your **Latest Release**, activating the direct download links above.

---

## 📱 Alternative Ways to Install / Build APK

### Option 1: Export Ready-to-Open Android Studio Project (`.zip`) In-App
1. Open the app and tap **Home -> Android Studio APK & Bundle (.aab)** (or **Settings -> Backup -> Open Android Studio Builder**).
2. Customize App Name, Application ID (`com.apex.labourattendance`), Version, and optionally toggle **Include Compiled Offline Assets (`dist/`)**.
3. Tap **Download Android Studio Project (.zip)**.
4. Unzip and open the folder in **Android Studio**, wait for Gradle `8.7` sync, then click:
   - **Build -> Build Bundle(s) / APK(s) -> Build APK(s)** (`app-debug.apk`)
   - **Build -> Generate Signed Bundle / APK... -> Android App Bundle** (`app-release.aab`)

### Option 2: Install on Android Directly via Chrome (No APK Sideloading)
1. Open your deployed web app URL in **Chrome** on Android.
2. Tap **`⋮` -> Install app** (or **Add to Home screen**).

---

## ✨ Key Features

- **Single-Owner Backend Access Control (`server.ts`)**:
  - Strictly locks app registration to **one individual owner account** (`403` on additional account attempts).
  - Supports **Account Password (`0–12` chars)**, **4-Digit Quick PIN**, **Thumb Touch**, and **Eye Login**, plus in-app password & PIN updates.
- **Worker Photos (Camera & Gallery)**:
  - Capture worker photos directly with the phone camera or pick from gallery; automatically center-cropped and compressed for fast offline storage.
- **Mark Today & Daily Roll Call**:
  - One-tap **Present**, **Half Day**, **Absent**, and overtime hour adjustments (`+0.5h`, `+1h`, `+2h`) with live daily wage totals.
- **Multi-Worksite Support**:
  - Switch between individual sites or view **All Worksites** combined.
- **Advances, Deductions & Payroll Calculator**:
  - Track cash advances, bonuses, and deductions (`Total`, `Advance`, `Remaining`), calculate net payable wages across any date range, and print formal **Wage Slip Vouchers**.
- **Offline JSON Backup & Restore**:
  - Export and import all workers (including photos), attendance records, advances, and settings as JSON.

---

## 🚀 Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full-Stack Development Server (Express + Vite on Port 3000)
```bash
npm run dev
```
Open `http://localhost:3000`.

### 3. Production Build & Start
```bash
npm run build
npm start
```

### 4. Build Android Project via Capacitor CLI
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

---

## 📂 Repository Structure

```
├── .github/
│   └── workflows/
│       └── build-android-apk.yml     # Cloud APK & .aab builder + Release publisher
├── capacitor.config.ts               # Capacitor config (com.apex.labourattendance)
├── server.ts                         # Express API (Single-Owner Auth + Android dist bundle)
├── vite.config.ts                    # Vite build config (relative ./ base for Android assets)
├── public/
│   ├── icon.svg                      # Brand vector icon
│   └── manifest.json                 # PWA Web App Manifest
└── src/
    ├── App.tsx                       # Root application & navigation shell
    ├── types.ts                      # TypeScript models
    ├── components/
    │   ├── LoginLockScreen.tsx       # Create Account, Password/PIN/Biometric unlock
    │   ├── LoginAccessModal.tsx      # Change Password, PIN & security controls
    │   ├── HomeDashboardView.tsx     # Dashboard & quick operations
    │   ├── MarkTodayView.tsx         # Daily attendance & overtime roll call
    │   ├── LabourDirectoryView.tsx   # Worker roster & inline wage editor
    │   ├── LabourModal.tsx           # Add/Edit worker, photo capture & wage rates
    │   ├── PaymentsAdvancesView.tsx  # Advances & remaining balances tracker
    │   ├── PayrollCalculatorView.tsx # Date-range payroll & wage slip launcher
    │   ├── ApkStudioView.tsx         # In-app Android Studio .zip & .aab builder
    │   └── SettingsModal.tsx         # Worksites, company, access & JSON backup
    └── utils/
        ├── androidProjectTemplate.ts # Gradle 8.7 + Kotlin WebView/Camera generator
        ├── authApi.ts                # Backend single-owner authentication client
        ├── imageCompress.ts          # Client-side square photo compression
        ├── calculations.ts           # Attendance & payroll formulas
        └── storage.ts                # LocalStorage persistence & JSON backup
```
