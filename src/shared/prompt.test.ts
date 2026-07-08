import { describe, expect, it } from "vitest";
import { DEFAULT_QUERIES } from "./defaultQueries";
import { buildCodexPrompt } from "./prompt";

describe("default queries", () => {
  it("includes Chinese and English translation presets", () => {
    const labels = DEFAULT_QUERIES.map((query) => query.label);

    expect(labels).toContain("翻译成中文");
    expect(labels).toContain("翻译成英文");
  });
});

describe("buildCodexPrompt", () => {
  it("includes the query without a local screenshot path", () => {
    const prompt = buildCodexPrompt({
      query: "翻译成中文"
    });

    expect(prompt).toContain("翻译成中文");
    expect(prompt).not.toContain("截图文件路径");
    expect(prompt).not.toContain("/tmp");
  });
});
