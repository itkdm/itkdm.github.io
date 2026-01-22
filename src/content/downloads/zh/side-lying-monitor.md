---
name: "侧躺监测（枕边哨）"
nameEn: "Side Lying Monitor"
description: "智能侧躺监测与健康提醒应用"
descriptionEn: "Smart side-lying monitoring and health reminder app"
icon: "📱"
platform: "Android"
lang: "zh"
order: 1
sources:
  - type: github
    repo: "itkdm/side-lying-monitor"
    channel: stable
    preferAssetsRegex: ".*\\.apk$"
    showSha256: true
  - type: direct
    name: "直接下载（阿里云OSS）"
    url: "https://example.com/releases/app-v1.0.0.apk"
    size: 15728640
    platform: android
    arch: universal
  - type: baidu
    name: "百度网盘"
    url: "https://pan.baidu.com/s/xxxxxxxx"
    code: "1234"
    platform: android
  - type: quark
    name: "夸克网盘"
    url: "https://pan.quark.cn/s/xxxxxxxx"
    platform: android
---

Side Lying Monitor（枕边哨）是一款智能侧躺监测应用，通过实时监测手机姿态，帮助用户避免长时间侧躺使用手机，从而保护颈椎健康。

## 核心功能

- ✅ **实时姿态监测**：通过传感器实时监测手机姿态，识别侧躺姿势
- ✅ **智能提醒**：检测到侧躺姿势后，通过震动和通知提醒用户
- ✅ **自定义姿势**：支持录制和识别自定义姿势
- ✅ **免打扰模式**：支持设置免打扰时间段
- ✅ **统计功能**：记录每日提醒次数
- ✅ **主题切换**：支持深色/浅色主题切换
- ✅ **后台运行**：支持后台持续监测（Android）
