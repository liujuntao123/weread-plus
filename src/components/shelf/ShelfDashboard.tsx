import React from 'react';
import { BookOpen, Clock, Flame, BookCheck, ArrowRight, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ShelfDashboard: React.FC = () => {
  const { userSession, handleRouteChange } = useAppStore();

  const mockBooks = [
    {
      bookId: '3300045871',
      title: '思考，快与慢',
      author: '丹尼尔·卡尼曼',
      progress: 42,
      coverUrl: 'https://wfpub.weread.qq.com/cover/871/3300045871/t6_3300045871.jpg',
      chapter: '第1章 一张愤怒的脸与一道乘法题',
    },
    {
      bookId: '84291024',
      title: '原则：生活与工作',
      author: '瑞·达利欧',
      progress: 78,
      coverUrl: 'https://wfpub.weread.qq.com/cover/24/84291024/t6_84291024.jpg',
      chapter: '第二部分 工作原则：打造良好的文化',
    },
    {
      bookId: '29817263',
      title: '纳瓦尔宝典',
      author: '埃里克·乔根森',
      progress: 95,
      coverUrl: 'https://wfpub.weread.qq.com/cover/63/29817263/t6_29817263.jpg',
      chapter: '第四部分 哲学：如何获得幸福与内心平静',
    },
  ];

  const handleOpenBook = (book: typeof mockBooks[0]) => {
    handleRouteChange({
      url: `https://weread.qq.com/web/reader/${book.bookId}`,
      isReaderPage: true,
      bookId: book.bookId,
      chapterTitle: book.chapter,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="h-full w-full p-4 overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
      {/* 用户概览与阅读时长 */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-brand-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/30 border border-brand-100 dark:border-slate-700/60">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold shadow-sm">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              {userSession.nickname || '微信读书用户'}
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              VID: {userSession.userVid || '583802764'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-200/40 dark:border-slate-700/40 text-center">
          <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/50">
            <div className="flex items-center justify-center text-xs text-brand-600 dark:text-brand-400 mb-0.5">
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>累计时长</span>
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              48 <span className="text-[10px] font-normal text-slate-400">小时</span>
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/50">
            <div className="flex items-center justify-center text-xs text-amber-600 dark:text-amber-400 mb-0.5">
              <Flame className="w-3.5 h-3.5 mr-1" />
              <span>连续阅读</span>
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              14 <span className="text-[10px] font-normal text-slate-400">天</span>
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/50">
            <div className="flex items-center justify-center text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">
              <BookCheck className="w-3.5 h-3.5 mr-1" />
              <span>读完书目</span>
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
              26 <span className="text-[10px] font-normal text-slate-400">本</span>
            </span>
          </div>
        </div>
      </div>

      {/* 书架在读书籍 */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
            书架在读书籍 (点击联动进入)
          </h4>
          <span className="text-[11px] text-slate-400">共 3 本在读</span>
        </div>

        <div className="space-y-2">
          {mockBooks.map((book) => (
            <div
              key={book.bookId}
              onClick={() => handleOpenBook(book)}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-brand-50/60 dark:hover:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {book.title}
                </h5>
                <span className="text-[11px] font-mono font-medium text-brand-600 dark:text-brand-400">
                  {book.progress}%
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-2 truncate">
                {book.author} · {book.chapter}
              </p>

              {/* 进度条 */}
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${book.progress}%` }}
                />
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                <span>点击打开阅读工作台</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-1 group-hover:text-brand-500 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
