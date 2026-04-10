// ═════════════════════════════════════════════════════════════════
// EMAIL SERVICE - Google Apps Script Integration
// ═════════════════════════════════════════════════════════════════
// This service replaces EmailJS with a custom Google Apps Script 
// proxy for 100% free, reliable email delivery via Gmail.

let EMAIL_CONFIG = null;

/**
 * Initialize Email Service
 */
async function initEmailService() {
  try {
    console.log("EmailService version: 1.1.0 - Fetching email-config.json");
    const response = await fetch('/email-config.json');
    if (!response.ok) throw new Error("Failed to load environment config.");
    EMAIL_CONFIG = await response.json();
    console.log("✅ Email Service initialized (Google Apps Script mode)");
  } catch(e) {
    console.error("Email initialization failed:", e);
  }
}

/**
 * Generic Fetch Sender
 */
async function sendViaGAS(to, subject, htmlBody) {
  if (!EMAIL_CONFIG || !EMAIL_CONFIG.GAS_URL) {
    console.error("Email Service not initialized or GAS_URL missing.");
    return;
  }
  try {
    // Mode 'no-cors' is required for Google Apps Script POST requests from browser
    await fetch(EMAIL_CONFIG.GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ to, subject, htmlBody })
    });
    console.log(`✉️ Email request sent to ${to}`);
  } catch (error) {
    console.error("Fetch error while sending email:", error);
  }
}

/**
 * Email Service Interface
 */
