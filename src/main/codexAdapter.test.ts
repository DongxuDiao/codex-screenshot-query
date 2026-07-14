import { describe, expect, it } from "vitest";
import { buildCodexPasteScript, runCodexPasteSequence } from "./codexAdapter";

describe("buildCodexPasteScript", () => {
  it("activates Codex by bundle id instead of process name", () => {
    const script = buildCodexPasteScript();

    expect(script).toContain('tell application id "com.openai.codex" to activate');
    expect(script).not.toContain('exists process "Codex"');
    expect(script).toContain('keystroke "v" using command down');
  });
});

describe("runCodexPasteSequence", () => {
  it("pastes the image before replacing the clipboard with the prompt", async () => {
    const events: string[] = [];
    const image = { kind: "screenshot" };

    await runCodexPasteSequence(
      { image, prompt: "Translate this screenshot." },
      {
        writeImage: (value) => events.push(value === image ? "write:image" : "write:wrong-image"),
        writeText: (value) => events.push(`write:text:${value}`),
        paste: async () => {
          events.push("paste");
        },
        wait: async (milliseconds) => {
          events.push(`wait:${milliseconds}`);
        }
      }
    );

    expect(events).toEqual([
      "write:image",
      "paste",
      "wait:900",
      "write:text:Translate this screenshot.",
      "paste"
    ]);
  });
});
