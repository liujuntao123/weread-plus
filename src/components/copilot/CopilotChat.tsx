import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Quote, 
  X, 
  Bot, 
  User, 
  Lightbulb, 
  HelpCircle, 
  Flame
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  selectionQuote?: string;
  timestamp: number;
}

export const CopilotChat: React.FC = () => {
  const { activeSelection, setActiveSelection, readerContext } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `您好！我是您的阅读领读助手。当前我们正伴读《${readerContext.bookTitle || '思考，快与慢'}》。\n\n您可以随时在左侧正文划选文字，点击浮动条上的 **「AI 提问」**，我会结合全书脉络与上下文为您深度解析！`,
      timestamp: Date.now(),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 当外部划词注入发生时，自动聚焦输入框
  useEffect(() => {
    if (activeSelection) {
      inputRef.current?.focus();
    }
  }, [activeSelection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (overridePrompt?: string) => {
    const textToSend = (overridePrompt || inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      selectionQuote: activeSelection ? activeSelection.selectedText : undefined,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    // 模拟或调用 AI 回复
    setTimeout(() => {
      let aiReply = '';
      if (activeSelection) {
        if (textToSend.includes('通俗解释')) {
          aiReply = `**【通俗解释】**\n\n这段话的核心在于揭示人类大脑的“自动驾驶模式”。\n\n- **核心意图**：我们绝大多数日常反应（例如躲避障碍物、感知对方生气）都是由无意识且耗能极低的系统驱动的。\n- **生活类比**：就像熟练司机开车时不用思考如何踩油门，大脑已经将这类运算固化成了本能反射。`;
        } else if (textToSend.includes('批判思考')) {
          aiReply = `**【批判思考与认知陷阱】**\n\n- **前置假设**：作者假设了双系统的二元切分模型，但在现代神经科学看来，大脑各脑区的交互是高维网络，而非泾渭分明的两个独立单元。\n- **反例与边界**：高度训练的国际象棋大师能够在直觉（系统1）中完成原本需要极度耗力（系统2）的深度推演，说明快慢思考的边界是可塑的。`;
        } else if (textToSend.includes('提炼金句')) {
          aiReply = `> **金句提炼**：\n> “直觉是进化的省力赠礼，但也是理性最容易溺亡的浅滩。”`;
        } else {
          aiReply = `针对您引用的这段话（出自《${activeSelection.chapterTitle}》）：\n\n“${activeSelection.selectedText}”\n\n它构成了本书行为决策理论的基础。如果您有进一步想探究的细节，欢迎继续追问！`;
        }
      } else {
        aiReply = `您提问的“${textToSend}”在《${readerContext.bookTitle || '本书'}》中有着深入探讨。结合全书脉络，作者旨在引导读者建立反思性直觉。`;
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: aiReply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsGenerating(false);
      // 清除选区引用状态
      setActiveSelection(null);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden relative">
      {/* 消息历史滚动区 */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 pb-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-2.5 text-xs ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-2xs'
              }`}
            >
              {/* 如果该消息携带选区引用 */}
              {msg.selectionQuote && (
                <div className="mb-2 p-2 rounded bg-black/10 dark:bg-white/10 text-[11px] border-l-2 border-amber-300 text-amber-100 dark:text-amber-200">
                  <div className="flex items-center text-[10px] font-semibold mb-0.5 opacity-80">
                    <Quote className="w-2.5 h-2.5 mr-1" />
                    引用划选文本
                  </div>
                  “{msg.selectionQuote}”
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-500" />
            <span>AI 伴读思考中...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入控制区 */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
        {/* 选区上下文引用卡片 */}
        {activeSelection && (
          <div className="p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 relative animate-in fade-in slide-in-from-bottom-2 duration-150">
            <button
              onClick={() => setActiveSelection(null)}
              className="absolute right-1.5 top-1.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/60"
              title="取消引用此段文字"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 mb-1">
              <Quote className="w-3 h-3" />
              <span>当前划选引用 ({activeSelection.chapterTitle})</span>
            </div>

            <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed italic pr-4">
              “{activeSelection.selectedText}”
            </p>

            {/* 快速提示词胶囊按钮 */}
            <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-blue-200/50 dark:border-blue-900/40">
              <button
                onClick={() => handleSend('请通俗解释这段话的核心逻辑与专业概念')}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 transition-colors flex items-center"
              >
                <Lightbulb className="w-2.5 h-2.5 mr-1 text-amber-500" />
                通俗解释
              </button>
              <button
                onClick={() => handleSend('请指出这段观点的潜在逻辑漏洞、反例与批判思考')}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 transition-colors flex items-center"
              >
                <HelpCircle className="w-2.5 h-2.5 mr-1 text-indigo-500" />
                批判思考
              </button>
              <button
                onClick={() => handleSend('请将这段话重构提炼为一句深刻的知识金句')}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 hover:bg-blue-50 transition-colors flex items-center"
              >
                <Flame className="w-2.5 h-2.5 mr-1 text-rose-500" />
                提炼金句
              </button>
            </div>
          </div>
        )}

        {/* 输入框与发送按钮 */}
        <div className="flex items-end space-x-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1.5 focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500">
          <textarea
            ref={inputRef}
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeSelection
                ? '针对选中文本提问，或点击上方胶囊按钮...'
                : '向 AI 领读助手提问关于本书的问题 (Enter 发送)...'
            }
            className="flex-1 resize-none bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none p-1"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isGenerating}
            className={`p-1.5 rounded-md text-white transition-all ${
              inputPrompt.trim() && !isGenerating
                ? 'bg-brand-500 hover:bg-brand-600 cursor-pointer shadow-xs'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-400'
            }`}
            title="发送提问"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
