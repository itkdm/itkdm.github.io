---
name: "Example App - Direct Download"
nameEn: "Example App - Direct Download"
description: "This is an example that only uses direct download links, suitable for CDN, OSS scenarios"
descriptionEn: "This is an example that only uses direct download links, suitable for CDN, OSS scenarios"
icon: "💾"
platform: "Windows"
lang: "en"
order: 3
sources:
  - type: direct
    name: "Windows 64-bit"
    url: "https://example.com/releases/app-windows-x64.exe"
    size: 52428800
    platform: windows
    arch: x86_64
  - type: direct
    name: "Windows 32-bit"
    url: "https://example.com/releases/app-windows-x86.exe"
    size: 41943040
    platform: windows
    arch: x86
  - type: direct
    name: "macOS Intel"
    url: "https://example.com/releases/app-macos-intel.dmg"
    size: 62914560
    platform: mac
    arch: x86_64
  - type: direct
    name: "macOS Apple Silicon"
    url: "https://example.com/releases/app-macos-arm64.dmg"
    size: 57671680
    platform: mac
    arch: arm64
  - type: direct
    name: "Linux Universal"
    url: "https://example.com/releases/app-linux.tar.gz"
    size: 36700160
    platform: linux
    arch: universal
---

This is an example app that only uses direct download links, suitable for scenarios using CDN, OSS and other storage services.

## Features

- ✅ Supports multiple platforms and architectures
- ✅ Displays file sizes
- ✅ Direct download, no redirects needed

## Use Cases

Suitable for:
- Using Aliyun OSS, Tencent Cloud COS and other object storage
- Using CDN for accelerated downloads
- Self-hosted file servers
