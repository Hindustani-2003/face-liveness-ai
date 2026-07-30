import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Camera, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import * as faceapi from "face-api.js";
import {
  loadFaceApiModels,
  extractFaceDescriptor,
  detectBlink,
  calculateDescriptorDistance,
  calculateHeadYaw,
  calculateMouthRatio,
  type BlinkState,
} from "@/lib/faceDetection";

type LoginStep = "idle" | "scanning" | "detecting" | "verifying";

interface DetectionResult {
  userId: number;
  confidence: number;
}

export default function Login() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<LoginStep>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [invalidUserMessage, setInvalidUserMessage] = useState("");
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [targetUser, setTargetUser] = useState<{ id: number; name: string; descriptor: Float32Array | null } | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<"blink" | "turn_left" | "turn_right" | "open_mouth">("blink");
  const secondChallengeRef = useRef<"turn_left" | "turn_right" | "open_mouth">("turn_left");
  const currentChallengeRef = useRef<"blink" | "turn_left" | "turn_right" | "open_mouth">("blink");

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const blinkStateRef = useRef<BlinkState>({
    lastState: null,
    transitions: 0,
  });

  const getUserByEmailMutation = trpc.auth.getUserByEmailForLogin.useMutation();
  const verifyFaceMutation = trpc.auth.verifyFaceMatch.useMutation();

  // Load face-api models
  useEffect(() => {
    loadFaceApiModels().catch(error => {
      console.error("Failed to load face-api models:", error);
      toast.error("Failed to load face detection models");
    });
  }, []);

  const handleStartCamera = async () => {
    setInvalidUserMessage("");
    setEmailError("");

    if (!email) {
      setEmailError("Email ID is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email address format");
      return;
    }

    setIsLoading(true);

    try {
      // Validate that the Email ID exists in the database
      const user = await getUserByEmailMutation.mutateAsync({ email });

      const descriptor = user.embedding
        ? new Float32Array(user.embedding)
        : null;

      setTargetUser({
        id: user.id,
        name: user.name ?? "User",
        descriptor,
      });
      
      const challengesList = ["turn_left", "turn_right", "open_mouth"] as const;
      secondChallengeRef.current = challengesList[Math.floor(Math.random() * challengesList.length)];
      setActiveChallenge("blink");

      // Email ID exists! Open webcam automatically
      setCameraActive(true);
      setStep("scanning");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });

      // Wait a short moment to ensure the video element has mounted and videoRef is populated
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          startFaceDetection(descriptor, user.id);
        } else {
          // If ref is still not populated, cleanup stream
          stream.getTracks().forEach(track => track.stop());
          setCameraActive(false);
          setStep("idle");
          toast.error("Failed to initialize camera viewport");
        }
      }, 100);
    } catch (error: any) {
      console.error("Login verification error:", error);
      const errorMsg = error?.message || "Email ID not registered.";
      if (errorMsg.toLowerCase().includes("not registered") || error?.shape?.message?.toLowerCase().includes("not registered")) {
        setEmailError("Email ID not registered.");
      } else {
        setEmailError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startFaceDetection = (targetDescriptor: Float32Array | null, targetUserId: number) => {
    const startTime = Date.now();
    const livenessTimeout = 10000; // 10 seconds timeout for both challenges
    currentChallengeRef.current = "blink";

    detectionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      const elapsed = Date.now() - startTime;
      if (elapsed > livenessTimeout) {
        // Liveness Detection Failed!
        clearInterval(detectionIntervalRef.current!);
        stopCamera();
        setStep("idle");
        setInvalidUserMessage("Liveness Detection Failed.");
        toast.error("Liveness Detection Failed.");
        return;
      }

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors() as any;

        if (detections.length === 0) {
          setDetectionProgress(0);
          return;
        }

        // Prevent multiple faces in one frame
        if (detections.length > 1) {
          clearInterval(detectionIntervalRef.current!);
          stopCamera();
          setStep("idle");
          setInvalidUserMessage("Invalid User!");
          toast.error("Multiple faces detected!");
          return;
        }

        const positions = detections[0].landmarks.positions;
        const currentChallenge = currentChallengeRef.current;

        if (currentChallenge === "blink") {
          // Check for blink using state machine transitions
          const previousTransitions = blinkStateRef.current.transitions;
          const newBlinkState = detectBlink(
            positions,
            blinkStateRef.current
          );
          blinkStateRef.current = newBlinkState;

          if (newBlinkState.transitions > previousTransitions) {
            setBlinkCount(Math.floor(newBlinkState.transitions / 2));
            setBlinkDetected(true);
            setTimeout(() => setBlinkDetected(false), 200);
          }

          if (newBlinkState.transitions >= 2) {
            // Blink challenge completed! Move to next challenge
            toast.success("Blink detected! Move to next challenge.");
            const nextChallenge = secondChallengeRef.current;
            currentChallengeRef.current = nextChallenge;
            setActiveChallenge(nextChallenge);
          }
        } else if (currentChallenge === "turn_left") {
          const yaw = calculateHeadYaw(positions);
          if (yaw < 0.45) {
            clearInterval(detectionIntervalRef.current!);
            toast.success("Liveness Detection Successful.");
            await performFaceMatching(detections[0].descriptor, targetDescriptor, targetUserId);
          }
        } else if (currentChallenge === "turn_right") {
          const yaw = calculateHeadYaw(positions);
          if (yaw > 2.2) {
            clearInterval(detectionIntervalRef.current!);
            toast.success("Liveness Detection Successful.");
            await performFaceMatching(detections[0].descriptor, targetDescriptor, targetUserId);
          }
        } else if (currentChallenge === "open_mouth") {
          const ratio = calculateMouthRatio(positions);
          if (ratio > 0.30) {
            clearInterval(detectionIntervalRef.current!);
            toast.success("Liveness Detection Successful.");
            await performFaceMatching(detections[0].descriptor, targetDescriptor, targetUserId);
          }
        }

        // Update progress based on elapsed time out of 10 seconds
        const progress = Math.min((elapsed / livenessTimeout) * 100, 100);
        setDetectionProgress(progress);

      } catch (error) {
        console.error("Detection error:", error);
      }
    }, 200); // ~5 FPS
  };

  const performFaceMatching = async (
    currentDescriptor: Float32Array,
    targetDescriptor: Float32Array | null,
    targetUserId: number
  ) => {
    setStep("verifying");
    setIsLoading(true);

    try {
      let finalTargetDescriptor = targetDescriptor;

      if (!finalTargetDescriptor) {
        // Fallback: fetch face image and compute descriptor on the fly
        const targetUserObj = getUserByEmailMutation.data;
        if (targetUserObj?.imageUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = targetUserObj.imageUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load registration image"));
          });

          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            finalTargetDescriptor = await extractFaceDescriptor(canvas);
          }
        }
      }

      if (!finalTargetDescriptor) {
        setInvalidUserMessage("Invalid User!");
        toast.error("Failed to load stored face template.");
        setStep("idle");
        setIsLoading(false);
        stopCamera();
        return;
      }

      // One-to-one face comparison
      const distance = calculateDescriptorDistance(currentDescriptor, finalTargetDescriptor);
      const matchThreshold = 0.6; // Standard matching threshold

      if (distance < matchThreshold) {
        // Match found! Verify and navigate to profile
        await verifyFaceMutation.mutateAsync({ userId: targetUserId });
        toast.success("Verification Successful.");
        navigate(`/profile/${targetUserId}`);
      } else {
        // If match fails, display "Invalid User!"
        setInvalidUserMessage("Invalid User!");
      }
    } catch (error: any) {
      console.error("Face matching error:", error);
      setInvalidUserMessage("Invalid User!");
    } finally {
      setIsLoading(false);
      setStep("idle");
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    setBlinkCount(0);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const handleCancel = () => {
    stopCamera();
    setStep("idle");
    setDetectionProgress(0);
    setBlinkCount(0);
    setInvalidUserMessage("");
    setActiveChallenge("blink");
    blinkStateRef.current = {
      lastState: null,
      transitions: 0,
    };
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-primary/30">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Face Login</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Camera View or Idle State */}
          {cameraActive ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video viewfinder">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {blinkDetected && (
                  <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                )}
              </div>

              {/* Detection Status */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-foreground/60">
                  <span>SCANNING...</span>
                  <span>{Math.round(detectionProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                    style={{ width: `${detectionProgress}%` }}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-foreground/70 space-y-2">
                {activeChallenge === "blink" && (
                  <>
                    <p className="font-semibold text-primary animate-pulse text-base">Step 1 of 2: Blink naturally</p>
                    <div className="mt-2 p-2 bg-primary/10 rounded-md border border-primary/20 inline-block">
                      <span className="font-semibold text-primary">Blinks Registered: </span>
                      <span className="font-bold text-primary text-base">{blinkCount} / 1</span>
                    </div>
                  </>
                )}
                {activeChallenge === "turn_left" && (
                  <p className="font-semibold text-secondary animate-pulse text-lg py-2">
                    Step 2 of 2: Turn your head to the Left ⬅️
                  </p>
                )}
                {activeChallenge === "turn_right" && (
                  <p className="font-semibold text-secondary animate-pulse text-lg py-2">
                    Step 2 of 2: Turn your head to the Right ➡️
                  </p>
                )}
                {activeChallenge === "open_mouth" && (
                  <p className="font-semibold text-secondary animate-pulse text-lg py-2">
                    Step 2 of 2: Open your mouth 😮
                  </p>
                )}
              </div>

              {/* Cancel Button */}
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full border-primary/50 hover:bg-primary/10"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Invalid User Message */}
              {invalidUserMessage && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Login Failed</p>
                    <p className="text-sm text-destructive/80">{invalidUserMessage}</p>
                  </div>
                </div>
              )}

              {/* Email Input Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground/80">
                  Email ID
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                    setInvalidUserMessage("");
                  }}
                  placeholder="Enter your registered Email ID"
                  className="w-full px-3 py-2 bg-background border border-primary/20 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm text-foreground"
                />
                {emailError && (
                  <p className="text-xs text-destructive mt-1 font-semibold">{emailError}</p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-card border border-primary/20 rounded-lg p-4 text-center text-sm text-foreground/70">
                <p>Click "Start Scanning" to begin face liveness detection</p>
                <p className="text-xs text-foreground/50 mt-2">Make sure your face is clearly visible in good lighting</p>
              </div>

              {/* Start Button */}
              <Button
                onClick={handleStartCamera}
                disabled={isLoading}
                className="w-full glow-button bg-primary hover:bg-primary/90"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isLoading ? "Processing..." : "Start Scanning"}
              </Button>

              {/* Footer */}
              <div className="text-center text-sm text-foreground/70">
                Don't have an account?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="text-primary hover:underline font-medium"
                >
                  Register
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Hidden canvas for face detection */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
