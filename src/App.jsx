import React from 'react';
import { useApp } from './context/AppContext';
import Onboarding from './components/Onboarding';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Mascot from './components/Mascot';
import ToastContainer from './components/ToastContainer';
import BadgePopup from './components/BadgePopup';
import ProfileDrawer from './components/ProfileDrawer';
import CuriositaScreen from './components/screens/CuriositaScreen';
import GiochiScreen from './components/screens/GiochiScreen';
import BreakScreen from './components/screens/BreakScreen';
import MoodScreen from './components/screens/MoodScreen';
import BadgeScreen from './components/screens/BadgeScreen';

const SCREENS = {
  curiosita: CuriositaScreen,
  giochi: GiochiScreen,
  break: BreakScreen,
  mood: MoodScreen,
  badge: BadgeScreen
};

export default function App() {
  const { state } = useApp();

  // Background effects (always rendered)
  const bgEffects = (
    <>
      <div className="bg-effects" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-orb bg-orb-4" />
        <div className="bg-grid" />
      </div>
      <canvas id="particles-canvas" aria-hidden="true" />
    </>
  );

  // Show onboarding if not completed (step < 3)
  if (state.onboardingStep < 3) {
    return (
      <>
        {bgEffects}
        <Onboarding />
      </>
    );
  }

  // Main app
  const ActiveScreen = SCREENS[state.currentScreen] || BreakScreen;

  return (
    <>
      {bgEffects}
      <div className="app" id="app">
        <Header />
        <ToastContainer />

        <main className="screens-container" id="screens-container">
          <ActiveScreen />
        </main>

        <Mascot />
        <BottomNav />
      </div>

      <ProfileDrawer />
      <BadgePopup />
    </>
  );
}
