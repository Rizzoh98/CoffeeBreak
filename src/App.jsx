import React from 'react';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import Onboarding from './components/Onboarding';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Mascot from './components/Mascot';
import ToastContainer from './components/ToastContainer';
import BadgePopup from './components/BadgePopup';
import ProfileDrawer from './components/ProfileDrawer';
import InviteOverlay from './components/InviteOverlay';
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
  const { isAuthenticated, authLoading } = useAuth();

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

  // Show loading spinner while Firebase checks auth
  if (authLoading) {
    return (
      <>
        {bgEffects}
        <div className="auth-loading">
          <div className="auth-loading-spinner" />
          <span className="auth-loading-text">☕</span>
        </div>
      </>
    );
  }

  // Show onboarding if not authenticated or profile not completed
  if (!isAuthenticated || state.onboardingStep < 3) {
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
        <main className="screens-container" id="screens-container">
          <Header />
          <ToastContainer />
          <ActiveScreen />
        </main>

        <Mascot />
        <BottomNav />
      </div>

      <ProfileDrawer />
      <BadgePopup />
      <InviteOverlay />
    </>
  );
}
