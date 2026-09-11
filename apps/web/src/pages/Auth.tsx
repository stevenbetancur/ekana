import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MIN_PASSWORD_LENGTH = 8;
const RESEND_COOLDOWN_MS = 30_000;

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);
  const linkError = searchParams.get("error");

  const { user, loading: authLoading, error: authError, login, signup, resetPassword, resendVerification, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      if (!user.profileComplete) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, authLoading, navigate]);

  // Clear error when switching tabs or views
  useEffect(() => {
    clearError();
  }, [showForgotPassword]);

  // Cooldown avoids flooding the user's inbox (and our SMTP quota) with verification emails.
  const handleResend = async (email: string) => {
    if (!email || resendCooldown) return;
    setResendCooldown(true);
    const { error } = await resendVerification(email);
    if (!error) toast.success("Verification email sent. Check your inbox.");
    setTimeout(() => setResendCooldown(false), RESEND_COOLDOWN_MS);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error, code } = await login(email, password);

    if (error) {
      setUnverifiedEmail(code === "EMAIL_NOT_VERIFIED" ? email : null);
    } else {
      toast.success("Welcome back!");
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Client-side validation
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      setIsLoading(false);
      return;
    }

    const { error } = await signup(email, password, name);

    if (!error) {
      setPendingEmail(email);
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    const { error } = await resetPassword(forgotEmail);

    if (!error) {
      setResetSent(true);
      toast.success("Reset link sent to your email!");
    }

    setIsLoading(false);
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-ekana-purple-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-ekana-purple-dark flex items-center justify-center p-4 relative">
        <Button
          variant="ghost"
          className="absolute top-4 left-4 text-white hover:text-blue-100"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {resetSent ? "Check your email for reset instructions" : "Enter your email to receive a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            {resetSent ? (
              <div className="text-center space-y-4">
                <Mail className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{forgotEmail}</strong>, we've sent a password reset link.
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingEmail) {
    return (
      <div className="min-h-screen bg-ekana-purple-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle>Check your inbox</CardTitle>
            <CardDescription>
              We sent a verification link to <strong>{pendingEmail}</strong>. Click it to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              disabled={resendCooldown}
              onClick={() => handleResend(pendingEmail)}
            >
              {resendCooldown ? "Email sent. You can resend in 30 seconds" : "Resend verification email"}
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => setPendingEmail(null)}>
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ekana-purple-dark flex items-center justify-center p-4 relative">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:text-blue-100"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/lovable-uploads/bec881ef-2b66-46e6-ad59-3436f0ed052e.png" alt="Ekana Logo" className="w-[215px] h-auto mx-auto mb-4" />
          <p className="text-white">Find a team to learn anything</p>
        </div>

        <Card>
          <CardContent className="p-6">
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            {unverifiedEmail && (
              <div className="mb-4 text-center">
                <Button
                  variant="link"
                  className="text-sm"
                  disabled={resendCooldown}
                  onClick={() => handleResend(unverifiedEmail)}
                >
                  {resendCooldown ? "Verification email sent" : "Resend verification email"}
                </Button>
              </div>
            )}
            {linkError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>This verification link is invalid or has expired. Enter your email to get a new one.</p>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleResend(resendEmail).then(() => setSearchParams({}));
                    }}
                  >
                    <Input
                      type="email"
                      required
                      placeholder="Email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                    />
                    <Button type="submit" size="sm" disabled={resendCooldown}>
                      Send
                    </Button>
                  </form>
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="signin" className="w-full" onValueChange={() => clearError()}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    autoComplete="email"
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password?
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full" disabled>
                    Google
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    Facebook
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <Input
                    name="name"
                    type="text"
                    placeholder="Full Name"
                    required
                    autoComplete="name"
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    autoComplete="email"
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder={`Password (min ${MIN_PASSWORD_LENGTH} characters)`}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy.
                </p>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full" disabled>
                    Google
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    Facebook
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-xs text-white/60 text-center mt-4">
          You'll need to verify your email before signing in.
        </p>
      </div>
    </div>
  );
};

export default Auth;
