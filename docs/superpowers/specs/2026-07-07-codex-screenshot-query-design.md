# Codex Screenshot Query Design

## Goal

Build a macOS menu bar helper that captures an arbitrary screenshot, lets the user choose a default query, and hands the screenshot context to Codex Desktop with a stable fallback.

## User Flow

1. The user clicks the menu bar icon and chooses "Capture Screenshot".
2. The app invokes the macOS interactive screenshot picker.
3. The captured image is saved under the app data directory.
4. A compact panel opens with the screenshot preview, default query buttons, and a custom query field.
5. Choosing a query creates a Codex-ready prompt that includes the query and local screenshot path.
6. The app copies the prompt to the clipboard and opens or focuses Codex Desktop.
7. The user pastes the prompt into Codex and drags or attaches the screenshot when automatic attachment is unavailable.

## Architecture

The app is an Electron + TypeScript menu bar application. The Electron main process owns OS integration: tray lifecycle, screenshot capture, clipboard writes, and Codex app launching. The renderer owns the small query UI. A shared module owns default queries and prompt formatting so it can be tested independently.

Codex integration is an adapter layer. Version one uses the stable fallback of copying a prompt and opening Codex. If a supported Codex Desktop deep link, IPC, AppleScript, CLI, or file import entrypoint is confirmed later, only the adapter needs to change.

## Components

- `src/main/main.ts`: Electron lifecycle, tray menu, panel window, IPC handlers.
- `src/main/screenshot.ts`: macOS screenshot command wrapper using `/usr/sbin/screencapture -i -x`.
- `src/main/codexAdapter.ts`: Clipboard + `open -a Codex` fallback.
- `src/main/preload.ts`: Safe IPC surface for the renderer.
- `src/shared/defaultQueries.ts`: Built-in query presets.
- `src/shared/prompt.ts`: Prompt generation from screenshot path and query.
- `src/renderer/App.tsx`: Screenshot preview, default query buttons, custom query input.

## Error Handling

- Screenshot cancellation returns a visible non-fatal status.
- Missing screenshot files produce a clear error.
- Codex launch failure still leaves the prompt copied to the clipboard.
- Renderer actions show copied/opened status instead of silently failing.

## Testing

Automated tests cover the shared prompt/query logic. Build verification covers TypeScript compilation and renderer bundling. Manual verification covers screenshot picker behavior, tray availability, clipboard contents, and Codex launching on macOS.
