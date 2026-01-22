---
name: "Example App - Mixed Sources"
nameEn: "Example App - Mixed Sources"
description: "This is a complete example that mixes multiple download sources"
descriptionEn: "This is a complete example that mixes multiple download sources"
icon: "🎯"
platform: "iOS"
lang: "en"
order: 5
sources:
  - type: github
    repo: "example/ios-app"
    channel: stable
    preferAssetsRegex: ".*\\.ipa$"
    showSha256: true
  - type: direct
    name: "App Store Direct Link"
    url: "https://apps.apple.com/app/id1234567890"
    platform: ios
  - type: direct
    name: "TestFlight Beta"
    url: "https://testflight.apple.com/join/example123"
    platform: ios
  - type: baidu
    name: "Baidu Netdisk (IPA File)"
    url: "https://pan.baidu.com/s/example123"
    code: "test"
    platform: ios
  - type: quark
    name: "Quark Netdisk (IPA File)"
    url: "https://pan.quark.cn/s/example123"
    platform: ios
---

This is a complete example that mixes multiple download sources, demonstrating how to configure GitHub Release, direct downloads, and cloud disk links simultaneously.

## Features

- ✅ Multiple download methods for user choice
- ✅ GitHub Release auto-updates
- ✅ Direct download fast and convenient
- ✅ Cloud disk backup, stable and reliable

## Download Methods

1. **GitHub Release**: Open source version, automatically fetches latest releases
2. **App Store Direct Link**: Official app store, most stable
3. **TestFlight**: Beta version, early access to new features
4. **Cloud Disk Backup**: Alternative download method, suitable for domestic users

## Usage Recommendations

- Prefer GitHub Release or App Store
- Use cloud disk as backup option
- Large files recommended to use cloud disk
