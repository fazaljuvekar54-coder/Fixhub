// ═════════════════════════════════════════════════════════════════
// LOCATION SYSTEM - Distance-based Job Matching
// ═════════════════════════════════════════════════════════════════

/**
 * Get user's current location using Geolocation API
 */
async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

/**
 * Calculate distance between two points using Haversine formula (in km)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

/**
 * Get geocard (place name) from coordinates using reverse geocoding (simple mock)
 * In production, use Google Maps API or similar
 */
async function getLocationName(latitude, longitude) {
  // Simple mock - in production use Google Maps API
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/**
 * Parse location string to get coordinates (simple mock)
 */
async function getLocationCoordinates(locationString, db) {
  // For now, return mock coordinates
  // In production, use Google Maps Geocoding API or store coordinates with jobs
  
  // This would typically call an API or look up stored coordinates
  return {
    latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
    longitude: 77.2090 + (Math.random() - 0.5) * 0.1
  };
}

/**
 * Save user's location to Firestore
 */
async function saveUserLocation(userId, latitude, longitude, db) {
  try {
    await db.collection("users").doc(userId).update({
      location: {
        latitude: latitude,
        longitude: longitude,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }
    });
    console.log("Location saved");
  } catch (error) {
    console.error("Error saving location:", error);
  }
}

/**
 * Get jobs near user (within specified radius in km)
 */
async function getJobsNearby(userLat, userLon, radiusKm, jobs) {
  return jobs
    .map((job) => {
      // Calculate distance to job
      const distance = calculateDistance(
        userLat,
        userLon,
        job.jobLat || 0,
        job.jobLon || 0
      );

      return {
        ...job,
        distance: distance,
        withinRadius: distance <= radiusKm
      };
    })
    .filter((job) => job.withinRadius)
    .sort((a, b) => a.distance - b.distance);
}

// Export for use in apps
window.LocationSystem = {
  getUserLocation: getUserLocation,
  calculateDistance: calculateDistance,
  saveLocation: saveUserLocation,
  getJobsNearby: getJobsNearby,
  getLocationName: getLocationName,
  getLocationCoordinates: getLocationCoordinates
};
