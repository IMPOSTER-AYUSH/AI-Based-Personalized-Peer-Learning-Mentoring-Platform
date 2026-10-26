import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Award,
  Globe,
} from 'lucide-react';

export const BottomNav = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const tabs = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Matches', path: '/matches', icon: Users },
    { label: 'Chat', path: '/chat', icon: MessageSquare },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Progress', path: '/progress', icon: Award },
    { label: 'Community', path: '/community', icon: Globe },
  ];

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-4 lg:hidden pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-around w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-pill shadow-pill dark:shadow-pill-dark px-3 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-all ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold bg-brand-50/80 dark:bg-brand-950/60'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
export default BottomNav;
