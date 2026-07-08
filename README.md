# Codex Screenshot Query

A small macOS menu bar helper for sending screenshots and preset prompts into Codex Desktop.

## Features

- Global shortcut: `Control+Q`
- macOS interactive area screenshot
- Screenshot is kept in memory and clipboard only; it is not saved locally
- Floating action bar after capture
- Preset actions:
  - Copy/transcribe visible text
  - Extract text
  - Translate to Chinese
  - Translate to English
  - Ask Codex
- Pastes the screenshot and prompt into Codex Desktop via clipboard and macOS automation
- Optional DMG packaging with `electron-builder`

## Requirements

- macOS
- Node.js 22+
- Codex Desktop installed
- Accessibility permission for the terminal/app that launches this helper, so it can send `Cmd+V` through System Events

## Development

```bash
npm install
npm start
```

Run checks:

```bash
npm test
npm run build
npm audit --audit-level=moderate
```

## Packaging

Unsigned local DMG:

```bash
npm run package:dmg
```

Signed and notarized DMG:

```bash
npm run check:mac-signing
npm run package:dmg:signed
```

See [build/README-mac-signing.md](build/README-mac-signing.md) for certificate and notarization setup.

## Notes

This project uses macOS `screencapture`, Electron clipboard APIs, and AppleScript/System Events to paste into Codex Desktop. If automatic paste does not work, grant Accessibility permission in macOS System Settings.

## License

MIT
