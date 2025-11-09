export interface PreciseLocationOptions {
  desiredAccuracyMeters?: number; // resolve early if accuracy is within this threshold
  maximumWaitMs?: number; // total time budget to wait for improved fixes
  timeoutMs?: number; // per-reading timeout (passed to geolocation options)
  highAccuracy?: boolean; // pass enableHighAccuracy to the API
  minSamples?: number; // try to collect at least this many samples before resolving
  bestClusterFactor?: number; // cluster window to average, relative to best accuracy (e.g., 1.5x)
}

export interface PreciseLocationResult {
  lat: number;
  lng: number;
  accuracy: number; // meters (radius of 68% confidence)
  raw: GeolocationPosition;
}

/**
 * Continuously samples location via watchPosition and returns the best
 * (lowest accuracy) reading within the allotted time or sooner if the
 * desired accuracy is met. Falls back to the best available sample on timeout.
 */
export function getPreciseLocation(options: PreciseLocationOptions = {}): Promise<PreciseLocationResult> {
  const desiredAccuracy = options.desiredAccuracyMeters ?? 20; // meters
  const maximumWaitMs = options.maximumWaitMs ?? 20000; // total time budget
  const timeoutMs = options.timeoutMs ?? 15000; // per fix timeout
  const enableHighAccuracy = options.highAccuracy ?? true;
  const minSamples = options.minSamples ?? 3;
  const bestClusterFactor = options.bestClusterFactor ?? 1.5;

  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    let bestPosition: GeolocationPosition | null = null;
    const samples: GeolocationPosition[] = [];
    let lastError: GeolocationPositionError | null = null;

    const clearAll = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearTimeout(stopTimer);
    };

    const finishWith = (pos: GeolocationPosition) => {
      clearAll();
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        raw: pos
      });
    };

    const onSuccess = (pos: GeolocationPosition) => {
      // Track the best (lowest accuracy) sample
      if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
        bestPosition = pos;
      }
      samples.push(pos);
      // Resolve early if the accuracy threshold is met
      if (pos.coords.accuracy <= desiredAccuracy && samples.length >= minSamples) {
        finishWith(pos);
      }
    };

    const onError = (err: GeolocationPositionError) => {
      lastError = err;
      // If permission denied, fail immediately
      if (err.code === err.PERMISSION_DENIED) {
        clearAll();
        reject(err);
      }
      // For POSITION_UNAVAILABLE or TIMEOUT, keep waiting until maximumWaitMs
    };

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy,
      maximumAge: 0,
      timeout: timeoutMs
    });

    const stopTimer = setTimeout(() => {
      // Use an averaged position of the best cluster of samples if possible
      if (samples.length > 0) {
        // Identify best accuracy
        const bestAcc = bestPosition ? bestPosition.coords.accuracy : Math.min(...samples.map(s => s.coords.accuracy));
        const threshold = bestAcc * bestClusterFactor;
        const cluster = samples.filter(s => s.coords.accuracy <= threshold);
        if (cluster.length > 1) {
          // Weighted average by 1/accuracy^2 (approximate)
          let weightedLat = 0;
          let weightedLng = 0;
          let weightSum = 0;
          for (const s of cluster) {
            const acc = Math.max(1, s.coords.accuracy);
            const w = 1 / (acc * acc);
            weightedLat += s.coords.latitude * w;
            weightedLng += s.coords.longitude * w;
            weightSum += w;
          }
          const lat = weightedLat / weightSum;
          const lng = weightedLng / weightSum;
          const representative = bestPosition ?? cluster[0];
          clearAll();
          resolve({
            lat,
            lng,
            accuracy: representative.coords.accuracy,
            raw: representative
          });
          return;
        }
        // Fallback to best single sample
        finishWith(bestPosition ?? samples[0]);
      } else {
        clearAll();
        reject(lastError ?? new Error('Timed out while attempting to get precise location'));
      }
    }, maximumWaitMs);
  });
}

// Simple wrapper matching the requested API shape
export async function getHighAccuracyLocation(
  desiredAccuracy: number = 20,
  maxWaitMs: number = 20000,
  perFixTimeoutMs: number = 15000
): Promise<{ lat: number; lng: number; accuracy: number }> {
  const precise = await getPreciseLocation({
    desiredAccuracyMeters: desiredAccuracy,
    maximumWaitMs: maxWaitMs,
    timeoutMs: perFixTimeoutMs,
    highAccuracy: true,
    minSamples: 3
  });
  return { lat: precise.lat, lng: precise.lng, accuracy: precise.accuracy };
}


