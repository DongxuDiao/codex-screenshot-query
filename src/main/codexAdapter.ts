import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { clipboard, type NativeImage } from "electron";

const execFileAsync = promisify(execFile);

export type SendToCodexResult = {
  copied: boolean;
  opened: boolean;
  pasted: boolean;
  message: string;
};

async function pasteClipboardIntoCodex() {
  await execFileAsync("/usr/bin/osascript", [
    "-e",
    [
      'tell application "Codex" to activate',
      "delay 0.25",
      'tell application "System Events"',
      '  if exists process "Codex" then',
      '    keystroke "v" using command down',
      "  end if",
      "end tell"
    ].join("\n")
  ]);
}

export async function sendPromptToCodex(input: { prompt: string; image: NativeImage }): Promise<SendToCodexResult> {
  try {
    await execFileAsync("/usr/bin/open", ["-a", "Codex"]);
    clipboard.writeImage(input.image);
    await pasteClipboardIntoCodex();
    await new Promise((resolve) => setTimeout(resolve, 250));
    clipboard.writeText(input.prompt);
    await pasteClipboardIntoCodex();

    return {
      copied: true,
      opened: true,
      pasted: true,
      message: "Prompt copied and pasted into Codex."
    };
  } catch {
    clipboard.writeText(input.prompt);

    return {
      copied: true,
      opened: true,
      pasted: false,
      message: "Prompt copied. I could not paste into Codex automatically, likely due to macOS Accessibility permission."
    };
  }
}
