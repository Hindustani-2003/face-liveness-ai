import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { LogOut, ArrowLeft, User, Mail, Calendar, Briefcase, Image } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ProfileData {
  id: number;
  name: string;
  email: string;
  dateOfBirth: string;
  department: string;
  faceImageUrl: string;
  createdAt: Date;
}

export default function Profile({ params }: { params: { userId: string } }) {
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getProfileMutation = trpc.auth.getProfile.useQuery({
    userId: parseInt(params.userId),
  });

  const logoutMutation = trpc.auth.logout.useMutation();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (getProfileMutation.data) {
      setProfile(getProfileMutation.data as ProfileData);
      setIsLoading(false);
    }
  }, [getProfileMutation.data]);

  useEffect(() => {
    if (getProfileMutation.isError) {
      toast.error("Failed to load profile");
      navigate("/login");
    }
  }, [getProfileMutation.isError, navigate]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccountMutation.mutateAsync({ userId: parseInt(params.userId) });
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-foreground/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-primary/30">
          <div className="p-8 text-center space-y-4">
            <p className="text-foreground/70">Profile not found</p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full glow-button bg-primary hover:bg-primary/90"
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold gradient-text">Profile</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-primary/50 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              onClick={handleLogout}
              className="glow-button bg-primary hover:bg-primary/90"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 p-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold gradient-text">Welcome, {profile.name}!</h1>
              <p className="text-foreground/70">Your account has been successfully verified</p>
            </div>
          </Card>

          {/* Face Image */}
          {profile.faceImageUrl && (
            <Card className="bg-card border-primary/30 overflow-hidden">
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  Registered Face
                </h2>
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video viewfinder">
                  <img
                    src={profile.faceImageUrl}
                    alt="Registered face"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Profile Details */}
          <Card className="bg-card border-primary/30">
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-semibold">Account Information</h2>

              {/* Name */}
              <div className="flex items-start gap-4 pb-4 border-b border-border/50">
                <User className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/60">Full Name</p>
                  <p className="text-lg font-medium">{profile.name}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 pb-4 border-b border-border/50">
                <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/60">Email Address</p>
                  <p className="text-lg font-medium">{profile.email}</p>
                </div>
              </div>

              {/* Date of Birth */}
              <div className="flex items-start gap-4 pb-4 border-b border-border/50">
                <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/60">Date of Birth</p>
                  <p className="text-lg font-medium">{profile.dateOfBirth}</p>
                </div>
              </div>

              {/* Department */}
              <div className="flex items-start gap-4 pb-4 border-b border-border/50">
                <Briefcase className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/60">Department</p>
                  <p className="text-lg font-medium">{profile.department}</p>
                </div>
              </div>

              {/* Registration Date */}
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/60">Account Created</p>
                  <p className="text-lg font-medium">{formatDate(profile.createdAt)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Security Info */}
          <Card className="bg-card border-primary/30">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Security Status</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Face liveness verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Blink detection passed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Anti-spoofing verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Real person confirmed</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex-1 border-primary/50 hover:bg-primary/10"
            >
              Back to Home
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 glow-button bg-primary hover:bg-primary/90"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Danger Zone */}
          <Card className="bg-destructive/5 border-destructive/30 border">
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                <p className="text-sm text-foreground/70 mt-1">
                  Once you delete your account, there is no going back. All your registered details and face templates will be permanently removed.
                </p>
              </div>
              <Button
                onClick={handleDeleteAccount}
                variant="destructive"
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-white font-medium"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting Account..." : "Delete Account"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
