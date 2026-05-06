---
name: ios-design-system
description: Setup or customize the iOS design system — colors, fonts, and components. Use when user wants to apply brand colors, add custom fonts, change app theme, generate design tokens, or asks about AppColors, AppFonts, ColoringFont, ColoringTextStyle.
---

# iOS Design System

Setup and customize design tokens for SwiftUI apps. Generates color and font token files from user input or Figma variables.

**Scope:** Design tokens (colors, fonts), dark mode support, `.textStyle()` modifier pattern.
**Does NOT handle:** UI component building, Lottie animations, asset catalog management, spacing tokens.

## Arguments

```
/ios-design-system                    → interactive setup (asks what to configure)
/ios-design-system colors             → configure brand colors + dark mode
/ios-design-system fonts              → configure custom fonts
/ios-design-system figma <url>        → extract tokens from Figma file
/ios-design-system all                → full design system setup
```

## File Locations

```
<AppName>/
├── Resources/
│   └── Fonts/              ← font files (.ttf, .otf)
└── Utilities/DesignSystem/
    ├── <AppPrefix>Color.swift    ← nested Color enums
    └── <AppPrefix>Font.swift     ← font system + text styles
```

> If these files don't exist at the above paths, search with `Glob "**/*Color.swift" "**/*Font.swift"` to find actual location.

## Colors Setup

### 1. Gather brand colors

Ask user (or read from Figma):
- Brand/accent colors (primary, secondary)
- Background colors (primary, card/surface)
- Text colors (primary, secondary, placeholder)
- Semantic colors (error, success, warning)
- Support dark mode? (default: yes)

### 2. Color file — nested enum pattern

Colors are organized as nested enums inside `Color` extensions. Each group is a separate enum.

```swift
// Utilities/DesignSystem/<AppPrefix>Color.swift
import SwiftUI

// MARK: - Hex initializer
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b, a: UInt64
        switch hex.count {
        case 6: (r, g, b, a) = (int >> 16, int >> 8 & 0xFF, int & 0xFF, 255)
        case 8: (r, g, b, a) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (r, g, b, a) = (0, 0, 0, 255)
        }
        self.init(.sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255)
    }
}

// MARK: - Brand colors
extension Color {
    enum Brand {
        static let primary = Color(hex: "#YOUR_HEX")
        static let secondary = Color(hex: "#YOUR_HEX")
    }
}

// MARK: - Background colors
extension Color {
    enum Background {
        static let primary = Color(hex: "#YOUR_HEX")
        static let card = Color(hex: "#YOUR_HEX")
    }
}

// MARK: - Text colors
extension Color {
    enum Text {
        static let primary = Color(hex: "#YOUR_HEX")
        static let secondary = Color(hex: "#YOUR_HEX")
        static let placeholder = Color(hex: "#YOUR_HEX")
    }
}

// MARK: - Semantic colors
extension Color {
    enum Semantic {
        static let error = Color(hex: "#FF3B30")
        static let success = Color(hex: "#34C759")
        static let warning = Color(hex: "#FF9500")
    }
}
```

**Usage in Views:**
```swift
.foregroundColor(.Brand.primary)
.background(Color.Background.card)
```

### 3. Dark mode

For dark mode support, use `@Environment(\.colorScheme)` in Views or define separate hex values per mode:

```swift
extension Color {
    enum Background {
        static let primary = Color(hex: colorScheme == .dark ? "#1C1C1E" : "#FFFFFF")
        // Or use asset catalog Color Sets for adaptive colors
    }
}
```

If the project uses Asset Catalog adaptive colors, use `Color("ColorSetName")` instead of `Color(hex:)` for those tokens.

## Fonts Setup

### 1. Gather font info

Ask user:
- Font family name (e.g. "Outfit", "Inter", "Montserrat")
- Weights needed (regular, medium, semibold, bold, etc.)
- Font file format (.ttf or .otf)

### 2. Add font files to project

```
<AppName>/Resources/Fonts/
├── FontName-Regular.ttf
├── FontName-Medium.ttf
├── FontName-SemiBold.ttf
└── FontName-Bold.ttf
```

### 3. Register in Info.plist

```xml
<key>UIAppFonts</key>
<array>
    <string>FontName-Regular.ttf</string>
    <string>FontName-Medium.ttf</string>
    <string>FontName-SemiBold.ttf</string>
    <string>FontName-Bold.ttf</string>
</array>
```

### 4. Font file — three-layer pattern

