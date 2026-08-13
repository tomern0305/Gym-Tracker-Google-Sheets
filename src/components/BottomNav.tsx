import React from 'react';
import { Calendar, TrendingUp, Layers, Dumbbell } from 'lucide-react';

export type TabType = 'dashboard' | 'analytics' | 'templates' | 'exercises';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'analytics' as TabType, label: 'Progress', icon: TrendingUp },
    { id: 'templates' as TabType, label: 'Routines', icon: Layers },
    { id: 'exercises' as TabType, label: 'Library', icon: Dumbbell },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 w-full chrome border-t border-line pb-[var(--safe-bottom)]">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-md items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-all touch-shrink ${
                isActive ? 'text-accent' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <div className={`flex h-8 w-11 items-center justify-center rounded-full transition-all ${
                isActive ? 'bg-accent/15 border border-accent/30 scale-105' : 'bg-transparent'
              }`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-accent' : 'text-ink-soft'}`} />
              </div>
              <span className={`text-[10px] font-medium tracking-tight ${isActive ? 'text-ink' : 'text-ink-soft'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
