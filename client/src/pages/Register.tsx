import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Camera, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { extractFaceDescriptor, loadFaceApiModels } from "@/lib/faceDetection";

type RegistrationStep = "form" | "camera";

export default function Register() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<RegistrationStep>("form");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    dateOfBirth: "",
    department: "",
  });

  const registerMutation = trpc.auth.register.useMutation();

  // Load face-api models on mount
  useEffect(() => {
    loadFaceApiModels().catch(error => {
      console.error("Failed to load face-api models:", error);
      toast.error("Failed to load face detection models");
    });
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Unable to access camera. Please check permissions.");
    }
  };

  const handleCapture = () => {
    try {
      const video = videoRef.current;
      if (!video) {
        toast.error("Video reference not available");
        return;
      }

      // Create a temporary canvas for capture
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');

      if (!ctx) {
        toast.error("Failed to get canvas context");
        return;
      }

      // Ensure video has loaded metadata
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error("Video not ready. Please wait a moment and try again.");
        return;
      }

      // Set canvas dimensions to match video
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      // Convert canvas to data URL
      const imageData = tempCanvas.toDataURL("image/jpeg", 0.95);

      if (!imageData || imageData.length < 100) {
        toast.error("Failed to capture image. Please try again.");
        return;
      }

      setCapturedImage(imageData);
      toast.success("Photo captured successfully!");

      // Stop camera
      const stream = video.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
    } catch (error) {
      console.error("Capture error:", error);
      toast.error("Failed to capture photo. Please try again.");
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    handleStartCamera();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.dateOfBirth || !formData.department) {
      toast.error("Please fill in all fields");
      return;
    }

    setStep("camera");
  };

  const handleCompleteRegistration = async () => {
    if (!capturedImage) {
      toast.error("Please capture a face image");
      return;
    }

    setIsLoading(true);
    try {
      let faceEmbedding: string | undefined;
      
      try {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              tempCanvas.width = img.width;
              tempCanvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              resolve();
            };
            img.src = capturedImage;
          });
          
          const descriptor = await extractFaceDescriptor(tempCanvas);
          if (descriptor) {
            faceEmbedding = JSON.stringify(Array.from(descriptor));
          }
        }
      } catch (error) {
        console.warn("Failed to extract face embedding:", error);
      }

      const result = await registerMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        dateOfBirth: formData.dateOfBirth,
        department: formData.department,
        faceImageData: capturedImage,
        faceEmbedding,
      });

      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      let friendlyMessage = error.message || "Registration failed";
      try {
        const parsed = JSON.parse(friendlyMessage);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
          friendlyMessage = parsed[0].message;
        }
      } catch (e) {
        // Not a JSON error, keep original message
      }
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "camera") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-primary/30">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Face Capture</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (cameraActive && videoRef.current?.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                  }
                  setStep("form");
                  setCameraActive(false);
                  setCapturedImage(null);
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>

            {/* Camera or Captured Image */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video viewfinder">
              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-foreground/70">
              {!capturedImage && !cameraActive && (
                <p>Click "Start Camera" to begin face capture</p>
              )}
              {!capturedImage && cameraActive && (
                <p>Position your face in the frame and click "Capture"</p>
              )}
              {capturedImage && (
                <p>Your face has been captured successfully</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!capturedImage ? (
                <>
                  {!cameraActive ? (
                    <Button
                      onClick={handleStartCamera}
                      className="w-full glow-button bg-primary hover:bg-primary/90"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCapture}
                      className="w-full glow-button bg-primary hover:bg-primary/90"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Photo
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleRetakePhoto}
                    variant="outline"
                    className="w-full border-primary/50 hover:bg-primary/10"
                  >
                    Retake Photo
                  </Button>
                  <Button
                    onClick={handleCompleteRegistration}
                    disabled={isLoading}
                    className="w-full glow-button bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? "Registering..." : "Complete Registration"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-primary/30">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="John Doe"
                className="bg-background border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="john@example.com"
                className="bg-background border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                placeholder="••••••••"
                className="bg-background border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleFormChange}
                className="bg-background border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleFormChange}
                placeholder="Engineering"
                className="bg-background border-border/50 focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full glow-button bg-primary hover:bg-primary/90 mt-6"
            >
              Next: Capture Face
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-foreground/70">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
