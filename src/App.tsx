import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import type { TabType } from './components/BottomNav';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { SettingsPage } from './pages/SettingsPage';
import { 
  isAuthenticated, 
  logout, 
  fetchAllFromGoogleSheets, 
  processPendingSyncQueue 
} from './services/storage';
import type { WorkoutTemplate, WorkoutSessionLog } from './types';

export function App() {
  const [authed, setAuthed] = useState<boolean>(isAuthenticated());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showSettings, setShowSettings] = useState(false);

  // Active workout session state machine
  const [activeWorkoutConfig, setActiveWorkoutConfig] = useState<{
    workoutType: string;
    template?: WorkoutTemplate;
  } | null>(null);

  useEffect(() => {
    if (authed) {
      // Auto fetch latest cloud logs & process any pending offline queue
      fetchAllFromGoogleSheets();
      processPendingSyncQueue();
    }
  }, [authed]);

  const handleLoginSuccess = () => {
    setAuthed(true);
  };

  const handleLogout = () => {
    logout();
    setAuthed(false);
  };

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

  // If unauthenticated, render single password login screen
  if (!authed) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0F1317] text-[#F4F1EA] flex flex-col font-sans selection:bg-[#6B8E78] selection:text-[#0F1317]">
      {/* Header */}
      <Header
        onOpenSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
      />

      {/* Main Page Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-5 pb-20">
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
        ) : activeTab === 'templates' ? (
          <TemplatesPage />
        ) : activeTab === 'exercises' ? (
          <ExercisesPage />
        ) : null}
      </main>

      {/* Bottom Navigation */}
      {!activeWorkoutConfig && !showSettings && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}

export default App;
