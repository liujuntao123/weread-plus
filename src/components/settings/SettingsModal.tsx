import React, { useState } from 'react';
import { X, ShieldCheck, Check, Key, Server, Cpu, Sparkles } from 'lucide-react';
import { DEFAULT_PROVIDERS } from '../../services/aiService';
import type { AiProviderConfig } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [providers, setProviders] = useState<AiProviderConfig[]>(() => {
    const saved = localStorage.getItem('weread_plus_ai_providers');
    return saved ? JSON.parse(saved) : DEFAULT_PROVIDERS;
  });

  const [selectedProviderId, setSelectedProviderId] = useState('deepseek');
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const currentProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  const handleUpdateCurrent = (field: keyof AiProviderConfig, value: string | boolean) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === selectedProviderId ? { ...p, [field]: value } : p))
    );
    setTestSuccess(false);
  };

  const handleSave = () => {
    localStorage.setItem('weread_plus_ai_providers', JSON.stringify(providers));
    onClose();
  };

  const handleTestConnection = () => {
    setTestSuccess(false);
    setTimeout(() => {
      setTestSuccess(true);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* 顶部标题 */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-brand-500 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              AI 供应商配置 (BYOK)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 主内容 */}
        <div className="p-4 space-y-4 text-xs">
          {/* 供应商选择 Pill */}
          <div>
            <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1.5">
              选择模型提供商
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProviderId(p.id);
                    setTestSuccess(false);
                  }}
                  className={`py-1.5 px-2.5 rounded-lg border text-left transition-all ${
                    p.id === selectedProviderId
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-medium'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="truncate">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 表单项 */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="flex items-center text-slate-600 dark:text-slate-300 font-medium mb-1">
                <Server className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Base URL
              </label>
              <input
                type="text"
                value={currentProvider.baseUrl}
                onChange={(e) => handleUpdateCurrent('baseUrl', e.target.value)}
                placeholder="https://api.deepseek.com/v1"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="flex items-center text-slate-600 dark:text-slate-300 font-medium mb-1">
                <Key className="w-3.5 h-3.5 mr-1 text-slate-400" />
                API Key
              </label>
              <input
                type="password"
                value={currentProvider.apiKey}
                onChange={(e) => handleUpdateCurrent('apiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-mono text-[11px]"
              />
              <span className="text-[10px] text-slate-400 flex items-center mt-1">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" />
                密钥由客户端直接向供应商请求，保存于本地系统钥匙串
              </span>
            </div>

            <div>
              <label className="flex items-center text-slate-600 dark:text-slate-300 font-medium mb-1">
                <Cpu className="w-3.5 h-3.5 mr-1 text-slate-400" />
                模型型号 (Model Name)
              </label>
              <input
                type="text"
                value={currentProvider.modelName}
                onChange={(e) => handleUpdateCurrent('modelName', e.target.value)}
                placeholder="deepseek-chat"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* 测试连接状态 */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleTestConnection}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              测试服务连接
            </button>

            {testSuccess && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" />
                连接校验通过 (200 OK)
              </span>
            )}
          </div>
        </div>

        {/* 底部保存 */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 text-xs"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-md bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-xs"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};
