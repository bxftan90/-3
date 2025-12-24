import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type GestureType = "NONE" | "FIST" | "OPEN_PALM" | "PINCH";

/**
 * Calculates Euclidean distance between two 3D points
 */
const distance = (a: NormalizedLandmark, b: NormalizedLandmark) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
};

/**
 * Simple heuristic gesture recognizer
 */
export const detectGesture = (landmarks: NormalizedLandmark[]): GestureType => {
  if (!landmarks || landmarks.length < 21) return "NONE";

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];

  // 1. PINCH (Thumb tip close to Index tip)
  const pinchDist = distance(thumbTip, indexTip);
  if (pinchDist < 0.05) {
    return "PINCH";
  }

  // 2. FIST (Fingertips close to wrist/palm base)
  // Check if fingertips are lower (y) or closer to wrist than knuckles (simplified)
  // A robust check: distance from tip to wrist < distance from knuckle to wrist
  const tips = [indexTip, middleTip, ringTip, pinkyTip];
  const knuckles = [landmarks[5], landmarks[9], landmarks[13], landmarks[17]];
  
  let foldedCount = 0;
  for(let i=0; i<4; i++) {
    if (distance(tips[i], wrist) < distance(knuckles[i], wrist)) {
      foldedCount++;
    }
  }

  if (foldedCount >= 3) {
    return "FIST";
  }

  // 3. OPEN PALM (Fingers extended)
  // If not fist and not pinch, and fingers are spread
  let extendedCount = 0;
   for(let i=0; i<4; i++) {
    if (distance(tips[i], wrist) > distance(knuckles[i], wrist) * 1.5) {
      extendedCount++;
    }
  }
  
  if (extendedCount >= 3) {
    return "OPEN_PALM";
  }

  return "NONE";
};