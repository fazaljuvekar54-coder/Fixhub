// ═════════════════════════════════════════════════════════════════
// CUSTOMER NOTIFICATIONS - Simple Real-time Notification System
// ═════════════════════════════════════════════════════════════════
// Notify customers when workers accept their jobs

let currentCustomerId = null;
let bookingsListener = null;

/**
 * Initialize customer notifications when customer logs in
 * Call this after authentication succeeds
 */
async function initCustomerNotifications(customerId, db) {
  currentCustomerId = customerId;

  // Listen for changes to customer's bookings
  startCustomerNotificationListener(db);

  // Request browser permission for notifications
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

/**
 * Listen to customer's bookings for status updates
 */
function startCustomerNotificationListener(db) {
  if (bookingsListener) bookingsListener(); // Stop previous listener

  bookingsListener = db
    .collection("bookings")
    .where("clientId", "==", currentCustomerId)
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // Check for status changes
        if (change.type === "modified") {
          const booking = change.doc.data();
          const docId = change.doc.id;

          // If worker just accepted the job
          if (booking.status === "accepted" && booking.workerId) {
            showCustomerNotification(booking, docId);
          }
          // If job was completed
          else if (booking.status === "completed") {
            showCompletionNotification(booking, docId);
          }
          // If job was cancelled
          else if (booking.status === "cancelled") {
            showCancellationNotification(booking, docId);
          }
        }
      });
    });
}

/**
 * Display notification when worker accepts job
 */
function showCustomerNotification(booking, bookingId) {
  // In-app notification badge
  showCustomerInAppNotification(booking, bookingId);

  // Browser push notification (if permitted)
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification("✅ Job Accepted!", {
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%234CAF50'/><text x='50' y='60' font-size='50' fill='white' text-anchor='middle' font-weight='bold'>✓</text></svg>",
      badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%234CAF50'/></svg>",
      body: `A worker has accepted your ${booking.type} job!`,
      tag: `job-${bookingId}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      showBookingModal(booking, bookingId);
      notification.close();
    };
  }

  // Audio alert
  playNotificationSound();
}

/**
 * Display notification when job completed
 */
function showCompletionNotification(booking, bookingId) {
  showCustomerInAppNotification(
    {type: booking.type, clientName: "Job Complete", desc: "Your job has been marked as complete!"},
    bookingId,
    "completed"
  );

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🎉 Job Completed!", {
      body: `Your ${booking.type} job is done!`,
      tag: `job-${bookingId}`
    });
  }
}

/**
 * Display notification when job cancelled
 */
function showCancellationNotification(booking, bookingId) {
  showCustomerInAppNotification(
    {type: booking.type, clientName: "Job Cancelled", desc: "Your job has been cancelled."},
    bookingId,
    "cancelled"
  );

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("⚠️ Job Cancelled", {
      body: `Your ${booking.type} job has been cancelled.`,
      tag: `job-${bookingId}`
    });
  }
}

/**
 * Show in-app notification card for customer
 */
function showCustomerInAppNotification(booking, bookingId, type = "accepted") {
  const container = document.getElementById("notifications-container") || createCustomerNotificationsContainer();

  const colorMap = {
    accepted: "#4CAF50",
    completed: "#2196F3",
    cancelled: "#FF9800"
  };

  const titleMap = {
    accepted: "✅ Job Accepted",
    completed: "🎉 Job Completed",
    cancelled: "⚠️ Job Cancelled"
  };

  const card = document.createElement("div");
  card.className = "notification-card";
  card.style.borderColor = colorMap[type];
  card.innerHTML = `
    <div class="notification-header">
      <h3>${titleMap[type]}</h3>
      <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="notification-body">
      <p><strong>${booking.type}</strong> - ${booking.clientName || booking.desc}</p>
      ${booking.desc && booking.clientName !== "Job Complete" ? `<p>${booking.desc}</p>` : ""}
    </div>
    <div class="notification-footer">
      <button class="view-btn" onclick="showBookingModal({type:'${booking.type}', clientName:'${booking.clientName}', desc:'${booking.desc}', location:'${booking.location}', pay:${booking.pay}}, '${bookingId}')">View Details</button>
    </div>
  `;

  container.appendChild(card);

  // Auto-remove after 8 seconds if not interacted
  setTimeout(() => {
    if (card.parentElement) card.remove();
  }, 8000);
}

/**
 * Create notifications container if it doesn't exist
 */
function createCustomerNotificationsContainer() {
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
      gap: 8px;
      margin-top: 12px;
    }

    .view-btn {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      flex: 1;
      font-size: 14px;
    }

    .view-btn:hover {
      background: #45a049;
    }
  `;

  document.head.appendChild(style);
  return container;
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

/**
 * Stop listening to notifications (call on logout)
 */
function stopCustomerNotificationListener() {
  if (bookingsListener) {
    bookingsListener();
    bookingsListener = null;
  }
  currentCustomerId = null;
}

// Export for use in customer app
window.CustomerNotifications = {
  init: initCustomerNotifications,
  stop: stopCustomerNotificationListener
};
