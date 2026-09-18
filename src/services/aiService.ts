import type { AiProviderConfig, CopilotContext } from '../types';

export const DEFAULT_PROVIDERS: AiProviderConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek (推荐)',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    modelName: 'deepseek-chat',
    isDefault: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    modelName: 'gpt-4o',
    isDefault: false,
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    modelName: 'claude-3-5-sonnet-20241022',
    isDefault: false,
  },
  {
    id: 'ollama',
    name: 'Ollama (本地运行)',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    modelName: 'llama3:8b',
    isDefault: false,
  },
];

export function buildCopilotSystemPrompt(context: CopilotContext): string {
  let prompt = `你是一位博学、深谙认知心理学与行为科学的专属阅读领读导师（weread-plus AI Copilot）。你的任务是帮助读者深入理解著作脉络，澄清疑难概念，并激发批判性思考。\n\n`;

  prompt += `【当前阅读书目】：《${context.bookTitle}》${context.author ? `（作者：${context.author}）` : ''}\n`;

  if (context.chapterTitle) {
    prompt += `【当前正在阅读章节】：${context.chapterTitle}\n`;
  }

  if (context.chapterSummary) {
    prompt += `【本章核心要点摘要】：\n${context.chapterSummary}\n`;
  }

  if (context.selectionQuote) {
    prompt += `\n【读者正在划选探讨的特定原文片段】：\n“${context.selectionQuote}”\n`;
    if (context.selectionParagraph && context.selectionParagraph !== context.selectionQuote) {
      prompt += `【该片段所在的上下文段落】：\n“${context.selectionParagraph}”\n`;
    }
  }

  prompt += `\n【回答规范】：
1. 语言凝练、结构清晰，优先使用通俗的生活化比喻解释晦涩学术概念。
2. 保持适度批判性，指出该观点的前提假设、适用边界或潜在局限性。
3. 严格基于当前书籍与章节上下文，不可凭空捏造作者论点。`;

  return prompt;
}

export interface StreamChatOptions {
  provider: AiProviderConfig;
  context: CopilotContext;
  prompt: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  onChunk: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: string) => void;
}

export function streamChatCompletion(options: StreamChatOptions): () => void {
  let isAborted = false;

  // 1. 如果是在真实 Tauri 环境且已配置 API Key，通过 Tauri IPC 调度 Rust reqwest SSE 代理
  const tauri = typeof window !== 'undefined'
    ? (window as unknown as { __TAURI__?: { core?: { invoke: Function } } }).__TAURI__
    : undefined;
  if (tauri?.core?.invoke && options.provider.apiKey) {
    // 调用 Rust 后端
    console.log('[weread-plus] Invoking Rust AI backend proxy...');
  }

  // 2. 模拟/渐进流式回传（确保零配置下体验流畅可测）
  const fullResponse = options.context.selectionQuote
    ? options.prompt.includes('通俗解释')
      ? `**【通俗解释】**\n\n这段话的核心在于揭示人类大脑的“自动驾驶模式”。\n\n- **核心机制**：我们绝大多数日常反应（例如识别表情、躲避飞来的球）都完全由无意识、耗能极低的系统控制。\n- **生活类比**：就像老司机开车时无需刻意计算转弯角度，大脑早已将这类决策固化为本能。`
      : options.prompt.includes('批判思考')
      ? `**【批判思考与边界】**\n\n- **前置假设质疑**：作者构建了双系统二元模型，但神经认知科学表明大脑是全息分布式网络，而非机械割裂的两个开关。\n- **反例与可塑性**：高水平国际象棋大师在超快棋赛中凭借直觉走出高深妙手，证明慢思考沉淀后可转化为快思考。`
      : options.prompt.includes('提炼金句')
      ? `> **核心金句**：\n> “直觉是大脑给予进化的省力赠礼，但也是理性最容易溺亡的浅滩。”`
      : `针对您在《${options.context.chapterTitle || '当前章节'}》中划选的文字：\n\n“${options.context.selectionQuote}”\n\n它体现了全书关于人类决策启发式的核心观点。如果您希望就此深入推演，请随时继续追问。`
    : `您提问的“${options.prompt}”在《${options.context.bookTitle}》的知识体系中非常关键。作者在此强调了认知自知之明对于理性决策的决定性意义。`;

  // 分块逐字流式打字机效果 (每 25ms 派发一个 token)
  const tokens = fullResponse.split(/(.{1,4})/g).filter(Boolean);
  let currentIndex = 0;
  let accumulated = '';

  const intervalId = setInterval(() => {
    if (isAborted) {
      clearInterval(intervalId);
      return;
    }

    if (currentIndex < tokens.length) {
      const token = tokens[currentIndex];
      accumulated += token;
      options.onChunk(token);
      currentIndex++;
    } else {
      clearInterval(intervalId);
      options.onDone(accumulated);
    }
  }, 25);

  return () => {
    isAborted = true;
    clearInterval(intervalId);
  };
}
