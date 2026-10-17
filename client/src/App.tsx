import React, { useState, useEffect, useRef } from 'react';
import { LandingPage } from './screens/LandingPage';
import { Workspace } from './screens/Workspace';
import { LampLoginPage } from './screens/LampLoginPage';
import { ThreeDLoadingScreen } from './components/ThreeDLoadingScreen';
import { StudyAlarmModal } from './components/StudyAlarmModal';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { api } from './services/api';
import { StudyAlarmItem } from './types';
import { LanguageCode } from './utils/i18n';

type AppView = 'loading' | 'login' | 'home' | 'workspace';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('loading');
  
  // Theme state persisted in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('unera_theme') as 'light' | 'dark') || 'dark';
  });

  // Language state persisted in localStorage
  const [lang, setLang] = useState<LanguageCode>(() => {
    return (localStorage.getItem('unera_lang') as LanguageCode) || 'en';
  });

  // Study Alarm scheduler modal
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);

  // Active ringing alarm (prompts ringing modal & sound)
  const [ringingAlarm, setRingingAlarm] = useState<StudyAlarmItem | null>(null);

  // Background alarms list for ticker
  const alarmsRef = useRef<StudyAlarmItem[]>([]);

  useEffect(() => {
    localStorage.setItem('unera_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('unera_lang', lang);
  }, [lang]);

  // Periodic alarm daemon check (every 1 second)
  useEffect(() => {
    const fetchAlarms = async () => {
      try {
        const list = await api.getAlarms();
        alarmsRef.current = list || [];
      } catch (err) {
        // silent fail on network blip
      }
    };

    fetchAlarms();
    const pollInterval = setInterval(fetchAlarms, 8000);

    const tickInterval = setInterval(() => {
      if (ringingAlarm) return;
      const now = Date.now();
      const dueAlarm = alarmsRef.current.find(
        a => (a.status === 'active' || a.status === 'scheduled') && new Date(a.scheduledTime).getTime() <= now
      );

      if (dueAlarm) {
        setRingingAlarm(dueAlarm);
        alarmsRef.current = alarmsRef.current.map(a =>
          a.id === dueAlarm.id ? { ...a, status: 'ringing' } : a
        );
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(tickInterval);
    };
  }, [ringingAlarm]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLanguageChange = (newLang: LanguageCode) => {
    setLang(newLang);
  };

  const handleStartStudyFromAlarm = async (conceptName: string, title: string) => {
    if (ringingAlarm) {
      try {
        await api.updateAlarm(ringingAlarm.id, { status: 'completed' });
      } catch (err) {
        console.error(err);
      }
    }
    setRingingAlarm(null);
    setCurrentView('workspace');
  };

  const handleSnoozeAlarm = async (alarmId: number) => {
    try {
      await api.updateAlarm(alarmId, { snoozeMinutes: 5 });
      const updated = await api.getAlarms();
      alarmsRef.current = updated || [];
    } catch (err) {
      console.error(err);
    }
    setRingingAlarm(null);
  };

  const handleDismissAlarm = async (alarmId: number) => {
    try {
      await api.updateAlarm(alarmId, { status: 'dismissed' });
      const updated = await api.getAlarms();
      alarmsRef.current = updated || [];
    } catch (err) {
      console.error(err);
    }
    setRingingAlarm(null);
  };

  const handleAlarmsUpdated = async () => {
    try {
      const updated = await api.getAlarms();
      alarmsRef.current = updated || [];
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0B0E17] text-[#F8FAFC]' : 'bg-[#FAF7F2] text-[#1E1B18]'
    }`}>
      {/* 1. 3D Perspective Loading Core View */}
      {currentView === 'loading' && (
        <ThreeDLoadingScreen
          onComplete={() => setCurrentView('login')}
          onProceedToLogin={() => setCurrentView('login')}
          autoTransition={true}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* 2. Interactive Lamp Login Screen */}
      {currentView === 'login' && (
        <LampLoginPage
          theme={theme}
          onToggleTheme={toggleTheme}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          onLoginSuccess={(role) => setCurrentView('workspace')}
          onOpen3DView={() => setCurrentView('loading')}
          onOpenWorkspaceDirect={() => setCurrentView('workspace')}
          initialLightOn={false}
        />
      )}

      {/* 3. Main Landing Page */}
      {currentView === 'home' && (
        <LandingPage
          theme={theme}
          onToggleTheme={toggleTheme}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          onOpenWorkspace={() => setCurrentView('workspace')}
          onUploadNotes={() => setCurrentView('workspace')}
          onOpen3DView={() => setCurrentView('loading')}
          onOpenAlarms={() => setIsAlarmModalOpen(true)}
          onOpenLogin={() => setCurrentView('login')}
        />
      )}

      {/* 4. Study Workspace */}
      {currentView === 'workspace' && (
        <Workspace
          theme={theme}
          onToggleTheme={toggleTheme}
          lang={lang}
          onLanguageChange={handleLanguageChange}
          onBackToHome={() => setCurrentView('home')}
          onOpen3DView={() => setCurrentView('loading')}
          onOpenAlarms={() => setIsAlarmModalOpen(true)}
          onOpenLogin={() => setCurrentView('login')}
        />
      )}

      {/* Study Alarm Scheduler Modal */}
      <StudyAlarmModal
        isOpen={isAlarmModalOpen}
        onClose={() => setIsAlarmModalOpen(false)}
        theme={theme}
        onAlarmSet={handleAlarmsUpdated}
      />

      {/* Alarm Ringing Alert Notification Modal */}
      <AlarmRingingModal
        alarm={ringingAlarm}
        onStartStudy={handleStartStudyFromAlarm}
        onSnooze={handleSnoozeAlarm}
        onDismiss={handleDismissAlarm}
      />
    </div>
  );
}

export default App;
