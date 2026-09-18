import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';

interface SplitDividerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const SplitDivider: React.FC<SplitDividerProps> = ({ containerRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { isSidebarVisible, setSplitRatio, calculateClampedSplitRatio } = useAppStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const newRatio = calculateClampedSplitRatio(clientX, rect.width);
      setSplitRatio(newRatio);
    },
    [isDragging, containerRef, calculateClampedSplitRatio, setSplitRatio]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isSidebarVisible) return null;

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`relative z-20 w-1 bg-slate-200 dark:bg-slate-800 hover:bg-brand-500 cursor-col-resize transition-colors select-none flex items-center justify-center ${
        isDragging ? 'bg-brand-600 ring-2 ring-brand-500/20' : ''
      }`}
      title="拖拽调节阅读区与侧边栏比例"
    >
      <div className="h-8 w-1 bg-slate-400 dark:bg-slate-600 rounded-full opacity-60 group-hover:opacity-100" />
    </div>
  );
};
