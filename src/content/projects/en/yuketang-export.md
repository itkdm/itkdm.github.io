---
title: "Yuketang Export Tool"
summary: "A complete browser extension for exporting Yuketang exam papers, supporting iframe quiz mode and normal exam mode, with Markdown and JSON export formats."
tags: ["Browser Extension", "Yuketang", "JavaScript", "Manifest V3", "Chrome Extension"]
lang: "en"
repo: "https://github.com/itkdm/yuketang-export"
demo: "https://ykt.itkdm.com/"
icon: "📚"
order: 3
featured: true
---

A feature-complete browser extension for exporting Yuketang exam paper content. Supports two export modes: iframe quiz mode and normal exam mode, with Markdown and JSON export formats.

## ✨ Features

### Two Export Modes

**1. Iframe Quiz Mode**
- For: `www.yuketang.cn/v2/web/*` and `www.yuketang.cn/v/quiz/*`
- Supports MultipleChoice and FillBlank questions
- Preserves image URLs, no OCR
- Export formats: JSON, Markdown

**2. Normal Exam Mode**
- For: `examination.xuetangx.com/*`
- Exports questions, options, and answers
- Only exports content you have permission to view (review mode)
- Export formats: JSON, Markdown

### Core Features

- ✅ **Smart Detection**: Automatically detects page type and switches modes
- ✅ **Mode Switching**: Manual mode switching support
- ✅ **Toggle Control**: Enable/disable extension anytime
- ✅ **Permission Control**: Only exports content you have permission to view
- ✅ **Secure & Reliable**: All data processing done locally, no data upload
- ✅ **UI Design**: Blue tech-style design, beautiful and easy to use
- ✅ **SPA Compatible**: Listens to URL changes and re-mounts panel

## 🚀 Usage

### Browser Extension (Recommended)

1. Visit `chrome://extensions` or `edge://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select the `extension/` folder
4. Export panel will appear on the right side of the page, toggle available in popup

### User Script Version

1. Install Tampermonkey / Violentmonkey
2. Create a new script, copy content from corresponding `.md` file
3. Visit the page and you'll see the export button

## 🛠️ Technical Implementation

- **Manifest V3**: Uses the latest extension specification
- **Content Script**: Injects functionality into pages
- **Chrome Storage API**: Stores user configuration (e.g., toggle state)
- **Fetch API**: Cross-origin requests (via host_permissions)
- **Vanilla JavaScript**: No third-party dependencies, lightweight and efficient

## 🔒 Privacy & Security

### Data Security

- ✅ **Local Processing**: All data processing done in the user's local browser
- ✅ **No Data Upload**: Does not upload data to any server
- ✅ **No Information Collection**: Does not collect user personal information
- ✅ **Minimal Permissions**: Only requests necessary permissions

### Security Mechanisms

- Normal exam mode checks `show_answer` permission
- Only exports content the user has permission to view
- Does not bypass website permission controls

## 📦 Project Structure

```
yuketang-export/
├── extension/          # Browser extension source (recommended)
│   ├── manifest.json
│   ├── content.js
│   ├── popup.html
│   └── popup.js
├── userscripts/       # User script version
│   ├── Yuketang Export Tool - Iframe Quiz.md
│   └── Yuketang Export Tool - Normal Exam.md
└── test/              # Debug/sample data
```

## ⚙️ Requirements

- Chrome 88+ / Edge 88+ / Firefox 109+
- Modern browser (ES6+ support)

## ⚠️ Disclaimer

This tool is for learning and communication purposes only. Please comply with relevant laws, regulations, and website terms of use. Users are responsible for the risks and responsibilities of using this tool.
