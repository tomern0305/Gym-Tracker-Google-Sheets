import React from 'react';
import { Calendar, Layers, Dumbbell } from 'lucide-react';

export type TabType = 'dashboard' | 'templates' | 'exercises';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'templates' as TabType, label: 'Routines', icon: Layers },
    { id: 'exercises' as TabType, label: 'Library', icon: Dumbbell },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 w-full glass-card border-t border-[#F4F1EA]/10 pb-safe pt-2 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-all touch-shrink ${
                isActive ? 'text-[#6B8E78]' : 'text-[#9E9B93] hover:text-[#F4F1EA]'
              }`}
            >
              <div className={`flex h-9 w-12 items-center justify-center rounded-full transition-all ${
                isActive ? 'bg-[#6B8E78]/15 border border-[#6B8E78]/30 scale-105' : 'bg-transparent'
              }`}>
                <Icon className={`h-5 w-5 ${isActive ? 'text-[#6B8E78]' : 'text-[#9E9B93]'}`} />
              </div>
              <span className={`text-[11px] font-medium tracking-tight ${isActive ? 'text-[#F4F1EA]' : 'text-[#9E9B93]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
