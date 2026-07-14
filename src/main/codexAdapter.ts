import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { clipboard, type NativeImage } from "electron";

const execFileAsync = promisify(execFile);
const codexBundleId = "com.openai.codex";

export type SendToCodexResult = {
  copied: boolean;
  opened: boolean;
  pasted: boolean;
  message: string;
};

type CodexPasteDependencies<TImage> = {
  writeImage: (image: TImage) => void;
  writeText: (text: string) => void;
  paste: () => Promise<void>;
  wait: (milliseconds: number) => Promise<void>;
};

export function buildCodexPasteScript() {
  return [
    `tell application id "${codexBundleId}" to activate`,
    "delay 0.7",
    'tell application "System Events"',
    '  keystroke "v" using command down',
    "end tell"
  ].join("\n");
}

async function pasteClipboardIntoCodex() {
  await execFileAsync("/usr/bin/osascript", ["-e", buildCodexPasteScript()]);
}

export async function runCodexPasteSequence<TImage>(
  input: { prompt: string; image: TImage },
  dependencies: CodexPasteDependencies<TImage>
) {
  dependencies.writeImage(input.image);
  await dependencies.paste();
  await dependencies.wait(900);
  dependencies.writeText(input.prompt);
  await dependencies.paste();
}

export async function sendPromptToCodex(input: { prompt: string; image: NativeImage }): Promise<SendToCodexResult> {
  try {
    await execFileAsync("/usr/bin/open", ["-b", codexBundleId]);
    await runCodexPasteSequence(input, {
      writeImage: (image) => clipboard.writeImage(image),
      writeText: (text) => clipboard.writeText(text),
      paste: pasteClipboardIntoCodex,
      wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
    });

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
