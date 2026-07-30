import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Camera, Shield, Zap, Lock } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold gradient-text">FaceLiveness AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-primary/50 hover:bg-primary/10"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className="glow-button bg-primary hover:bg-primary/90"
            >
              Register
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">AI POWERED LIVENESS DETECTION</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Secure Your Identity with{" "}
                <span className="gradient-text">AI Face Liveness Detection</span>
              </h1>
              <p className="text-lg text-foreground/70 leading-relaxed">
                Register once with your live face and enjoy passwordless secure login with real-time liveness detection. Our AI prevents spoof attacks and keeps your account 100% safe.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/register")}
                className="glow-button bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Register Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="border-primary/50 hover:bg-primary/10 font-semibold"
              >
                <Camera className="w-5 h-5 mr-2" />
                Login with Face
              </Button>
            </div>
          </div>

          {/* Right - Feature Showcase */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-3xl" />
            <div className="relative bg-card border border-primary/30 rounded-2xl p-8 viewfinder">
              <div className="space-y-6">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-sm text-foreground/60 font-mono">LIVE SCAN</p>
                </div>

                {/* Feature List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-foreground/80">Liveness Detected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-foreground/80">Blink Detection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-foreground/80">Anti-Spoofing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-foreground/80">Real Person Verified</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-foreground/60">
                    <span>SCANNING...</span>
                    <span>98%</span>
                  </div>
                  <div className="w-full h-1 bg-card rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full w-[98%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl font-bold text-primary">10K+</span>
              </div>
              <p className="text-sm text-foreground/60">Users Registered</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl font-bold text-primary">98.6%</span>
              </div>
              <p className="text-sm text-foreground/60">Detection Accuracy</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-6 h-6 text-primary" />
                <span className="text-3xl font-bold text-primary">4-5s</span>
              </div>
              <p className="text-sm text-foreground/60">Authentication Time</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="w-6 h-6 text-primary" />
                <span className="text-3xl font-bold text-primary">100%</span>
              </div>
              <p className="text-sm text-foreground/60">Secure & Private</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose FaceLiveness AI?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-primary/20 rounded-lg p-6 hover:border-primary/50 transition-colors">
            <Shield className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">AI Liveness Detection</h3>
            <p className="text-sm text-foreground/70">Advanced AI checks for blinking, head movement and real-time liveness to ensure you are a real person.</p>
          </div>

          <div className="bg-card border border-primary/20 rounded-lg p-6 hover:border-primary/50 transition-colors">
            <Camera className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Anti-Spoof Protection</h3>
            <p className="text-sm text-foreground/70">Detects photos, videos, masks and screen replays using state-of-the-art anti-spoofing technology.</p>
          </div>

          <div className="bg-card border border-primary/20 rounded-lg p-6 hover:border-primary/50 transition-colors">
            <Zap className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Fast & Accurate</h3>
            <p className="text-sm text-foreground/70">Powered by deep learning models to recognize you in 4-5 seconds with high accuracy.</p>
          </div>

          <div className="bg-card border border-primary/20 rounded-lg p-6 hover:border-primary/50 transition-colors">
            <Lock className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Enterprise Security</h3>
            <p className="text-sm text-foreground/70">Your data is encrypted and protected within industry standard security and privacy practices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
