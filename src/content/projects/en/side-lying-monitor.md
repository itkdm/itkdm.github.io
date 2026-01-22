---
title: "Side Lying Monitor"
summary: "An intelligent side-lying monitoring and health reminder app that helps users avoid prolonged side-lying phone usage by monitoring device posture in real-time, protecting cervical health."
tags: ["Flutter", "Mobile App", "Health", "Sensor", "Android", "Dart"]
lang: "en"
repo: "https://github.com/itkdm/side-lying-monitor"
icon: "📱"
order: 5
featured: true
---

Side Lying Monitor is an intelligent side-lying monitoring app that helps users avoid prolonged side-lying phone usage by monitoring device posture in real-time, protecting cervical health.

## ✨ Core Features

- ✅ **Real-time Posture Monitoring**: Monitors device posture in real-time through sensors, identifying side-lying positions
- ✅ **Smart Reminders**: Vibrates and notifies users when side-lying posture is detected
- ✅ **Custom Postures**: Supports recording and recognizing custom postures
- ✅ **Do Not Disturb Mode**: Supports setting quiet hours
- ✅ **Statistics**: Records daily reminder counts
- ✅ **Theme Switching**: Supports dark/light theme switching
- ✅ **Background Running**: Supports continuous background monitoring (Android)

## 🛠️ Tech Stack

- **Framework**: Flutter 3.24.3
- **Language**: Dart 3.5.3
- **Main Dependencies**:
  - `sensors_plus` - Sensor data collection
  - `vibration` - Vibration feedback
  - `shared_preferences` - Local data storage
  - `flutter_local_notifications` - Local notifications

## 📦 Project Structure

```
lib/
├── controllers/          # Controllers (reminders, lifecycle)
├── models/              # Data models
├── pages/               # Page components
├── services/           # Service layer (monitoring, settings, notifications, etc.)
├── utils/              # Utility classes
└── widgets/            # Common widgets
```

## 🚀 Quick Start

### Requirements

- Flutter SDK >= 3.5.0
- Dart SDK >= 3.5.0
- Android Studio / VS Code
- Android SDK (Android 8.0+)

### Installation Steps

1. **Clone the project**

   **GitHub:**
   ```bash
   git clone git@github.com:itkdm/side-lying-monitor.git
   cd side-lying-monitor
   ```

   **Gitee:**
   ```bash
   git clone git@gitee.com:itkdm/side-lying-monitor.git
   cd side-lying-monitor
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Run the project**
   ```bash
   flutter run
   ```

### Build Release Version

**Android APK**
```bash
flutter build apk --release
```

**Android App Bundle**
```bash
flutter build appbundle --release
```

## 🔧 Architecture Design

The project adopts a layered architecture:
- **UI Layer**: Flutter Widgets, responsible for user interface display
- **Controller Layer**: Manages business logic and state
- **Service Layer**: Provides core functionality services (monitoring, settings, notifications, etc.)
- **Native Layer**: Android native services, responsible for background monitoring and floating windows

### Core Services

- `PostureMonitor` - Posture monitoring service
- `SettingsRepository` - Settings management
- `ReminderController` - Reminder control
- `LifecycleCoordinator` - Lifecycle coordination
- `FloatingWindowManager` - Floating window management

## ⚠️ Notes

1. **Permission Requirements**:
   - Android requires floating window permission (for background monitoring)
   - Requires notification permission (for reminders)
   - Requires battery optimization ignore permission (to ensure background operation)

2. **Compatibility**:
   - Minimum support: Android 8.0 (API 26)
   - Recommended: Android 10.0+ (API 29)

3. **Performance Optimization**:
   - Sensor sampling frequency optimized to reduce battery consumption
   - Uses WakeLock to ensure stable background service operation

## 📄 License

This project uses a private license and may not be used without authorization.
