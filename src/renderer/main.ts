import "./styles.css";
import type { DefaultQuery } from "../shared/defaultQueries";
import type { ScreenshotPayload } from "../main/preload";

const initialStatus = "截图后选择一个操作。";

let queries: DefaultQuery[] = [];
let screenshot: ScreenshotPayload | null = null;
let customQuery = "";
let isBusy = false;
let statusText = initialStatus;

function getApi() {
  return window.codexScreenshot;
}

function findQuery(id: string, fallback: string) {
  return queries.find((query) => query.id === id)?.prompt ?? fallback;
}

function setStatus(nextStatus: string) {
  statusText = nextStatus;
  render();
}

function canSend() {
  return Boolean(screenshot && !isBusy);
}

async function captureScreenshot() {
  const api = getApi();
  if (!api) {
    setStatus("无法访问 Electron preload API，请重启应用。");
    return;
  }

  isBusy = true;
  setStatus("框选截图区域...");
  const response = await api.captureScreenshot();

  if (response.ok) {
    screenshot = response.screenshot;
    statusText = "已截图，选择一个操作发送到 Codex。";
  } else {
    statusText = response.message;
  }

  isBusy = false;
  render();
}

async function sendQuery(query: string) {
  const api = getApi();
  if (!api) {
    setStatus("无法访问 Electron preload API，请重启应用。");
    return;
  }

  if (!screenshot) {
    setStatus("请先截图。");
    return;
  }

  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    setStatus("请输入 query。");
    return;
  }

  isBusy = true;
  render();
  const result = await api.sendPrompt({
    query: trimmedQuery,
    screenshotId: screenshot.id
  });
  isBusy = false;
  setStatus(result.message);
}

function clearScreenshot() {
  screenshot = null;
  statusText = initialStatus;
  render();
  void getApi()?.dismiss();
}

function button(label: string, onClick: () => void, options: { className?: string; disabled?: boolean; icon?: string } = {}) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.disabled = Boolean(options.disabled);
  if (options.className) {
    element.className = options.className;
  }
  element.addEventListener("click", onClick);
  return element;
}

function render() {
  const root = document.getElementById("root");
  if (!root) {
    return;
  }

  root.textContent = "";

  const shell = document.createElement("main");
  shell.className = screenshot ? "app-shell action-shell" : "app-shell idle-shell";

  if (!screenshot) {
    const topbar = document.createElement("header");
    topbar.className = "topbar";

    const titleGroup = document.createElement("div");
    const title = document.createElement("h1");
    title.textContent = "Codex Screenshot Query";
    const status = document.createElement("p");
    status.setAttribute("aria-live", "polite");
    status.textContent = statusText;
    titleGroup.append(title, status);

    topbar.append(titleGroup, button("截图", captureScreenshot, { className: "capture-button", disabled: isBusy }));
    shell.append(topbar);
  }

  const stage = document.createElement("section");
  stage.className = screenshot ? "capture-stage has-shot" : "capture-stage";
  stage.setAttribute("aria-label", "Screenshot preview");

  if (screenshot) {
    const preview = document.createElement("div");
    preview.className = "shot-preview";
    const image = document.createElement("img");
    image.src = screenshot.previewDataUrl;
    image.alt = "截图区域预览";
    preview.append(image);

    const actionBar = document.createElement("div");
    actionBar.className = "action-bar";
    actionBar.setAttribute("role", "toolbar");
    actionBar.setAttribute("aria-label", "Screenshot actions");

    const extractTextQuery = findQuery("extract-text", "请提取截图中的文字，并保持原有层次。");
    const translateZhQuery = findQuery("translate-zh", "请把截图中的内容翻译成中文。");
    const translateEnQuery = findQuery("translate-en", "Please translate the content in the screenshot into English.");
    const explainQuery = findQuery("explain", "请解释并分析这张截图中的内容。");

    actionBar.append(
      button("复制", () => sendQuery("请复制/转写截图中的可见文字内容。"), { disabled: !canSend() }),
      button("提取文字", () => sendQuery(extractTextQuery), { disabled: !canSend() }),
      button("翻译中文", () => sendQuery(translateZhQuery), { disabled: !canSend() }),
      button("翻译英文", () => sendQuery(translateEnQuery), { disabled: !canSend() }),
      button("重截", captureScreenshot, { disabled: isBusy }),
      button("取消", clearScreenshot, { disabled: isBusy }),
      button("问问 Codex", () => sendQuery(customQuery || explainQuery), {
        className: "ask-button",
        disabled: !canSend()
      })
    );
    stage.append(preview, actionBar);
  } else {
    stage.append(button("点击开始截图", captureScreenshot, { className: "empty-state", disabled: isBusy }));
  }

  const custom = document.createElement("section");
  custom.className = "custom-query";
  custom.setAttribute("aria-label", "Custom query");

  const textarea = document.createElement("textarea");
  textarea.value = customQuery;
  textarea.placeholder = "输入自定义 query，或直接点上面的默认操作";
  textarea.rows = 2;
  textarea.addEventListener("input", () => {
    customQuery = textarea.value;
  });

  custom.append(textarea, button("发送自定义 query", () => sendQuery(customQuery), { disabled: !canSend() }));
  shell.append(stage);

  if (!screenshot) {
    shell.append(custom);
  }

  root.append(shell);
}

async function bootstrap() {
  const api = getApi();
  if (!api) {
    render();
    setStatus("Electron preload API 未就绪。");
    return;
  }

  queries = await api.getDefaultQueries();
  screenshot = await api.getCurrentScreenshot();
  if (screenshot) {
    statusText = "已截图，选择一个操作发送到 Codex。";
  }
  api.onScreenshotCaptured((nextScreenshot) => {
    screenshot = nextScreenshot;
    statusText = "已截图，选择一个操作发送到 Codex。";
    render();
  });
  api.onScreenshotError((message) => {
    setStatus(message);
  });
  render();
}

window.addEventListener("error", (event) => {
  setStatus(`渲染错误：${event.message}`);
});

void bootstrap();