window.EmailService = {
  init: initEmailService,

  sendBookingConfirmation: async (customer, booking, bookingId) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #16a34a;">Booking Confirmed!</h2>
        <p>Hello ${customer.name || 'Customer'},</p>
        <p>Your request for <strong>${booking.type}</strong> has been successfully submitted.</p>
        <div style="background: #f7f7f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Scheduled:</strong> ${booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'As soon as possible'}</p>
        </div>
        <p>We are currently matching you with a professional nearby. You'll receive another update once a pro is assigned.</p>
        <p>You can track your booking status directly in the <a href="https://fixhub-2411.web.app/customer.html">FixHub Dashboard</a>.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #a1a1aa;">Sent via FixHub Automated Service</p>
      </div>
    `;
    await sendViaGAS(customer.email, `Booking Confirmed: ${bookingId}`, htmlBody);
  },

  sendWorkerConfirmation: async (worker, booking, bookingId) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #2563eb;">New Job Opportunity</h2>
        <p>Hello ${worker.name},</p>
        <p>A new <strong>${booking.type}</strong> request is available in your area.</p>
        <div style="background: #f7f7f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Job Type:</strong> ${booking.type}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Client:</strong> ${booking.clientName}</p>
        </div>
        <p>Log in to your dashboard to view details and accept this job.</p>
        <a href="https://fixhub-2411.web.app/worker.html" style="display:inline-block; background:#2563eb; color:white; padding:10px 20px; text-decoration:none; border-radius:6px;">View Dashboard</a>
      </div>
    `;
    await sendViaGAS(worker.email, `New Service Request: ${booking.type}`, htmlBody);
  },

  sendCustomerAcceptance: async (customer, booking, worker, bookingId) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #2563eb;">Pro Assigned!</h2>
        <p>Good news! <strong>${worker.name}</strong> has accepted your request.</p>
        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Professional:</strong> ${worker.name}</p>
          <p><strong>Service:</strong> ${booking.type}</p>
        </div>
        <p>You can now chat with them directly in the app to confirm arrival details.</p>
        <a href="https://fixhub-2411.web.app/customer.html" style="display:inline-block; background:#2563eb; color:white; padding:10px 20px; text-decoration:none; border-radius:6px;">Open Chat</a>
      </div>
    `;
    await sendViaGAS(customer.email, `Pro Assigned to your ${booking.type} request`, htmlBody);
  },

  sendCustomerCompletion: async (customer, booking, bookingId, workerName, amount) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #16a34a;">Service Completed & Paid!</h2>
        <p>Hello ${customer.name || 'Customer'},</p>
        <p>Your ${booking.type} service with ${workerName} has been marked as **Paid and Completed**.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7;">
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Amount Paid:</strong> ₹${amount}</p>
          <p><strong>Payment Method:</strong> Cash (Collected by Professional)</p>
        </div>
        <p>Please rate your experience to help us improve.</p>
        <a href="https://fixhub-2411.web.app/customer.html" style="display:inline-block; background:#16a34a; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:600;">Rate Service</a>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #a1a1aa;">Sent via FixHub Automated Service</p>
      </div>
    `;
    await sendViaGAS(customer.email, `Service Paid & Completed: ${booking.type}`, htmlBody);
  },

  sendWorkerCompletion: async (worker, booking, bookingId, amount, earning) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #16a34a;">Payment Confirmed!</h2>
        <p>Hello ${worker.name},</p>
        <p>You have successfully marked the ${booking.type} job (ID: ${bookingId}) as **Paid and Completed**.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7;">
          <p><strong>Total Amount:</strong> ₹${amount}</p>
          <p style="color: #166534; font-weight: 600;"><strong>Your Earning (85%):</strong> ₹${earning}</p>
          <p style="color: #991b1b; font-size: 0.8rem;">Platform Fee (15%): ₹${Math.round(amount * 0.15)}</p>
        </div>
        <p>The payment has been logged in the system records.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #a1a1aa;">Sent via FixHub Automated Service</p>
      </div>
    `;
    await sendViaGAS(worker.email, `Job Completed & Logged: ${bookingId}`, htmlBody);
  },

  sendReviewNotification: async (worker, customerName, rating, comment, bookingId) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #ca8a04;">New Review!</h2>
        <p>You just received a <strong>${rating}-star</strong> review from ${customerName}.</p>
        <p style="font-style: italic; color: #52525b;">"${comment}"</p>
        <p>Keep up the great work!</p>
      </div>
    `;
    await sendViaGAS(worker.email, `New Review Received: ${rating} Stars`, htmlBody);
  },

  sendComplaintReceived: async (customer, complaint) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #dc2626;">Complaint Received</h2>
        <p>We have received your complaint regarding <strong>${complaint.category}</strong>.</p>
        <p>Our team is looking into it and will get back to you shortly.</p>
        <p><strong>Complaint ID:</strong> ${complaint.id}</p>
      </div>
    `;
    await sendViaGAS(customer.email, `Complaint Registered: ${complaint.category}`, htmlBody);
  },

  sendComplaintResolved: async (customer, complaint, adminNote) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #16a34a;">Complaint Resolved</h2>
        <p>Your complaint regarding ${complaint.category} has been marked as resolved.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Resolution:</strong> ${adminNote || 'Resolved by administration.'}</p>
        </div>
        <p>Thank you for your patience.</p>
      </div>
    `;
    await sendViaGAS(customer.email, `Issue Resolved: ${complaint.category}`, htmlBody);
  },

  sendWorkerAcceptance: async (worker, booking, bookingId) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #16a34a;">Job Confirmed!</h2>
        <p>Hello ${worker.name},</p>
        <p>You have successfully accepted the <strong>${booking.type}</strong> job.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Customer:</strong> ${booking.clientName}</p>
          <p><strong>Location:</strong> ${booking.location}</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
        </div>
        <p>You can now start a chat with the customer to coordinate your arrival.</p>
        <a href="https://fixhub-2411.web.app/worker.html" style="display:inline-block; background:#16a34a; color:white; padding:10px 20px; text-decoration:none; border-radius:6px;">Go to Job List</a>
      </div>
    `;
    await sendViaGAS(worker.email, `Job Confirmed: ${booking.type}`, htmlBody);
  },

  sendBookingCancellation: async (recipient, booking, bookingId, cancelledBy = 'Customer') => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #dc2626;">Booking Cancelled</h2>
        <p>Hello ${recipient.name},</p>
        <p>The ${booking.type} booking (ID: ${bookingId}) has been successfully cancelled.</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Service:</strong> ${booking.type}</p>
          <p><strong>Status:</strong> Cancelled by ${cancelledBy}</p>
        </div>
        <p>If you have any questions, please contact our support team.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 11px; color: #a1a1aa;">Sent via FixHub Automated Service</p>
      </div>
    `;
    await sendViaGAS(recipient.email, `Booking Cancelled: ${bookingId}`, htmlBody);
  },

  sendRescheduleRequest: async (recipient, booking, proposedTime, requesterName) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #d97706;">Reschedule Requested</h2>
        <p>Hello ${recipient.name},</p>
        <p><strong>${requesterName}</strong> has proposed a new time for the ${booking.type} service.</p>
        <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fef3c7;">
          <p><strong>Original Time:</strong> ${booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'Asap'}</p>
          <p style="color: #92400e; font-weight: 600;"><strong>New Proposed Time:</strong> ${new Date(proposedTime).toLocaleString()}</p>
        </div>
        <p>Please log in to your dashboard to confirm or decline this request.</p>
        <a href="https://fixhub-2411.web.app/dashboard" style="display:inline-block; background:#d97706; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight: 600;">View Request</a>
      </div>
    `;
    await sendViaGAS(recipient.email, `Reschedule Request: ${booking.type}`, htmlBody);
  },

  sendRescheduleConfirmation: async (recipient, booking, finalTime) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #16a34a;">Reschedule Confirmed</h2>
        <p>Hello ${recipient.name},</p>
        <p>The reschedule request for your ${booking.type} service has been **Accepted**.</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>New Confirmed Time:</strong> ${new Date(finalTime).toLocaleString()}</p>
        </div>
        <p>See you then!</p>
      </div>
    `;
    await sendViaGAS(recipient.email, `Reschedule Confirmed: ${booking.type}`, htmlBody);
  },

  sendRescheduleDeclined: async (recipient, booking) => {
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
        <h2 style="color: #dc2626;">Reschedule Declined</h2>
        <p>Hello ${recipient.name},</p>
        <p>The reschedule request for the ${booking.type} service was **Declined**.</p>
        <p>The service remains scheduled for the original time: <strong>${booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'Asap'}</strong>.</p>
        <p>Please contact the other party via chat if you need to discuss further.</p>
      </div>
    `;
    await sendViaGAS(recipient.email, `Reschedule Declined: ${booking.type}`, htmlBody);
  }
};
