/**
 * Service Worker Registration for Suburbmates PWA
 * Provides offline caching and PWA functionality
 */

// Check if service worker is supported
const isSupported = () => "serviceWorker" in navigator;

// Register the service worker
export const registerSW = async (): Promise<void> => {
  if (!isSupported()) {
    console.log("Service Worker not supported in this browser");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/",
      }
    );

    console.log("Service Worker registered successfully:", registration);

    // Handle service worker updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New content is available, prompt user to refresh
            if (confirm("New version available! Reload to update?")) {
              window.location.reload();
            }
          }
        });
      }
    });
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
};

// Unregister service worker (for development/debugging)
export const unregisterSW = async (): Promise<void> => {
  if (!isSupported()) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log("Service Worker unregistered");
  } catch (error) {
    console.error("Service Worker unregistration failed:", error);
  }
};

// Check if app is running in standalone mode (PWA)
export const isPWA = (): boolean => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as any).standalone === true
  );
};

// Get installation prompt event
let deferredPrompt: any = null;

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
});

// Show install prompt
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) return false;

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === "accepted";
  } catch (error) {
    console.error("Install prompt failed:", error);
    return false;
  }
};

// Check if install prompt is available
export const canInstall = (): boolean => {
  return !!deferredPrompt && !isPWA();
};
