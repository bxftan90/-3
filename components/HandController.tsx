import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { TreeState } from '../types';

interface HandControllerProps {
  setTreeState: (s: TreeState) => void;
  treeState: TreeState;
  onCameraRotate: (deltaX: number) => void;
  onGrabPhoto: () => void;
}

export const HandController: React.FC<HandControllerProps> = ({ setTreeState, treeState, onCameraRotate, onGrabPhoto }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  
  // Refs to avoid dependency loops in animation loop
  const stateRef = useRef({ treeState, setTreeState, onCameraRotate, onGrabPhoto });
  useEffect(() => {
    stateRef.current = { treeState, setTreeState, onCameraRotate, onGrabPhoto };
  }, [treeState, setTreeState, onCameraRotate, onGrabPhoto]);

  const lastHandX = useRef<number | null>(null);
  const lastPredictionTime = useRef<number>(0);
  const animationFrameId = useRef<number>(0);
  
  // Cooldown to prevent state flickering
  const cooldownRef = useRef<number>(0);

  useEffect(() => {
    const videoElement = document.getElementById('webcam') as HTMLVideoElement;
    videoRef.current = videoElement;

    const setupMediaPipe = async () => {
      try {
        if (handLandmarkerRef.current) return;

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
      
      // Limit prediction to ~15 FPS to save performance
      if (videoElement && handLandmarkerRef.current && (now - lastPredictionTime.current > 60)) {
        lastPredictionTime.current = now;
        
        const results = handLandmarkerRef.current.detectForVideo(videoElement, now);

        if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const { treeState, setTreeState, onCameraRotate } = stateRef.current;
            
            // --- RAW GESTURE DETECTION ---
            
            // 1. PINCH / OK DETECTION
            // Distance between Thumb Tip (4) and Index Tip (8)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const pinchDist = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) +
                Math.pow(thumbTip.y - indexTip.y, 2) +
                Math.pow(thumbTip.z - indexTip.z, 2)
            );

            // 2. FIST DETECTION
            // Check if fingertips are below knuckles (simple heuristic for fist held up)
            // Note: Coordinates are normalized. 0,0 is top-left.
            const isFist = (
                landmarks[8].y > landmarks[6].y && // Index tip below pip
                landmarks[12].y > landmarks[10].y && // Middle tip below pip
                landmarks[16].y > landmarks[14].y    // Ring tip below pip
            );

            // 3. OPEN HAND (Not fist, fingers spread)
            const isOpen = !isFist && pinchDist > 0.1;

            // --- INTERACTION LOGIC ---

            if (now > cooldownRef.current) {
                if (pinchDist < 0.05) {
                    // *** OK GESTURE DETECTED ***
                    console.log("OK GESTURE -> PHOTO VIEW");
                    if (treeState !== TreeState.PHOTO_VIEW) {
                        setTreeState(TreeState.PHOTO_VIEW);
                        cooldownRef.current = now + 1000; // 1s cooldown
                    }
                } else if (isFist) {
                    // *** FIST -> ASSEMBLE ***
                    if (treeState !== TreeState.TREE_SHAPE) {
                        setTreeState(TreeState.TREE_SHAPE);
                        cooldownRef.current = now + 1000;
                    }
                } else if (isOpen) {
                    // *** OPEN -> EXPLODE ***
                    if (treeState === TreeState.TREE_SHAPE) {
                        setTreeState(TreeState.EXPLODING);
                        cooldownRef.current = now + 1000;
                    }
                }
            }

            // --- ROTATION CONTROL ---
            // Only rotate if hand is moving horizontally
            const handX = landmarks[9].x;
            if (lastHandX.current !== null) {
                const delta = handX - lastHandX.current;
                if (Math.abs(delta) > 0.01) { // Threshold
                    onCameraRotate(delta * -3.0); // Sensitive rotation
                }
            }
            lastHandX.current = handX;
            
        } else {
            lastHandX.current = null;
        }
      }
      
      animationFrameId.current = requestAnimationFrame(predictWebcam);
    };

    setupMediaPipe();

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return null;
};