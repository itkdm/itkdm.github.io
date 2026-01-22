---
name: "示例应用 - 混合下载源"
nameEn: "Example App - Mixed Sources"
description: "这是一个混合使用多种下载源的完整示例"
descriptionEn: "This is a complete example that mixes multiple download sources"
icon: "🎯"
platform: "iOS"
lang: "zh"
order: 5
sources:
  - type: github
    repo: "example/ios-app"
    channel: stable
    preferAssetsRegex: ".*\\.ipa$"
    showSha256: true
  - type: direct
    name: "App Store 直链"
    url: "https://apps.apple.com/app/id1234567890"
    platform: ios
  - type: direct
    name: "TestFlight 测试版"
    url: "https://testflight.apple.com/join/example123"
    platform: ios
  - type: baidu
    name: "百度网盘（IPA文件）"
    url: "https://pan.baidu.com/s/example123"
    code: "test"
    platform: ios
  - type: quark
    name: "夸克网盘（IPA文件）"
    url: "https://pan.quark.cn/s/example123"
    platform: ios
---

这是一个混合使用多种下载源的完整示例，展示了如何同时配置 GitHub Release、直接下载和网盘链接。

## 特点

- ✅ 多种下载方式，用户可选择
- ✅ GitHub Release 自动更新
- ✅ 直接下载快速便捷
- ✅ 网盘备份，稳定可靠

## 下载方式说明

1. **GitHub Release**：开源版本，自动获取最新发布
2. **App Store 直链**：官方应用商店，最稳定
3. **TestFlight**：测试版本，提前体验新功能
4. **网盘备份**：备用下载方式，适合国内用户

## 使用建议

- 优先使用 GitHub Release 或 App Store
- 网盘作为备用方案
- 大文件建议使用网盘
