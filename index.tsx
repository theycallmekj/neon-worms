import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Initialize Capacitor plugins for Android
const initApp = async () => {
  if (Capacitor.isNativePlatform()) {
    // Hide the splash screen
    await SplashScreen.hide();

    // Hide status bar for fullscreen gaming
    try {
      await StatusBar.hide();
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f172a' });
    } catch (e) {
      // Status bar plugin might not be available
      console.log('Status bar control not available');
    }
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode is removed intentionally to prevent double-initialization of the game loop in dev mode
  // which can cause erratic behavior with canvas animation frames.
  <>
    <App />
  </>
);

// Initialize after render
initApp();