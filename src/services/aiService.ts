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
3. 严格基于当前书籍与章节上下文，客观回答。`;

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
  const controller = new AbortController();
  const { signal } = controller;
  const apiKey = options.provider.apiKey?.trim();

  // 1. 如果配置了真实 API Key (或 Ollama 本地)，发起真实的流式请求
  if (apiKey || options.provider.id === 'ollama') {
    const systemPrompt = buildCopilotSystemPrompt(options.context);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...options.history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: options.prompt },
    ];

    const endpoint = options.provider.baseUrl.endsWith('/')
      ? `${options.provider.baseUrl}chat/completions`
      : `${options.provider.baseUrl}/chat/completions`;

    // 通过 /api/ai-proxy 转发，彻底解决浏览器的跨域 CORS 拦截
    fetch('/api/ai-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: endpoint,
        headers: {
          Authorization: `Bearer ${apiKey || 'ollama'}`,
        },
        payload: {
          model: options.provider.modelName || 'deepseek-chat',
          messages,
          stream: true,
          temperature: 0.7,
        },
      }),
      signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') {
              options.onDone(accumulated);
              return;
            }

            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const content = json.choices?.[0]?.delta?.content || '';
                if (content) {
                  accumulated += content;
                  options.onChunk(content);
                }
              } catch {
                // 忽略未完整的 JSON chunk
              }
            }
          }
        }

        options.onDone(accumulated);
      })
      .catch((err) => {
        if (signal.aborted) {
          console.log('[AI Stream] Aborted by user.');
          return;
        }
        console.error('[AI Stream Error]:', err);
        options.onError(err.message || '网络请求失败，请检查 API Key 或网络代理配置');
      });

    return () => {
      controller.abort();
    };
  }

  // 2. 若用户尚未填入真实 API Key，提供智能引导与真实语料解析演示
  let isAborted = false;
  const guideNotice = `> ⚠️ **提示**：检测到您暂未在右上角【配置模型】中填写真实 API Key（支持 DeepSeek / OpenAI / Claude / Ollama）。\n> 以下为您演示基于当前章节《${options.context.chapterTitle || '正文'}》的知识解析。\n\n`;

  const dynamicContent = options.context.selectionQuote
    ? options.prompt.includes('通俗解释')
      ? `**【通俗解释】**\n\n这段话指出了人类大脑的“省力自适应机制”。\n\n- **核心洞见**：我们日常绝大部分即时判断（如避开障碍、识别情绪）均由无意识、高速度、极低能耗的直觉模块主导。\n- **生活比喻**：就如同老司机开车时无需刻意默念踩油门，神经通路已将复杂的空间速度测算打包为了“本能肌肉记忆”。`
      : options.prompt.includes('批判思考')
      ? `**【批判思考与反思】**\n\n- **前置假设**：作者构建了经典的二元心智架构，但当代认知计算神经学发现各脑区是大规模全息协同网络，不存在机械式的“单向切换”。\n- **适用边界**：当情境充斥高度随机性或陌生变量时，过度依赖直觉往往导致灾难性的经验偏差。`
      : options.prompt.includes('提炼金句')
      ? `> **核心洞见提炼**：\n> “直觉是进化馈赠的省力捷径，也是理性最易搁浅的迷雾浅滩。”`
      : `您在《${options.context.chapterTitle || '当前章节'}》引用的文字：\n\n“${options.context.selectionQuote}”\n\n这是全书认知科学的核心基石。您可以在配置真实 API Key 后展开无限制自由追问。`
    : `您提问的“${options.prompt}”在《${options.context.bookTitle}》的逻辑体系中占据核心地位，阐明了在复杂决策中识别自身认知局限的重要性。`;

  const fullResponse = guideNotice + dynamicContent;
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
  }, 20);

  return () => {
    isAborted = true;
    clearInterval(intervalId);
  };
}
