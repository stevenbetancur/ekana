import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings, updateSetting } = useUserSettings();
  const { toast } = useToast();

  // Password change modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordSuccessModalOpen, setPasswordSuccessModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate password change
    setPasswordModalOpen(false);
    setPasswordSuccessModalOpen(true);
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleManageSubscription = async () => {
    // This would redirect to Stripe customer portal
    window.open('https://billing.stripe.com/p/login/test_portal', '_blank');
  };

  // Determine if user signed up with social provider
  const isEmailSignup = user?.email && !user?.email.includes('google') && !user?.email.includes('facebook');
  const socialProvider = user?.email?.includes('google') ? 'Google' : user?.email?.includes('facebook') ? 'Facebook' : null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <img src="/lovable-uploads/abd406f5-a014-40a4-a5d1-98fc791a6368.png" alt="Settings" className="h-8 w-8" />
        </div>

        <div className="space-y-8">
          {/* Profile Information Section */}
          <div className="bg-card rounded-lg p-6 border max-w-60">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-foreground">Profile information</h2>
              <img src="/lovable-uploads/1d5a0f66-fd65-4cc9-8d4d-5acfff0f03c5.png" alt="Profile" className="h-6 w-6" />
            </div>
            <p className="text-lg text-muted-foreground mb-4">See and modify your user information.</p>
            <Button onClick={() => navigate('/profile')}>
              Go to my profile
            </Button>
          </div>

          {/* Account & Security Section */}
          <div className="bg-card rounded-lg p-6 border max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-foreground">Account & Security</h2>
              <img src="/lovable-uploads/e556e5f0-ddfa-4d39-8a4c-6896b87bcd7e.png" alt="Account" className="h-6 w-6" />
            </div>
            
            {isEmailSignup ? (
              <div className="space-y-4">
                <p className="text-foreground">{user?.email}</p>
                <div className="flex gap-3">
                  <Button variant="outline">Change Email</Button>
                  <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="oldPassword">Old Password</Label>
                          <Input
                            id="oldPassword"
                            type="password"
                            value={passwordForm.oldPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          />
                        </div>
                        <Button onClick={handlePasswordChange} className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-foreground">
                  You're currently signed up with your {socialProvider} account.
                </p>
                <Button variant="outline">Manage Account</Button>
              </div>
            )}
          </div>

          {/* Profile Privacy Section */}
          <div className="bg-card rounded-lg p-6 border max-w-lg">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-foreground">Profile Privacy</h2>
              <img src="/lovable-uploads/7bcac496-e35b-40d7-94c0-08a56c6a8d5f.png" alt="Privacy" className="h-6 w-6" />
            </div>
            <p className="text-lg text-muted-foreground mb-4">Choose how you're seen.</p>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="profile-discovery" className="text-lg leading-relaxed flex-1 font-normal">
                  Allow other learners to find your profile and invite you to a team.
                </Label>
                <Switch
                  id="profile-discovery"
                  checked={settings.allowProfileDiscovery}
                  onCheckedChange={(value) => updateSetting('allowProfileDiscovery', value)}
                />
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="location-visibility" className="text-lg leading-relaxed flex-1 font-normal">
                  Allow other learners to see your location.
                </Label>
                <Switch
                  id="location-visibility"
                  checked={settings.allowLocationVisibility}
                  onCheckedChange={(value) => updateSetting('allowLocationVisibility', value)}
                />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-card rounded-lg p-6 border max-w-lg">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-foreground">Notifications</h2>
              <img src="/lovable-uploads/a345af1b-31c8-4e9a-a3b5-88ab1e02c052.png" alt="Notifications" className="h-6 w-6" />
            </div>
            <p className="text-lg text-muted-foreground mb-4">Choose what emails we send you.</p>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="offers-notifications" className="text-lg leading-relaxed flex-1 font-normal">
                  New offers, discounts and events by Ekana.
                </Label>
                <Switch
                  id="offers-notifications"
                  checked={settings.offersNotifications}
                  onCheckedChange={(value) => updateSetting('offersNotifications', value)}
                />
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="journey-notifications" className="text-lg leading-relaxed flex-1 font-normal">
                  Messages related to your journey in Ekana (important).
                </Label>
                <Switch
                  id="journey-notifications"
                  checked={settings.journeyNotifications}
                  onCheckedChange={(value) => updateSetting('journeyNotifications', value)}
                />
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="team-notifications" className="text-lg leading-relaxed flex-1 font-normal">
                  Team notifications and in-app activity (essential).
                </Label>
                <Switch
                  id="team-notifications"
                  checked={settings.teamNotifications}
                  onCheckedChange={(value) => updateSetting('teamNotifications', value)}
                />
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-card rounded-lg p-6 border max-w-lg">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-foreground">Subscription</h2>
              <img src="/lovable-uploads/1b6c60ee-f878-48f2-a743-aaa8b640950d.png" alt="Subscription" className="h-6 w-6" />
            </div>
            <p className="text-lg text-muted-foreground mb-4">Manage your subscription with us.</p>
            
            {user?.isPremium ? (
              <div className="space-y-4">
                <p className="text-foreground">
                  You are currently a Premium member, <span className="font-medium">Quarterly Subscription</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Next billing date: March 15, 2024
                </p>
                <Button onClick={handleManageSubscription}>
                  Manage my subscription
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate('/premium')}>
                Explore Premium
              </Button>
            )}
          </div>

          {/* Data Permissions Section */}
          <div className="bg-card rounded-lg p-6 border max-w-lg">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-foreground">Data Permissions</h2>
              <img src="/lovable-uploads/ed582fa6-1e85-43fb-b016-6597474a4aee.png" alt="Data Permissions" className="h-6 w-6" />
            </div>
            <p className="text-lg text-muted-foreground mb-2">Manage your data.</p>
            <Button variant="link" className="p-0 h-auto text-sm text-primary mb-4">
              What is anonymized data?
            </Button>
            
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="customized-ads" className="text-lg leading-relaxed flex-1 font-normal">
                  Use my anonymized data to show me customized ads from relevant course creators and content.
                </Label>
                <Switch
                  id="customized-ads"
                  checked={settings.customizedAds}
                  onCheckedChange={(value) => updateSetting('customizedAds', value)}
                />
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <Label htmlFor="data-improvement" className="text-lg leading-relaxed flex-1 font-normal">
                  Use my anonymized data to improve Ekana (learning stats, preferences, interactions).
                </Label>
                <Switch
                  id="data-improvement"
                  checked={settings.dataImprovement}
                  onCheckedChange={(value) => updateSetting('dataImprovement', value)}
                />
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <div className="bg-card rounded-lg p-6 border max-w-lg">
            <Button onClick={handleLogout} className="w-full">
              Sign Out
            </Button>
          </div>
          
          {/* Delete Account */}
          <div className="flex justify-center">
            <Button variant="link" className="text-destructive p-0 h-auto text-sm">
              Delete my account
            </Button>
          </div>
        </div>

        {/* Password Success Modal */}
        <Dialog open={passwordSuccessModalOpen} onOpenChange={setPasswordSuccessModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <DialogTitle className="text-center">Password Changed Successfully</DialogTitle>
            </DialogHeader>
            <div className="text-center">
              <p className="text-muted-foreground mb-6">Your password has been updated successfully.</p>
              <Button onClick={() => setPasswordSuccessModalOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Settings;