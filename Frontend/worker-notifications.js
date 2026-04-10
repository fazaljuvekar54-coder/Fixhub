// ═════════════════════════════════════════════════════════════════
// WORKER NOTIFICATIONS - Simple Push Notification System
// ═════════════════════════════════════════════════════════════════
// This runs in the worker app to listen for new bookings and send notifications
// No backend required - works with free Spark plan

let currentWorkerId = null;
let workerTrades = [];
let notificationListener = null;

/**
 * Initialize notifications when worker logs in
 * Call this after authentication succeeds
 */
async function initWorkerNotifications(workerId, db) {
  currentWorkerId = workerId;

  // Get worker's trades
  const workerDoc = await db.collection("users").doc(workerId).get();
  if (workerDoc.exists) {
    workerTrades = workerDoc.data().trades || [];
  }

  // Listen for new matching bookings
  startNotificationListener(db);

  // Request browser permission for notifications
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/**
 * Listen to bookings collection for new jobs matching worker's trades
 */
function startNotificationListener(db) {
  if (notificationListener) notificationListener(); // Stop previous listener

  notificationListener = db
    .collection("bookings")
    .orderBy("createdAt", "desc")
    .limit(50)
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const booking = change.doc.data();
          
          // Check if job matches worker's trades and is not assigned yet
          if (
            booking.type &&
            workerTrades.includes(booking.type.toLowerCase()) &&
            !booking.workerId &&
            booking.status === "pending"
          ) {
            showNotification(booking, change.doc.id);
          }
        }
      });
    });
}

/**
 * Display push notification to worker
 */
function showNotification(booking, bookingId) {
  // In-app notification badge
  showInAppNotification(booking, bookingId);

  // Browser push notification (if permitted)
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(`New ${booking.type} Job Available!`, {
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%234CAF50'/><text x='50' y='60' font-size='50' fill='white' text-anchor='middle' font-weight='bold'>✓</text></svg>",
      badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%234CAF50'/></svg>",
      body: `${booking.clientName || "Customer"} needs ${booking.type} work - ₹${booking.pay || 500}`,
      tag: `job-${bookingId}`,
      requireInteraction: true,
    });

    // Click notification to open the job details
    notification.onclick = () => {
      window.focus();
      showBookingDetails(booking, bookingId);
      notification.close();
    };
  }

  // Audio alert (subtle)
  playNotificationSound();
}

/**
 * Show in-app notification card
 */
function showInAppNotification(booking, bookingId) {
  const container = document.getElementById("notifications-container") || createNotificationsContainer();

  const card = document.createElement("div");
  card.className = "notification-card";
  card.innerHTML = `
    <div class="notification-header">
      <h3>📍 New ${booking.type} Job</h3>
      <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="notification-body">
      <p><strong>${booking.clientName || "Customer"}</strong> at ${booking.location || "Location pending"}</p>
      <p>${booking.desc || "No description provided"}</p>
    </div>
    <div class="notification-footer">
      <span class="pay-badge">💰 ₹${booking.pay || 500}</span>
      <button class="accept-btn" onclick="acceptJob('${bookingId}')">Accept Job</button>
    </div>
  `;

  container.appendChild(card);

  // Auto-remove after 10 seconds if not interacted
  setTimeout(() => {
    if (card.parentElement) card.remove();
  }, 10000);
}

/**
 * Create notifications container if it doesn't exist
 */
function createNotificationsContainer() {
  const container = document.createElement("div");
  container.id = "notifications-container";
  container.className = "notifications-container";
  document.body.appendChild(container);

  const style = document.createElement("style");
  style.textContent = `
    .notifications-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .notification-card {
      background: white;
      border-left: 4px solid #4CAF50;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .notification-header h3 {
      margin: 0;
      color: #333;
      font-size: 16px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #999;
    }

    .notification-body {
      margin: 8px 0;
      color: #666;
      font-size: 14px;
    }

    .notification-body p {
      margin: 4px 0;
    }

    .notification-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
    }

    .pay-badge {
      background: #E8F5E9;
      color: #2E7D32;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 14px;
    }

    .accept-btn {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      flex: 1;
    }

    .accept-btn:hover {
      background: #45a049;
    }
  `;

  document.head.appendChild(style);
  return container;
}

/**
 * Play subtle notification sound
 */
function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800; // Hz
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

/**
 * Worker accepts a job
 */
async function acceptJob(bookingId, db = null) {
  if (!db) {
    console.error("Database not provided");
    return;
  }

  try {
    await db.collection("bookings").doc(bookingId).update({
      workerId: currentWorkerId,
      acceptedAt: new Date(),
      status: "accepted"
    });

    alert("✅ Job accepted! Details have been sent to the customer.");
    showInAppNotification({ body: "Job accepted successfully!" }, bookingId);
  } catch (error) {
    console.error("Error accepting job:", error);
    alert("❌ Failed to accept job. Please try again.");
  }
}

/**
 * Show booking details modal (update this to match your existing modal code)
 */
function showBookingDetails(booking, bookingId) {
  // This should trigger the same modal as your existing app
  // Update to match your implementation
  console.log("Show booking:", bookingId, booking);
}

/**
 * Stop listening to notifications (call on logout)
 */
function stopNotificationListener() {
  if (notificationListener) {
    notificationListener();
    notificationListener = null;
  }
  currentWorkerId = null;
  workerTrades = [];
}

// Export for use in worker app
window.WorkerNotifications = {
  init: initWorkerNotifications,
  stop: stopNotificationListener,
  accept: acceptJob
};
