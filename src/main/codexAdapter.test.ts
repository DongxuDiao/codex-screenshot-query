import { describe, expect, it } from "vitest";
import { buildCodexPasteScript } from "./codexAdapter";

describe("buildCodexPasteScript", () => {
  it("activates Codex by bundle id instead of process name", () => {
    const script = buildCodexPasteScript();

    expect(script).toContain('tell application id "com.openai.codex" to activate');
    expect(script).not.toContain('exists process "Codex"');
    expect(script).toContain('keystroke "v" using command down');
  });
});
