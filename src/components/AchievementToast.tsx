import React from 'react';

export interface ToastMessage {
  id: string;
  type: 'achievement' | 'token';
  title: string;
  description: string;
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const AchievementToast: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-3 right-3 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 sm:max-w-sm pointer-events-none"
      style={{ top: 'max(14px, env(safe-area-inset-top))' }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className="pointer-events-auto cursor-pointer border border-[#E87545]/40 bg-[#17242D] text-[#F2F0E9] p-3.5 rounded-lg shadow-xl flex items-start gap-3 transition-all transform hover:scale-[1.02]"
          style={{
            boxShadow: '0 8px 24px rgba(16, 24, 32, 0.8), 0 0 12px rgba(232, 117, 69, 0.25)',
          }}
        >
          <div className="w-9 h-9 rounded-md bg-[#24343D] flex items-center justify-center text-[#E87545] font-bold text-lg shrink-0 border border-[#E87545]/30">
            {toast.type === 'achievement' ? '🏆' : '✦'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-wider uppercase text-[#E87545] font-semibold">
                {toast.type === 'achievement' ? 'Achievement Unlocked' : 'Token Collected'}
              </span>
              <span className="text-xs text-[#A4B0B5] hover:text-[#F2F0E9]">✕</span>
            </div>
            <h4 className="text-sm font-bold text-[#F2F0E9] mt-0.5 truncate">{toast.title}</h4>
            <p className="text-xs text-[#A4B0B5] mt-0.5 line-clamp-2 leading-relaxed">{toast.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
