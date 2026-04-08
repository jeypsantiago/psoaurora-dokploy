import React from 'react';

type UploadProgressInlineProps = {
  message?: string;
  progressPercent?: number;
  tone?: 'neutral' | 'success' | 'error';
  showProgress?: boolean;
  visible?: boolean;
  className?: string;
};

const toneClassName = {
  neutral: 'text-blue-700 dark:text-blue-200',
  success: 'text-emerald-700 dark:text-emerald-300',
  error: 'text-red-700 dark:text-red-300',
};

export const UploadProgressInline: React.FC<UploadProgressInlineProps> = ({
  message = '',
  progressPercent = 0,
  tone = 'neutral',
  showProgress = false,
  visible = true,
  className = '',
}) => {
  if (!visible || !message.trim()) return null;

  return (
    <div className={`${toneClassName[tone]} ${className}`.trim()}>
      <p className="text-[11px] font-bold leading-relaxed">{message}</p>
      {showProgress && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 transition-[width] duration-200 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
};
