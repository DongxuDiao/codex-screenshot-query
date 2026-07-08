import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { clipboard, nativeImage } from "electron";

const execFileAsync = promisify(execFile);

export type ScreenshotResult =
  | { ok: true; image: Electron.NativeImage }
  | { ok: false; reason: "cancelled" | "failed"; message: string };

export async function captureInteractiveScreenshotToClipboard(): Promise<ScreenshotResult> {
  try {
    await execFileAsync("/usr/sbin/screencapture", ["-i", "-c"]);
    const image = clipboard.readImage();

    if (image.isEmpty()) {
      return {
        ok: false,
        reason: "cancelled",
        message: "Screenshot was cancelled or no image was copied."
      };
    }

    return { ok: true, image: nativeImage.createFromBuffer(image.toPNG()) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown screenshot error.";
    return {
      ok: false,
      reason: "failed",
      message
    };
  }
}
