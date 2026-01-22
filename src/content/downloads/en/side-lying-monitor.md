---
name: "Side Lying Monitor"
nameEn: "Side Lying Monitor"
description: "Smart side-lying monitoring and health reminder app"
descriptionEn: "Smart side-lying monitoring and health reminder app"
icon: "📱"
platform: "Android"
lang: "en"
order: 1
sources:
  - type: github
    repo: "itkdm/side-lying-monitor"
    channel: stable
    preferAssetsRegex: ".*\\.apk$"
    showSha256: true
  - type: direct
    name: "Direct Download (Aliyun OSS)"
    url: "https://example.com/releases/app-v1.0.0.apk"
    size: 15728640
    platform: android
    arch: universal
  - type: baidu
    name: "Baidu Netdisk"
    url: "https://pan.baidu.com/s/xxxxxxxx"
    code: "1234"
    platform: android
  - type: quark
    name: "Quark Netdisk"
    url: "https://pan.quark.cn/s/xxxxxxxx"
    platform: android
---

Side Lying Monitor is a smart side-lying monitoring app that helps users avoid using their phones while lying on their side for extended periods, protecting cervical health.

## Core Features

- ✅ **Real-time Posture Monitoring**: Real-time monitoring of phone posture through sensors to identify side-lying positions
- ✅ **Smart Reminders**: Vibration and notification alerts when side-lying is detected
- ✅ **Custom Postures**: Support for recording and recognizing custom postures
- ✅ **Do Not Disturb Mode**: Support for setting quiet hours
- ✅ **Statistics**: Daily reminder count tracking
- ✅ **Theme Switching**: Support for dark/light theme switching
- ✅ **Background Running**: Support for continuous background monitoring (Android)
