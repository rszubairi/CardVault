# Plan to Test CardVault Android App on OnePlus 10T

This plan outlines the steps needed to set up, build, and run the Android version of CardVault on your connected OnePlus 10T device.

## User Action Required

Before we can build and deploy the app to your phone, please perform the following steps on your OnePlus 10T:

> [!IMPORTANT]
> **Authorize USB Debugging on your OnePlus 10T:**
> 1. Unlock your phone.
> 2. You should see a prompt on your phone screen asking: **"Allow USB debugging?"**
> 3. Check the box **"Always allow from this computer"** and tap **"Allow"**.
> 4. Once done, let me know, and we will verify the authorization state.

## Proposed Steps

---

### Phase 1: Environment & Dependency Setup

1. **Verify Device Connection:**
   Run `adb devices` again to confirm the state changes from `unauthorized` to `device`.
2. **Install Node.js Dependencies:**
   Run `npm install` in `c:\Users\rszub\Documents\CardVault` to install the project dependencies.

---

### Phase 2: Android Build Configuration

1. **Configure Android SDK Environment Path:**
   Set the local `ANDROID_HOME` variable to point to your SDK path: `C:\Users\rszub\AppData\Local\Android\Sdk`.
2. **Generate Native Android Project (Prebuild):**
   Run `npx expo prebuild` to generate the native `android` directory.
3. **Configure Gradle Local Properties:**
   Create and write `android/local.properties` with:
   ```properties
   sdk.dir=C\:\\Users\\rszub\\AppData\\Local\\Android\\Sdk
   ```
   This ensures Gradle can locate the Android SDK even if system-wide environment variables are not persistent yet.

---

### Phase 3: Build & Deploy

1. **Run Android Build:**
   Execute `npx expo run:android` (passing the device ID if multiple are connected, or letting it select the only connected device). This compiles the native development client and installs it on the OnePlus 10T.

## Verification Plan

### Manual Verification
- Confirm that the app successfully compiles and installs on the OnePlus 10T.
- Confirm the Metro bundler runs and the app successfully loads on the phone.
