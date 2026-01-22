---
name: "Example App - GitHub Only"
nameEn: "Example App - GitHub Only"
description: "This is an example that only uses GitHub Release as download source"
descriptionEn: "This is an example that only uses GitHub Release as download source"
icon: "🚀"
platform: "Cross Platform"
lang: "en"
order: 2
sources:
  - type: github
    repo: "example/example-repo"
    channel: stable
    preferAssetsRegex: ".*\\.(zip|tar\\.gz)$"
    showSha256: true
---

This is an example app that only uses GitHub Release as download source.

## Features

- ✅ Automatically fetches latest version from GitHub
- ✅ Supports displaying SHA256 checksums
- ✅ Can specify preferred asset file types

## Use Cases

Suitable for open source projects where all releases are managed through GitHub Releases.
