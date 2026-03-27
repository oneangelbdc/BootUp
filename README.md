# 💻 Boot Up! - Project Setup & Collaboration Guide

This guide ensures the team is synchronized and the development environment is consistent across all machines.

---

## 🛠️ 1. Prerequisites
Install the following before attempting to run the code:
* **Node.js (LTS Version):** [Download here](https://nodejs.org/)
* **VS Code:** Primary code editor.
* **Git:** For version control.
* **Expo Go App:** Download from Google Play (Android) or App Store (iOS).

---

## 📥 2. Local Machine Setup

1. **Clone the Repository:**
   ```bash
   git clone <YOUR_GITHUB_REPO_URL_HERE>
   cd BootUp
   ```

2. **Install Dependencies:**
   Run this to download the necessary libraries (not included in GitHub):
   ```bash
   npm install
   ```

3. **Install Required Expo Modules:**
   ```bash
   npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler expo-av
   ```

---

## 📱 3. Running & Testing

1. **Start the Development Server:**
   ```bash
   npx expo start
   ```

2. **Connect Device:**
   * Ensure phone and laptop are on the **same Wi-Fi network**.
   * Open **Expo Go** and scan the QR code displayed in the terminal.

3. **Hot Reloading:**
   Saving changes in VS Code updates the app on your phone instantly. Press **`r`** in the terminal if it needs a manual refresh.

---

## 📂 4. Project Architecture
* `app/index.tsx`: Main entry and Navigation Stack logic.
* `src/screens/`: Individual level files (Start, Menu, BuildThePC, etc.).
* `src/styles/theme.js`: Centralized colors and UI styling. **Do not hardcode colors; use the theme.**

---

## 🤝 5. Collaboration Rules (Git)

* **Sync Before Working:** Always run `git pull origin main` before starting a session to avoid code conflicts.
* **Submitting Changes:**
  ```bash
  git add .
  git commit -m "Describe what you fixed or added"
  git push origin main
  ```

---

## 📦 6. Building the APK (Submission)
To generate an installable file for final testing:

1. **Login:** `eas login`
2. **Execute Build:** `eas build -p android --profile preview`
3. **Download:** Follow the link provided in the terminal after 15-20 minutes to get the `.apk` file.

---
**Visual Graphics Design - Group 4**
*Pamantasan ng Lungsod ng Maynila*
