export type DefaultQuery = {
  id: string;
  label: string;
  prompt: string;
};

export const DEFAULT_QUERIES: DefaultQuery[] = [
  {
    id: "translate-zh",
    label: "翻译成中文",
    prompt: "请把截图中的内容翻译成中文。"
  },
  {
    id: "translate-en",
    label: "翻译成英文",
    prompt: "Please translate the content in the screenshot into English."
  },
  {
    id: "extract-text",
    label: "提取文字",
    prompt: "请提取截图中的文字，并保持原有层次。"
  },
  {
    id: "summarize",
    label: "总结这张图",
    prompt: "请总结这张截图的核心信息。"
  },
  {
    id: "explain",
    label: "解释/分析",
    prompt: "请解释并分析这张截图中的内容。"
  }
];