The font system has 3 layers: PostScript names → text styles → `.textStyle()` modifier.

```swift
// Utilities/DesignSystem/<AppPrefix>Font.swift
import SwiftUI

// Layer 1: PostScript name enum (one case per font file)
enum <AppPrefix>FontSystem {
    enum <FamilyName> {
        static let regular = "<PostScriptName>-Regular"
        static let medium = "<PostScriptName>-Medium"
        static let semiBold = "<PostScriptName>-SemiBold"
        static let bold = "<PostScriptName>-Bold"
    }
}

// Layer 2: Text style struct (font + lineHeight)
struct <AppPrefix>TextStyle {
    let font: Font
    let lineHeight: CGFloat
}

// Layer 3: Semantic token enum
enum <AppPrefix>Font {
    enum Display {
        static let bold = <AppPrefix>TextStyle(
            font: .custom(<AppPrefix>FontSystem.<FamilyName>.bold, size: 32),
            lineHeight: 40
        )
    }
    enum Heading {
        static let semiBold = <AppPrefix>TextStyle(
            font: .custom(<AppPrefix>FontSystem.<FamilyName>.semiBold, size: 24),
            lineHeight: 32
        )
    }
    enum Body {
        static let regular = <AppPrefix>TextStyle(
            font: .custom(<AppPrefix>FontSystem.<FamilyName>.regular, size: 16),
            lineHeight: 24
        )
        static let semiBold = <AppPrefix>TextStyle(
            font: .custom(<AppPrefix>FontSystem.<FamilyName>.semiBold, size: 16),
            lineHeight: 24
        )
    }
    enum Caption {
        static let regular = <AppPrefix>TextStyle(
            font: .custom(<AppPrefix>FontSystem.<FamilyName>.regular, size: 12),
            lineHeight: 16
        )
    }
}
```

### 5. `.textStyle()` View modifier

```swift
// Utilities/DesignSystem/<AppPrefix>Font.swift (append to same file)

struct TextStyleModifier: ViewModifier {
    let style: <AppPrefix>TextStyle

    func body(content: Content) -> some View {
        content
            .font(style.font)
            .lineSpacing(style.lineHeight - UIFont.systemFontSize) // adjust as needed
    }
}

extension View {
    func textStyle(_ style: <AppPrefix>TextStyle) -> some View {
        modifier(TextStyleModifier(style: style))
    }
}
```

**Usage in Views:**
```swift
Text("Hello")
    .textStyle(<AppPrefix>Font.Body.regular)

Text("Title")
    .textStyle(<AppPrefix>Font.Heading.semiBold)
    .foregroundColor(.Brand.primary)
```

### 6. Verify font PostScript name

Font PostScript name ≠ file name. Find actual name:

```swift
// Temporary: add to app entry point to print registered fonts
UIFont.familyNames.sorted().forEach { family in
    UIFont.fontNames(forFamilyName: family).forEach { print($0) }
}
```

Use the printed name in `Font.custom(...)`.

## Figma Integration

If user provides a Figma URL, use Figma MCP tools:

1. `get_design_context` with fileKey from URL
2. `get_variable_defs` to extract design tokens
3. Map Figma variables → Swift tokens:
   - Color variables → nested `Color` enum groups
   - Typography variables → `<AppPrefix>Font` enum cases with `<AppPrefix>TextStyle`

Parse Figma URL: `figma.com/design/:fileKey/:name?node-id=:nodeId`

## After Setup

Search codebase for raw usage to replace:

```
Grep: ".foregroundColor(.blue)" or "Color(hex:" at call site or ".font(.system"
```

Replace with design tokens:
```swift
// Before
.foregroundColor(.blue)
.font(.system(size: 16))

// After
.foregroundColor(.Brand.primary)
.textStyle(<AppPrefix>Font.Body.regular)
```

Commit:
```
chore: setup design system tokens
```

## Rules

- **Never use flat `Color` extensions** — always use nested enum groups (`Color.Brand`, `Color.Background`, etc.)
- **Never use `AppFont.regular(16)` function pattern** — use `<AppPrefix>TextStyle` struct + `.textStyle()` modifier
- **Never use `.font(.system(...))` in Views** — always use `.textStyle()`
- **No `AppSpacing` enum** — spacing values are project-specific; use explicit values or add spacing tokens only if the project already has them
- Font PostScript name must match exactly — verify before using
- Dark mode: provide adaptive colors where needed (hex per mode or Asset Catalog Color Sets)
