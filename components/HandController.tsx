import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { TreeState } from '../types';
import { detectGesture, GestureType } from '../utils/gesture';

interface HandControllerProps {
  setTreeState: (s: TreeState) => void;
  treeState: TreeState;
  onCameraRotate: (deltaX: number) => void;
  onGrabPhoto: () => void;
}

export const HandController: React.FC<HandControllerProps> = ({ setTreeState, treeState, onCameraRotate, onGrabPhoto }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastGesture = useRef<GestureType>("NONE");
  const gestureHistory = useRef<GestureType[]>([]);
  const lastHandX = useRef<number | null>(null);
  
  // Throttling refs
  const lastPredictionTime = useRef<number>(0);
  const PREDICTION_INTERVAL = 100; // Run every 100ms (10fps) instead of 60fps
  
  useEffect(() => {
    // Access the video element created in index.html
    const videoElement = document.getElementById('webcam') as HTMLVideoElement;
    videoRef.current = videoElement;

    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240, frameRate: { ideal: 30 } } // Low res is faster
        });
        
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.onloadeddata = () => {
              videoElement.play();
              predictWebcam();
          };
        }
      } catch (err) {
        console.error("Camera setup failed:", err);
      }
    };

    const predictWebcam = () => {
      if (!videoElement || !handLandmarker) return;

      const now = performance.now();
      // THROTTLE: Only run detection if enough time has passed
      if (now - lastPredictionTime.current > PREDICTION_INTERVAL) {
        lastPredictionTime.current = now;
        
        // Detect
        const results = handLandmarker.detectForVideo(videoElement, now);

        if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const gesture = detectGesture(landmarks);
            const handX = landmarks[9].x; // Middle knuckle

            // Smooth gesture history
            gestureHistory.current.push(gesture);
            if (gestureHistory.current.length > 3) gestureHistory.current.shift();
            
            // Majority vote for stability
            const stableGesture = getDominantGesture(gestureHistory.current);
            
            handleInteraction(stableGesture, handX);
        } else {
            lastHandX.current = null;
        }
      }
      
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const getDominantGesture = (history: GestureType[]): GestureType => {
      if (history.length === 0) return "NONE";
      const counts: Record<string, number> = {};
      history.forEach(g => counts[g] = (counts[g] || 0) + 1);
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as GestureType;
    };

    const handleInteraction = (gesture: GestureType, currentHandX: number) => {
        
        // 1. ROTATION (Only in Exploding state + Hand Moving)
        if (treeState === TreeState.EXPLODING && lastHandX.current !== null) {
            const delta = currentHandX - lastHandX.current;
            // Sensitivity threshold
            if (Math.abs(delta) > 0.02) {
                // Determine direction based on hand movement
                // Note: Webcam is mirrored usually, so we might need to invert logic based on feel
                onCameraRotate(delta * -3.0); 
            }
        }
        lastHandX.current = currentHandX;

        // 2. STATE SWITCHING
        // Only trigger action on gesture entry (Edge detection) to avoid spamming
        const isNewGesture = gesture !== lastGesture.current;
        lastGesture.current = gesture;

        // FIST -> ASSEMBLE (Tree Shape)
        if (gesture === "FIST") {
            if (isNewGesture) setTreeState(TreeState.TREE_SHAPE);
        }
        // OPEN PALM -> SCATTER (Exploding)
        else if (gesture === "OPEN_PALM") {
            if (isNewGesture && treeState !== TreeState.EXPLODING) {
                setTreeState(TreeState.EXPLODING);
            }
        }
        // PINCH -> PHOTO VIEW & GRAB NEXT
        else if (gesture === "PINCH") {
            if (isNewGesture) {
                if (treeState !== TreeState.PHOTO_VIEW) {
                    // First Pinch: Enter mode
                    setTreeState(TreeState.PHOTO_VIEW);
                } else {
                    // Subsequent Pinches: Cycle photos (Grab another one)
                    onGrabPhoto();
                }
            }
        }
    };

    setupMediaPipe();

    return () => {
      if (videoElement && videoElement.srcObject) {
         const tracks = (videoElement.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
    };
  }, [setTreeState, treeState, onCameraRotate, onGrabPhoto]);

  return null;
};