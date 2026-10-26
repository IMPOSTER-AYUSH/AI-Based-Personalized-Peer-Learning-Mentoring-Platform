import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Info, X, ExternalLink } from 'lucide-react';

export const DevBanner = () => {
  const { devNotice, setDevNotice } = useAuth();
  if (!devNotice) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-amber-50 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-700 p-4 rounded-2xl shadow-xl backdrop-blur-md animate-bounce-subtle">
      <div className="flex items-start space-x-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-200">{devNotice.message}</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            SMTP is running in dev-mode. You can test the token link below:
          </p>
          <a
            href={devNotice.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 underline mt-2"
          >
            <span>Open verification link</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button
          onClick={() => setDevNotice(null)}
          className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default DevBanner;
