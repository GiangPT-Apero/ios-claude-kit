# Post-Bootstrap Setup Guide

## Immediate Steps After Bootstrap

### 1. Open the Workspace
```bash
open *.xcworkspace   # NOT *.xcodeproj
```
Always open `.xcworkspace` when using CocoaPods. Opening `.xcodeproj` directly will cause Factory import errors.

### 2. Signing Configuration
- Xcode → Target → Signing & Capabilities
- Select your Apple Developer Team
- Xcode will auto-manage provisioning profiles

### 3. Verify Factory Imports
Build once (`Cmd+B`). If Factory import errors appear:
```bash
pod deintegrate && pod install
open *.xcworkspace
```

## Configuration Files to Update

### APIEndpoint.swift
```swift
// Data/DataSource/Remote/Network/APIEndpoint.swift
private var baseURL: String {
    return "https://api.yourapp.com/v1"
}
```

### Constants.swift
```swift
// Utilities/Constants.swift
enum Constants {
    static let appName = "YourApp"
    // Add your app-specific constants
}
```

## Firebase Setup (if needed)

1. Create project at Firebase Console
2. Download `GoogleService-Info.plist`
3. Add to Xcode project (drag into `base-swiftui/Resources/`)
4. Add Firebase SDK via CocoaPods:
```ruby
# Podfile
pod 'Firebase/Analytics'
pod 'Firebase/Crashlytics'
```

## Design System Customization

### AppColors.swift
Replace placeholder colors with brand colors:
```swift
extension Color {
    enum Brand {
        static let primary = Color(hex: "#YOUR_HEX")
        static let secondary = Color(hex: "#YOUR_HEX")
    }
}
```

### AppFonts.swift
To use custom fonts:
1. Add font files to `Resources/Fonts/`
2. Register in `Info.plist` under `UIAppFonts`
3. Update `AppFont` enum with font names

## Common Issues

| Issue | Solution |
|-------|----------|
| Factory import error | `pod deintegrate && pod install`, open `.xcworkspace` |
| Signing error | Set team in Target → Signing & Capabilities |
| SwiftData migration error | Schema version mismatch — check `SchemaExtension.swift` |
| AsyncStream not updating | Verify `CoreData` is imported for `NSPersistentStoreRemoteChange` |
| Build fails after rename | Clean build folder (`Cmd+Shift+K`), then rebuild |
