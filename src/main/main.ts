import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, screen, Tray, type NativeImage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendPromptToCodex } from "./codexAdapter.js";
import { captureInteractiveScreenshotToClipboard } from "./screenshot.js";
import { DEFAULT_QUERIES } from "../shared/defaultQueries.js";
import { buildCodexPrompt } from "../shared/prompt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray: Tray | null = null;
let panel: BrowserWindow | null = null;
let currentScreenshot: { id: string; image: NativeImage; previewDataUrl: string } | null = null;

const actionPanelSize = { width: 690, height: 64 };
const captureShortcut = "Control+Q";

function createTrayIcon() {
  const image = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAKlBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC3dmhyAAAAA3RSTlMAf3+X3o3IAAAANElEQVR4AWNgwAEmJiYGBgYkYAAjI3BgYICERiYWRmYQVBQYGCgqaGgCkUQAAESVAa8V6aB8AAAAAElFTkSuQmCC"
  );
  image.setTemplateImage(true);
  return image;
}

function createPanel() {
  if (panel && !panel.isDestroyed()) {
    return panel;
  }

  panel = new BrowserWindow({
    width: actionPanelSize.width,
    height: actionPanelSize.height,
    show: false,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: "Codex Screenshot Query",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  panel.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl) {
    void panel.loadURL(rendererUrl);
  } else {
    void panel.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  panel.on("closed", () => {
    panel = null;
  });

  panel.webContents.on("console-message", (_event, level, message) => {
    console.log(`[renderer:${level}] ${message}`);
  });

  return panel;
}

async function waitForPanelReady(currentPanel: BrowserWindow) {
  if (!currentPanel.webContents.isLoading()) {
    return;
  }

  await new Promise<void>((resolve) => {
    currentPanel.webContents.once("did-finish-load", () => resolve());
  });
}

function positionPanelNearCursor(currentPanel: BrowserWindow, size: { width: number; height: number }) {
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const bounds = display.workArea;
  const x = Math.min(Math.max(cursor.x - Math.round(size.width / 2), bounds.x + 8), bounds.x + bounds.width - size.width - 8);
  const y = Math.min(Math.max(cursor.y + 12, bounds.y + 8), bounds.y + bounds.height - size.height - 8);

  currentPanel.setSize(size.width, size.height, false);
  currentPanel.setPosition(x, y, false);
}

async function captureAndShowPanel() {
  const result = await captureInteractiveScreenshotToClipboard();

  if (result.ok) {
    currentScreenshot = {
      id: `${Date.now()}`,
      image: result.image,
      previewDataUrl: result.image.toDataURL()
    };
    const currentPanel = createPanel();
    await waitForPanelReady(currentPanel);
    positionPanelNearCursor(currentPanel, actionPanelSize);
    currentPanel.webContents.send("screenshot:captured", {
      id: currentScreenshot.id,
      previewDataUrl: currentScreenshot.previewDataUrl
    });
    currentPanel.show();
    currentPanel.focus();
  } else {
    currentScreenshot = null;
  }
}

function registerIpc() {
  ipcMain.handle("queries:list", () => DEFAULT_QUERIES);
  ipcMain.handle("screenshot:current", () =>
    currentScreenshot ? { id: currentScreenshot.id, previewDataUrl: currentScreenshot.previewDataUrl } : null
  );

  ipcMain.handle("screenshot:capture", async (event) => {
    const sourcePanel = BrowserWindow.fromWebContents(event.sender);
    sourcePanel?.hide();
    const result = await captureInteractiveScreenshotToClipboard();

    if (!result.ok) {
      sourcePanel?.show();
      return { ok: false, message: result.message };
    }

    currentScreenshot = {
      id: `${Date.now()}`,
      image: result.image,
      previewDataUrl: result.image.toDataURL()
    };

    if (sourcePanel) {
      positionPanelNearCursor(sourcePanel, actionPanelSize);
      sourcePanel.show();
      sourcePanel.focus();
    }

    return {
      ok: true,
      screenshot: {
        id: currentScreenshot.id,
        previewDataUrl: currentScreenshot.previewDataUrl
      }
    };
  });

  ipcMain.handle("codex:sendPrompt", async (event, input: { query: string; screenshotId: string }) => {
    const sourcePanel = BrowserWindow.fromWebContents(event.sender);
    sourcePanel?.hide();
    if (!currentScreenshot || currentScreenshot.id !== input.screenshotId) {
      return {
        copied: false,
        opened: false,
        pasted: false,
        message: "Screenshot is no longer available. Please capture again."
      };
    }

    const prompt = buildCodexPrompt({ query: input.query });
    const result = await sendPromptToCodex({ prompt, image: currentScreenshot.image });
    currentScreenshot = null;
    return result;
  });

  ipcMain.handle("window:dismiss", (event) => {
    currentScreenshot = null;
    BrowserWindow.fromWebContents(event.sender)?.hide();
  });
}

function setTrayMenu(shortcutRegistered: boolean) {
  if (!tray) {
    return;
  }

  tray.setToolTip(
    shortcutRegistered
      ? `Codex Screenshot Query (${captureShortcut})`
      : `Codex Screenshot Query (${captureShortcut} registration failed)`
  );
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: `Capture Screenshot (${captureShortcut})`,
        click: () => {
          void captureAndShowPanel();
        }
      },
      {
        label: shortcutRegistered ? "Shortcut active" : "Shortcut registration failed",
        enabled: false
      },
      { type: "separator" },
      { role: "quit" }
    ])
  );
}

function registerCaptureShortcut() {
  const registered = globalShortcut.register(captureShortcut, () => {
    void captureAndShowPanel();
  });

  if (!registered) {
    console.warn(`Failed to register shortcut: ${captureShortcut}`);
  }

  return registered;
}

app.whenReady().then(() => {
  registerIpc();

  tray = new Tray(createTrayIcon());
  tray.setTitle("CQ");
  setTrayMenu(registerCaptureShortcut());
  tray.on("click", () => {
    void captureAndShowPanel();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // Keep the menu bar helper alive until the user quits explicitly.
});
