/**
 * Global Error Handling & Network Monitor
 * Injects a 'Disconnected' UI and catches unhandled Javascript errors.
 */

(function () {
  // Create UI overlay for disconnection
  const errorOverlay = document.createElement("div");
  errorOverlay.id = "global-network-error";
  errorOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0;
    background: #ef4444; color: white;
    text-align: center; padding: 12px;
    font-weight: 600; font-family: 'Outfit', sans-serif;
    transform: translateY(-100%); transition: transform 0.3s ease;
    z-index: 10000; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  `;
  errorOverlay.innerHTML = "⚠️ Offline Mode: Some features like Chat and Real-time updates are paused until connection is restored.";
  document.body.appendChild(errorOverlay);

  // Monitor Firebase Connection State
  function initFirebaseMonitor() {
    if (typeof firebase !== 'undefined' && firebase.database) {
      const connectedRef = firebase.database().ref('.info/connected');
      connectedRef.on('value', (snap) => {
        if (snap.val() === true) {
          console.log("Firebase Global Connection: ONLINE 🟢");
          errorOverlay.style.transform = "translateY(-100%)";
        } else {
          console.log("Firebase Global Connection: OFFLINE 🔴");
          errorOverlay.style.transform = "translateY(0%)";
        }
      });
    } else {
      setTimeout(initFirebaseMonitor, 1000); // Retry if firebase isn't loaded yet
    }
  }

  // Start monitoring after short delay
  setTimeout(initFirebaseMonitor, 1500);

  // Global Frontend Error Boundary
  window.addEventListener('error', (event) => {
    console.error("🔥 Global Error Caught:", event.error || event.message);
    if (window.showToast) {
      // Don't spam toasts for non-critical errors (e.g. extension scripts)
      if (event.filename && event.filename.includes(window.location.hostname)) {
         window.showToast("Oops! An unexpected error occurred. Please refresh the page.", "error");
      }
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error("🔥 Unhandled Promise Rejection Caught:", event.reason);
  });
})();
