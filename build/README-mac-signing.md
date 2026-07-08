# macOS Signing and Notarization

This app is configured for direct macOS distribution with `electron-builder`.

## Required local setup

1. Install a **Developer ID Application** certificate in the macOS login keychain.
2. Provide notarization credentials with one of these options.

Apple ID option:

```bash
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCDE12345"
```

App Store Connect API key option:

```bash
export APPLE_API_KEY="<base64-encoded-p8-content>"
export APPLE_API_KEY_ID="KEYID"
export APPLE_API_ISSUER="issuer-uuid"
export APPLE_TEAM_ID="ABCDE12345"
```

## Build

```bash
npm run check:mac-signing
npm run package:dmg:signed
```

The notarized DMG is written to `release/`.
