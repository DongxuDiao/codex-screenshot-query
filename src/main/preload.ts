import { contextBridge, ipcRenderer } from "electron";
import type { DefaultQuery } from "../shared/defaultQueries.js";

export type ScreenshotPayload = {
  id: string;
  previewDataUrl: string;
};

export type CaptureResponse =
  | { ok: true; screenshot: ScreenshotPayload }
  | { ok: false; message: string };

export type SendPromptResponse = {
  copied: boolean;
  opened: boolean;
  pasted: boolean;
  message: string;
};

export type CodexScreenshotApi = {
  getDefaultQueries: () => Promise<DefaultQuery[]>;
  getCurrentScreenshot: () => Promise<ScreenshotPayload | null>;
  captureScreenshot: () => Promise<CaptureResponse>;
  sendPrompt: (input: { query: string; screenshotId: string }) => Promise<SendPromptResponse>;
  dismiss: () => Promise<void>;
  onScreenshotCaptured: (callback: (screenshot: ScreenshotPayload) => void) => () => void;
  onScreenshotError: (callback: (message: string) => void) => () => void;
};

const api: CodexScreenshotApi = {
  getDefaultQueries: () => ipcRenderer.invoke("queries:list"),
  getCurrentScreenshot: () => ipcRenderer.invoke("screenshot:current"),
  captureScreenshot: () => ipcRenderer.invoke("screenshot:capture"),
  sendPrompt: (input) => ipcRenderer.invoke("codex:sendPrompt", input),
  dismiss: () => ipcRenderer.invoke("window:dismiss"),
  onScreenshotCaptured: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, screenshot: ScreenshotPayload) => callback(screenshot);
    ipcRenderer.on("screenshot:captured", listener);
    return () => ipcRenderer.removeListener("screenshot:captured", listener);
  },
  onScreenshotError: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => callback(message);
    ipcRenderer.on("screenshot:error", listener);
    return () => ipcRenderer.removeListener("screenshot:error", listener);
  }
};

contextBridge.exposeInMainWorld("codexScreenshot", api);
