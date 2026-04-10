/**
 * Cloud Functions for Firebase (Requires Blaze Plan for external APIs)
 * We are currently using client-side EmailJS for free emails.
 */
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {setGlobalOptions} = require("firebase-functions");
const logger = require("firebase-functions/logger");

setGlobalOptions({maxInstances: 10});

// exports.onBookingCreated = ... (Paid plan only)

