export type BuildCodexPromptInput = {
  query: string;
};

export function buildCodexPrompt(input: BuildCodexPromptInput): string {
  const query = input.query.trim();

  return [
    query,
    "",
    "请基于我刚刚粘贴到输入框里的截图回答上面的 query。"
  ].join("\n");
}
