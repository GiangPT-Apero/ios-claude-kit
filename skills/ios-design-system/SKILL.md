---
name: ios-design-system
description: Setup or customize the iOS design system — colors, fonts, spacing, and components. Use when user wants to apply brand colors, add custom fonts, change app theme, generate design tokens, or asks about AppColors, AppFonts, AppSpacing.
---

# iOS Design System

Setup and customize design tokens for SwiftUI apps. Generates `AppColors.swift`, `AppFonts.swift`, `AppSpacing.swift` from user input or Figma variables.

**Scope:** Design tokens (colors, fonts, spacing), dark mode support, design system files in this kit's template.
**Does NOT handle:** UI component building, Lottie animations, asset catalog management.

## Arguments

```
/ios-design-system                    → interactive setup (asks what to configure)
/ios-design-system colors             → configure brand colors + dark mode
/ios-design-system fonts              → configure custom fonts
/ios-design-system spacing            → configure spacing scale
/ios-design-system figma <url>        → extract tokens from Figma file
/ios-design-system all                → full design system setup
```

## File Locations

```
<AppName>/
├── Resources/
│   └── Fonts/              ← font files (.ttf, .otf)
└── Utilities/DesignSystem/
    ├── AppColors.swift
    ├── AppFonts.swift
    └── AppSpacing.swift
```

> If these files don't exist at the above paths, search with `Glob "**/{AppColors,AppFonts,AppSpacing}.swift"` to find actual location.

## Colors Setup

### 1. Gather brand colors

Ask user (or read from Figma):
- Primary color (hex)
- Secondary color (hex)
- Background, surface colors
- Text colors (primary, secondary)
- Error, success, warning colors
- Support dark mode? (default: yes)

### 2. Generate AppColors.swift

```swift
import SwiftUI

extension Color {
    // MARK: - Brand
    static let brandPrimary = Color("BrandPrimary")
    static let brandSecondary = Color("BrandSecondary")

    // MARK: - Background
    static let backgroundPrimary = Color("BackgroundPrimary")
    static let backgroundSurface = Color("BackgroundSurface")

    // MARK: - Text
    static let textPrimary = Color("TextPrimary")
    static let textSecondary = Color("TextSecondary")

    // MARK: - Semantic
    static let error = Color("Error")
    static let success = Color("Success")
    static let warning = Color("Warning")
}
```

### 3. Asset Catalog entries

Instruct user to add Color Sets in `Assets.xcassets`:
- For each color, create a Color Set with light + dark variants
- Name must match `Color("...")` string exactly

Provide a table:

| Color Set Name | Light Mode | Dark Mode |
|---------------|-----------|-----------|
| BrandPrimary | #XXXXXX | #XXXXXX |
| ... | ... | ... |

### 4. Hex-based fallback (no asset catalog)

If user prefers hex directly:

```swift
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

    static let brandPrimary = Color(hex: "#YOUR_HEX")
}
```

## Fonts Setup

### 1. Gather font info

Ask user:
- Font family name (e.g. "Inter", "Montserrat")
- Weights needed (regular, medium, semibold, bold)
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

Add `UIAppFonts` array with font file names:
```xml
<key>UIAppFonts</key>
<array>
    <string>FontName-Regular.ttf</string>
    <string>FontName-Medium.ttf</string>
    <string>FontName-SemiBold.ttf</string>
    <string>FontName-Bold.ttf</string>
</array>
```

### 4. Generate AppFonts.swift

```swift
import SwiftUI

enum AppFont {
    static func regular(_ size: CGFloat) -> Font {
        .custom("FontName-Regular", size: size)
    }
    static func medium(_ size: CGFloat) -> Font {
        .custom("FontName-Medium", size: size)
    }
    static func semibold(_ size: CGFloat) -> Font {
        .custom("FontName-SemiBold", size: size)
    }
    static func bold(_ size: CGFloat) -> Font {
        .custom("FontName-Bold", size: size)
    }
}

// Semantic text styles
extension Font {
    static let appTitle: Font = AppFont.bold(28)
    static let appHeadline: Font = AppFont.semibold(20)
    static let appBody: Font = AppFont.regular(16)
    static let appCaption: Font = AppFont.regular(12)
}
```

### 5. Verify font name

Font PostScript name ≠ file name. Find actual name:

```swift
// Temporary: add to AppDelegate to print registered fonts
UIFont.familyNames.sorted().forEach { family in
    UIFont.fontNames(forFamilyName: family).forEach { print($0) }
}
```

Use the printed name in `Font.custom(...)`.

## Spacing Setup

### Generate AppSpacing.swift

```swift
enum AppSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
    static let xxxl: CGFloat = 64
}

enum AppRadius {
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let full: CGFloat = 999
}
```

## Figma Integration

If user provides a Figma URL, use Figma MCP tools:

1. `get_design_context` with fileKey from URL
2. `get_variable_defs` to extract design tokens
3. Map Figma variables → Swift tokens:
   - Color variables → AppColors.swift
   - Typography variables → AppFonts.swift
   - Spacing/radius variables → AppSpacing.swift

Parse Figma URL: `figma.com/design/:fileKey/:name?node-id=:nodeId`

## After Setup

1. Search codebase for raw color/font usage to replace:
```
Grep pattern: "Color(\..*)" or "Color(hex:" or ".font(.system"
```

2. Replace raw values with design tokens:
```swift
// ❌ Raw
.foregroundColor(.blue)
.font(.system(size: 16))
.padding(16)

// ✅ Design tokens
.foregroundColor(.brandPrimary)
.font(.appBody)
.padding(AppSpacing.md)
```

3. Commit:
```
chore: setup design system tokens
```

## Rules

- Never hardcode hex values in View files — always use AppColors tokens
- Never use `.font(.system(...))` in Views — always use AppFont/AppFonts
- Never use magic numbers for padding — always use AppSpacing
- Font PostScript name must match exactly — verify before using
- Dark mode: always provide both light and dark variants for semantic colors
