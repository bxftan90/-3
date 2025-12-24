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
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  
  // -- STABILITY FIX: Use Refs to track state inside the loop without triggering re-renders --
  const stateRef = useRef({ treeState, setTreeState, onCameraRotate, onGrabPhoto });
  
  // Update refs whenever props change
  useEffect(() => {
    stateRef.current = { treeState, setTreeState, onCameraRotate, onGrabPhoto };
  }, [treeState, setTreeState, onCameraRotate, onGrabPhoto]);

  // Throttling and logic refs
  const lastGesture = useRef<GestureType>("NONE");
  const gestureHistory = useRef<GestureType[]>([]);
  const lastHandX = useRef<number | null>(null);
  const lastPredictionTime = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  const PREDICTION_INTERVAL = 100; // 10 FPS for detection is sufficient

  useEffect(() => {
    const videoElement = document.getElementById('webcam') as HTMLVideoElement;
    videoRef.current = videoElement;

    const setupMediaPipe = async () => {
      try {
        if (handLandmarkerRef.current) return; // Already initialized

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240, frameRate: { ideal: 30 } } 
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
      const now = performance.now();
      
      if (videoElement && handLandmarkerRef.current && (now - lastPredictionTime.current > PREDICTION_INTERVAL)) {
        lastPredictionTime.current = now;
        
        const results = handLandmarkerRef.current.detectForVideo(videoElement, now);

        if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const gesture = detectGesture(landmarks);
            const handX = landmarks[9].x; 

            // Smooth gesture history (Stabilizer)
            gestureHistory.current.push(gesture);
            if (gestureHistory.current.length > 4) gestureHistory.current.shift();
            
            const stableGesture = getDominantGesture(gestureHistory.current);
            
            handleInteraction(stableGesture, handX);
        } else {
            lastHandX.current = null;
        }
      }
      
      animationFrameId.current = requestAnimationFrame(predictWebcam);
    };

    const getDominantGesture = (history: GestureType[]): GestureType => {
      if (history.length === 0) return "NONE";
      const counts: Record<string, number> = {};
      history.forEach(g => counts[g] = (counts[g] || 0) + 1);
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b) as GestureType;
    };

    const handleInteraction = (gesture: GestureType, currentHandX: number) => {
        const { treeState, setTreeState, onCameraRotate, onGrabPhoto } = stateRef.current;
        
        // 1. ROTATION (Only in Exploding state + Hand Moving)
        if (treeState === TreeState.EXPLODING && lastHandX.current !== null) {
            const delta = currentHandX - lastHandX.current;
            if (Math.abs(delta) > 0.015) {
                onCameraRotate(delta * -2.5); 
            }
        }
        lastHandX.current = currentHandX;

        // 2. STATE SWITCHING
        const isNewGesture = gesture !== lastGesture.current;
        lastGesture.current = gesture;

        if (gesture === "FIST") {
            // Fist -> Assemble
            if (isNewGesture && treeState !== TreeState.TREE_SHAPE) setTreeState(TreeState.TREE_SHAPE);
        }
        else if (gesture === "OPEN_PALM") {
            // Open -> Scatter
            if (isNewGesture && treeState !== TreeState.EXPLODING) setTreeState(TreeState.EXPLODING);
        }
        else if (gesture === "PINCH") {
            // OK/Pinch -> Photo View
            if (isNewGesture) {
                if (treeState !== TreeState.PHOTO_VIEW) {
                    setTreeState(TreeState.PHOTO_VIEW);
                } else {
                    onGrabPhoto(); // Cycle photos if already in view
                }
            }
        }
    };

    setupMediaPipe();

    // Cleanup function
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      // We do NOT stop the stream or close the landmarker here to avoid 
      // black screen flickering if the component briefly unmounts/remounts,
      // though in this app structure HandController is likely stable.
      // Ideally, we close resources if the app is truly closing.
      // For now, let's keep the stream alive for smoother UX.
    };
  }, []); // Empty dependency array = Initialize ONCE.

  return null;
};