/// <reference types="vite/client" />

import type { CodexScreenshotApi } from "../main/preload";

declare global {
  interface Window {
    codexScreenshot: CodexScreenshotApi;
  }
}
