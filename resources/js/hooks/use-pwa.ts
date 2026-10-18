import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function usePwa() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [isIOS, setIsIOS] = useState<boolean>(false);
    const [canInstall, setCanInstall] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if currently running in standalone (installed) mode
        const checkStandalone = (): boolean => {
            const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isNavigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
            const isAndroidApp = document.referrer.includes('android-app://');
            const storedInstalled = localStorage.getItem('dkpp_pwa_installed') === 'true';

            return isDisplayStandalone || isNavigatorStandalone || isAndroidApp || storedInstalled;
        };

        if (checkStandalone()) {
            setIsInstalled(true);
            return;
        }

        // Check if device is iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            // iOS does not trigger beforeinstallprompt, but can be added to homescreen
            setCanInstall(true);
        }

        // Listen for beforeinstallprompt on Chromium / Android browsers
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);
            setCanInstall(true);
        };

        // Listen for when app is successfully installed
        const handleAppInstalled = () => {
            localStorage.setItem('dkpp_pwa_installed', 'true');
            setIsInstalled(true);
            setCanInstall(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Also listen for display-mode change in real time
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                localStorage.setItem('dkpp_pwa_installed', 'true');
                setIsInstalled(true);
                setCanInstall(false);
            }
        };

        try {
            mediaQuery.addEventListener('change', handleDisplayModeChange);
        } catch {
            // Older browser fallback
            mediaQuery.addListener(handleDisplayModeChange);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            try {
                mediaQuery.removeEventListener('change', handleDisplayModeChange);
            } catch {
                mediaQuery.removeListener(handleDisplayModeChange);
            }
        };
    }, []);

    const promptInstall = async (): Promise<boolean> => {
        if (!deferredPrompt) {
            return false;
        }

        try {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                localStorage.setItem('dkpp_pwa_installed', 'true');
                setIsInstalled(true);
                setCanInstall(false);
                setDeferredPrompt(null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('[PWA] Error calling install prompt:', error);
            return false;
        }
    };

    return {
        deferredPrompt,
        isInstalled,
        isIOS,
        canInstall,
        promptInstall,
    };
}

