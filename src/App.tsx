import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import type { TabType } from './components/BottomNav';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { SettingsPage } from './pages/SettingsPage';
import {
  fetchAllFromGoogleSheets,
  processPendingSyncQueue
} from './services/storage';
import { startUpdateWatcher } from './services/appUpdate';
import type { WorkoutTemplate } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showSettings, setShowSettings] = useState(false);

  // Active workout session state machine
  const [activeWorkoutConfig, setActiveWorkoutConfig] = useState<{
    workoutType: string;
    template?: WorkoutTemplate;
  } | null>(null);

  useEffect(() => {
    // Auto fetch cloud logs & process any pending offline queue on app launch
    fetchAllFromGoogleSheets();
    processPendingSyncQueue();
    return startUpdateWatcher();
  }, []);

  const handleStartWorkout = (workoutType: string, template?: WorkoutTemplate) => {
    setActiveWorkoutConfig({ workoutType, template });
  };

  const handleFinishWorkout = () => {
    setActiveWorkoutConfig(null);
    setActiveTab('dashboard');
  };

  const handleCancelWorkout = () => {
    if (confirm('Cancel active workout session? Unsaved sets will be discarded.')) {
      setActiveWorkoutConfig(null);
    }
  };

  const showBottomNav = !activeWorkoutConfig && !showSettings;

  return (
    <div className="min-h-[100dvh] bg-page text-ink flex flex-col font-sans selection:bg-accent selection:text-on-accent">
      {/* Header */}
      <Header
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Page Area — padded clear of the fixed header and nav bars */}
      <main
        className={`flex-1 w-full max-w-md mx-auto px-4 pt-[calc(var(--header-total)+1.25rem)] ${
          showBottomNav
            ? 'pb-[calc(var(--nav-total)+1.5rem)]'
            : 'pb-[calc(var(--safe-bottom)+1.5rem)]'
        }`}
      >
        {showSettings ? (
          <SettingsPage onClose={() => setShowSettings(false)} />
        ) : activeWorkoutConfig ? (
          <ActiveWorkoutPage
            workoutType={activeWorkoutConfig.workoutType}
            initialTemplate={activeWorkoutConfig.template}
            onFinish={handleFinishWorkout}
            onCancel={handleCancelWorkout}
          />
        ) : activeTab === 'dashboard' ? (
          <DashboardPage
            onStartWorkout={handleStartWorkout}
            onViewLog={() => {}}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsPage />
        ) : activeTab === 'templates' ? (
          <TemplatesPage />
        ) : activeTab === 'exercises' ? (
          <ExercisesPage />
        ) : null}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}

export default App;
