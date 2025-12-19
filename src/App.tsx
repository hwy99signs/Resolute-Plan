import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/paktiq/AuthScreen';
import WelcomeScreen from './components/paktiq/WelcomeScreen';
import OnboardingFlow from './components/paktiq/OnboardingFlow';
import CategorySelection from './components/paktiq/CategorySelection';
import PaktNaming from './components/paktiq/PaktNaming';
import MilestoneBuilder from './components/paktiq/MilestoneBuilder';
import ReminderSetup from './components/paktiq/ReminderSetup';
import ReminderSetupLive from './components/paktiq/ReminderSetupLive';
import PaktDashboard from './components/paktiq/PaktDashboard';
import PaktDashboardLive from './components/paktiq/PaktDashboardLive';
import AchievementBoard from './components/paktiq/AchievementBoard';
import AchievementBoardLive from './components/paktiq/AchievementBoardLive';
import InsightsOverview from './components/paktiq/InsightsOverview';
import InsightsOverviewLive from './components/paktiq/InsightsOverviewLive';
import TemplateLibrary from './components/paktiq/TemplateLibrary';
import PremiumFeatures from './components/paktiq/PremiumFeatures';
import SettingsScreen from './components/paktiq/SettingsScreen';
import SettingsScreenLive from './components/paktiq/SettingsScreenLive';
import { useResolves } from './hooks';
import { ResolveService, MilestoneService, ReminderService } from './services';
import type { Screen, PaktData, Resolve, Milestone, Reminder } from './types';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3C2B63] via-[#9163F2] to-[#3C2B63] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-white text-2xl"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
          />
          <p>Loading Resolute Plan pro...</p>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const { resolves, loading: resolvesLoading, createResolve, refetch } = useResolves();
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentResolve, setCurrentResolve] = useState<Partial<PaktData>>({});

  // Check if onboarding is completed
  useEffect(() => {
    if (user && profile) {
      if (!profile.onboarding_completed) {
        setCurrentScreen('onboarding');
      } else {
        setCurrentScreen('dashboard');
      }
    }
  }, [user, profile]);

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const updateResolveData = (data: Partial<PaktData>) => {
    setCurrentResolve({ ...currentResolve, ...data });
  };

  const completeResolve = async () => {
    if (!user || !currentResolve.name || !currentResolve.category) {
      console.error('Missing required data to create Resolve');
      return;
    }

    try {
      // Create the Resolve in the database
      const newResolve = await createResolve({
        user_id: user.id,
        name: currentResolve.name,
        description: currentResolve.description || '',
        target_outcome: currentResolve.targetOutcome || '',
        deadline: currentResolve.deadline || new Date().toISOString(),
        category: currentResolve.category,
      });

      // Create milestones if any
      if (currentResolve.milestones && currentResolve.milestones.length > 0) {
        for (let i = 0; i < currentResolve.milestones.length; i++) {
          const milestone = currentResolve.milestones[i];
          await MilestoneService.createMilestone({
            resolve_id: newResolve.id,
            user_id: user.id,
            name: milestone.name,
            due_date: milestone.dueDate,
            notes: milestone.notes || '',
            importance: milestone.importance || 3,
            completed: false,
            order_index: i,
          });
        }
      }

      // Create reminders if configured
      if (currentResolve.reminders) {
        await ReminderService.createReminder({
          pakt_id: newResolve.id,
          user_id: user.id,
          frequency: currentResolve.reminders.frequency,
          time: currentResolve.reminders.time,
          days: currentResolve.reminders.days || null,
        });
      }

      // Clear current Resolve and navigate to dashboard
      setCurrentResolve({});
      await refetch(); // Refresh Resolves list
      navigate('dashboard');
    } catch (error) {
      console.error('Error creating Resolve:', error);
      alert('Failed to create Resolve. Please try again.');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Show authentication screen if not authenticated
  if (!user) {
    // You can show welcome screen first, then auth screen
    if (currentScreen === 'welcome') {
      return <WelcomeScreen onGetStarted={() => setCurrentScreen('auth')} onExplore={() => setCurrentScreen('auth')} />;
    }
    return <AuthScreen onSuccess={() => setCurrentScreen('dashboard')} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={() => setCurrentScreen('auth')} onExplore={() => setCurrentScreen('auth')} />;
      case 'onboarding':
        return <OnboardingFlow onComplete={() => navigate('categorySelection')} onSkip={() => navigate('dashboard')} />;
      case 'categorySelection':
        return <CategorySelection onSelect={(category) => { updateResolveData({ category }); navigate('paktNaming'); }} />;
      case 'paktNaming':
        return <PaktNaming currentPakt={currentResolve} onUpdate={updateResolveData} onContinue={() => navigate('milestoneBuilder')} onBack={() => navigate('categorySelection')} />;
      case 'milestoneBuilder':
        return <MilestoneBuilder currentPakt={currentResolve} onUpdate={updateResolveData} onContinue={() => navigate('reminderSetup')} onBack={() => navigate('paktNaming')} />;
      case 'reminderSetup':
        return <ReminderSetupLive currentPakt={currentResolve} onUpdate={updateResolveData} onComplete={completeResolve} onBack={() => navigate('milestoneBuilder')} />;
      case 'dashboard':
        return <PaktDashboardLive onNavigate={navigate} isDarkMode={isDarkMode} />;
      case 'achievements':
        return <AchievementBoardLive onBack={() => navigate('dashboard')} isDarkMode={isDarkMode} />;
      case 'insights':
        return <InsightsOverviewLive onBack={() => navigate('dashboard')} isDarkMode={isDarkMode} />;
      case 'templates':
        return <TemplateLibrary onUseTemplate={(template) => { updateResolveData(template); navigate('paktNaming'); }} onBack={() => navigate('dashboard')} />;
      case 'premium':
        return <PremiumFeatures onBack={() => navigate('dashboard')} onUpgrade={() => navigate('dashboard')} />;
      case 'settings':
        return <SettingsScreenLive isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} onBack={() => navigate('dashboard')} />;
      default:
        return <WelcomeScreen onGetStarted={() => navigate('onboarding')} onExplore={() => navigate('templates')} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#1a1625]' : 'bg-[#F4F4F6]'} transition-colors duration-300`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Main App component with AuthProvider wrapper
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
