# Codex Screenshot Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a macOS Electron menu bar helper for screenshot-driven Codex prompts.

**Architecture:** Electron main process handles OS integrations and exposes a narrow IPC API to a React renderer. Shared TypeScript modules define default queries and prompt generation, with unit tests around the behavior that should remain stable as Codex integration evolves.

**Tech Stack:** Electron, TypeScript, React, Vite, Vitest, macOS `screencapture`, macOS `open`.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.main.json`
- Create: `vite.config.ts`
- Create: `index.html`

- [ ] Create npm scripts for `dev`, `build`, `test`, and `start`.
- [ ] Configure Vite for the renderer and TypeScript for the Electron main/preload files.

### Task 2: Shared Prompt Logic

**Files:**
- Create: `src/shared/defaultQueries.ts`
- Create: `src/shared/prompt.ts`
- Create: `src/shared/prompt.test.ts`

- [ ] Write tests proving built-in queries are available and prompt text includes query plus screenshot path.
- [ ] Run tests and confirm they fail before implementation.
- [ ] Implement the shared modules.
- [ ] Run tests and confirm they pass.

### Task 3: Electron Main Process

**Files:**
- Create: `src/main/screenshot.ts`
- Create: `src/main/codexAdapter.ts`
- Create: `src/main/preload.ts`
- Create: `src/main/main.ts`

- [ ] Implement screenshot capture with `/usr/sbin/screencapture -i -x`.
- [ ] Implement prompt copy and Codex launch fallback.
- [ ] Implement tray menu, panel window, and IPC handlers.

### Task 4: Renderer UI

**Files:**
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/styles.css`
- Create: `src/renderer/vite-env.d.ts`

- [ ] Render screenshot preview, default query buttons, custom query field, and status text.
- [ ] Wire renderer actions through preload IPC.

### Task 5: Verification

**Files:**
- Modify as needed based on verification output.

- [ ] Run `npm install`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Report any manual verification that still requires the user's macOS UI interaction.
