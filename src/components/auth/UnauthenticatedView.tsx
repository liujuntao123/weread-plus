import React from 'react';
import { KeyRound, QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const UnauthenticatedView: React.FC = () => {
  const { setUserSession } = useAppStore();

  return (
    <div className="h-full w-full p-6 flex flex-col justify-between bg-white dark:bg-slate-900 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            初始就绪态 (Ready)
          </span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">
            欢迎使用 weread-plus
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            请在左侧视窗中完成微信读书扫码登录。侧边栏将自动感知并切换至您的个人书架与阅读工作台。
          </p>
        </div>

        {/* 步骤提示卡片 */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <QrCode className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                1. 微信扫码登录
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                左侧视窗已加载官方登录页面，使用微信 App 扫码即可，安全且无需泄露账号密码。
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <KeyRound className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                2. AI Provider 随心配置
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                支持 DeepSeek、OpenAI、Claude、Ollama 等主流大模型，支持本地系统钥匙串安全加密。
              </p>
            </div>
          </div>
        </div>

        {/* 演示用模拟登录快捷键 */}
        <div className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
          <span className="text-[11px] text-slate-400 block mb-2 font-medium">开发调试辅助</span>
          <button
            onClick={() => setUserSession({ isLoggedIn: true, userVid: '583802764', nickname: '演示用户' })}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>模拟扫码成功登录</span>
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
          端到端安全隔离
        </span>
        <span>v2.0.0</span>
      </div>
    </div>
  );
};
