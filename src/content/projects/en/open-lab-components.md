---
title: "Open Lab Components"
summary: "HTML fragment component library for host systems, focused on physics lab components. Pure HTML Fragment, CSS variable-driven, zero external dependencies, style isolation, plug-and-play."
tags: ["Component Library", "HTML", "Physics", "Education", "STEM", "Lab"]
lang: "en"
repo: "https://github.com/itkdm/open-lab-components"
demo: "https://olc.itkdm.com/"
icon: "🧪"
order: 4
featured: true
---

An **HTML fragment single component library** for "host systems/editors/canvas": components only handle "what the apparatus looks like + what parameters are adjustable + how parameters map to visuals", not page layout/background/descriptive text.

## ✨ Core Features

- 🎯 **Pure HTML Fragment**: Each component is an independent HTML fragment with no external framework dependencies
- 🎨 **CSS Variable-Driven**: All configurable parameters exposed via CSS variables, flexible and easy to use
- 🚫 **Zero External Dependencies**: Components are completely self-contained with no external resource references
- 🔒 **Style Isolation**: CSS scoping is completely isolated and won't pollute the host environment
- 📦 **Plug-and-Play**: Can be directly copied and pasted into any HTML environment
- 🛠️ **Type-Safe**: Parameter types and default values declared via Manifest
- ♿ **Accessibility Support**: Built-in ARIA labels, supports screen readers

## 📦 Component List

Currently includes **6 physics experiment components**, covering the following categories:

### Physics Apparatus
- 💡 **Bulb** (`phy.apparatus.bulb.basic`) - Basic bulb component
- 📏 **Ruler** (`phy.ruler.vertical.metric`) - Vertical metric ruler
- ⚖️ **Weight (Basic)** (`phy.weight.mass.basic`) - Basic weight component
- ⚖️ **Weight (Realistic)** (`phy.weight.hook.realistic`) - Realistic hook weight

### Circuit Components
- 🔌 **Resistor** (`phy.resistor.axial.basic`) - Axial resistor with customizable color bands
- 🔋 **Voltmeter** (`phy.meter.voltage.draggable`) - Draggable voltmeter component

## 🚀 Quick Start

### Method 1: Direct Copy HTML Fragment

1. Find the component file you need in the `components/` directory
2. Copy the entire file content
3. Paste it into your HTML page
4. Configure parameters via CSS variables or `data-props` attribute

```html
<div class="cmp" data-cmp-id="phy.resistor.axial.basic" 
     style="--cmp-size: 80px; --cmp-body: #caa070;">
    <!-- ... component content ... -->
</div>
```

### Method 2: Using data-props Attribute

```html
<div class="cmp" 
     data-cmp-id="phy.resistor.axial.basic"
     data-props='{"size": 100, "body": "#caa070", "stroke": "#111827"}'>
    <!-- Component will automatically parse data-props and apply config -->
</div>
```

### Method 3: Dynamic Loading (JavaScript)

```javascript
async function loadComponent(componentId) {
    const response = await fetch(`components/physics/circuit/${componentId}.html`);
    const html = await response.text();
    return html;
}

const resistorHtml = await loadComponent('phy.resistor.axial.basic');
document.getElementById('container').innerHTML = resistorHtml;
```

## 🛠️ Development Guide

### Local Development

```bash
# Validate all components
npm run validate

# Build registry and showcase site
npm run build

# Start local development server
npm run dev:site
```

Visit `http://localhost:3000` to view the component showcase site, where you can:
- Browse all components
- Preview and adjust parameters in real-time
- Copy component code
- View component documentation

### Adding New Components

1. **Choose category and location**: Create corresponding directory structure under `components/`
2. **Create component file**: Fill in Manifest metadata, implement component HTML/CSS/JS
3. **Local validation and registration**: Run `npm run validate` and `npm run build-registry`
4. **Submit PR**: Ensure it passes CI validation

## 📁 Project Structure

```
open-lab-components/
├── components/          # Component source files (1 file = 1 component)
│   └── physics/
│       ├── apparatus/   # Physics apparatus components
│       └── circuit/     # Circuit components
├── registry/           # Machine-readable index (auto-generated)
├── site/               # Showcase site (component gallery)
├── tools/              # Build and validation tools
└── docs/               # Documentation and specifications
```

## 🔧 Component Specification

Each component must follow these specifications:

1. **File Format**: Must be HTML fragment (no doctype/html/head/body)
2. **Manifest Metadata**: Component file top must contain `@cmp-manifest` comment block
3. **Style Requirements**: Styles must be inline, CSS selectors must be scoped isolated
4. **JavaScript (Optional)**: Must use IIFE self-contained, don't expose variables to global scope

For detailed specifications, see [Component Specification Documentation](https://github.com/itkdm/open-lab-components/blob/main/docs/SPEC.md).

## 📦 Available Scripts

```bash
# Validate all components against specification
npm run validate

# Build component registry
npm run build:registry

# Build showcase site
npm run build:site

# Build all content
npm run build

# Start development server (showcase site)
npm run dev:site
```

## 🔗 Related Links

- [Component Showcase Site](https://itkdm.github.io/open-lab-components) - Browse and test components online
- [Component Specification Documentation](https://github.com/itkdm/open-lab-components/blob/main/docs/SPEC.md) - Detailed component development specification
- [Category Rules Documentation](https://github.com/itkdm/open-lab-components/blob/main/docs/CATEGORY.md) - Component categorization and naming rules
- [Contributing Guide](https://github.com/itkdm/open-lab-components/blob/main/docs/CONTRIBUTING.md) - How to contribute
