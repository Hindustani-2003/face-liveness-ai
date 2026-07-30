import * as faceapi from "face-api.js";

export interface BlinkState {
  lastState: "open" | "closed" | null;
  transitions: number;
  baseEAR?: number;
}

/**
 * Calculate Eye Aspect Ratio (EAR) from facial landmarks
 */
export function calculateEAR(eye: any[]): number {
  if (!eye || eye.length < 6) return 1;

  const distance = (p1: any, p2: any) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const A = distance(eye[1], eye[5]);
  const B = distance(eye[2], eye[4]);
  const C = distance(eye[0], eye[3]);

  return (A + B) / (2 * C);
}

/**
 * Detect blink from facial landmarks by tracking sequential frame-by-frame state changes (Open -> Closed -> Open -> Closed -> Open)
 */
export function detectBlink(
  landmarks: any,
  previousState: BlinkState
): BlinkState {
  if (!landmarks || landmarks.length < 48) {
    return previousState;
  }

  // Eye landmarks: left eye (36-41), right eye (42-47)
  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);

  const leftEAR = calculateEAR(leftEye);
  const rightEAR = calculateEAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2;

  // Calibrate baseEAR with the highest open-eye EAR observed
  let baseEAR = previousState.baseEAR;
  if (baseEAR === undefined || avgEAR > baseEAR) {
    baseEAR = avgEAR;
  }

  // Classify current frame state using absolute EAR difference from baseline open state
  const isClosed = (baseEAR - avgEAR) > 0.035;
  const isOpen = (baseEAR - avgEAR) < 0.015;

  let lastState = previousState.lastState || null;
  let transitions = previousState.transitions || 0;

  if (lastState === null) {
    if (isOpen) {
      lastState = "open";
    } else if (isClosed) {
      lastState = "closed";
    }
  } else if (lastState === "open" && isClosed) {
    lastState = "closed";
    transitions++;
  } else if (lastState === "closed" && isOpen) {
    lastState = "open";
    transitions++;
  }

  return {
    lastState,
    transitions,
    baseEAR,
  };
}

/**
 * Extract face descriptor from video frame, canvas, or image element
 */
export async function extractFaceDescriptor(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<Float32Array | null> {
  try {
    const detections = await faceapi
      .detectAllFaces(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors() as any;

    if (detections.length === 0) {
      return null;
    }

    return detections[0].descriptor;
  } catch (error) {
    console.error("Error extracting face descriptor:", error);
    return null;
  }
}

/**
 * Calculate Euclidean distance between two descriptors
 */
export function calculateDescriptorDistance(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number {
  if (descriptor1.length !== descriptor2.length) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Find best matching face from a list of stored descriptors
 */
export function findBestMatch(
  currentDescriptor: Float32Array,
  storedDescriptors: Array<{ descriptor: Float32Array; userId: number }>,
  threshold: number = 0.6
): { userId: number; distance: number } | null {
  let bestMatch: { userId: number; distance: number } | null = null;

  for (const stored of storedDescriptors) {
    const distance = calculateDescriptorDistance(
      currentDescriptor,
      stored.descriptor
    );

    if (distance < threshold) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = {
          userId: stored.userId,
          distance,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Load face-api models from CDN
 */
export async function loadFaceApiModels(): Promise<void> {
  const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
  } catch (error) {
    console.error("Failed to load face-api models:", error);
    throw error;
  }
}

/**
 * Calculate head yaw ratio (left vs right distance)
 */
export function calculateHeadYaw(positions: any[]): number {
  if (!positions || positions.length < 28) return 1.0;
  const leftPoint = positions[2];
  const rightPoint = positions[14];
  const nosePoint = positions[27];

  const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const leftDist = dist(leftPoint, nosePoint);
  const rightDist = dist(rightPoint, nosePoint);

  if (rightDist === 0) return 1.0;
  return leftDist / rightDist;
}

/**
 * Calculate mouth open ratio (vertical lip gap vs horizontal width)
 */
export function calculateMouthRatio(positions: any[]): number {
  if (!positions || positions.length < 67) return 0.0;
  const topLip = positions[62];
  const bottomLip = positions[66];
  const leftCorner = positions[48];
  const rightCorner = positions[54];

  const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const verticalDist = dist(topLip, bottomLip);
  const horizontalDist = dist(leftCorner, rightCorner);

  if (horizontalDist === 0) return 0.0;
  return verticalDist / horizontalDist;
}
