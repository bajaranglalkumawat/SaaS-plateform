'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/** Native shell polish when app runs inside Capacitor Android WebView. */
export default function CapacitorMobileInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#020617' });
      } catch {
        /* plugin optional during web-only runs */
      }

      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }

      try {
        const { App } = await import('@capacitor/app');
        App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return null;
}
