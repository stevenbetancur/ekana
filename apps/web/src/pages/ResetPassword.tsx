import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const MIN_PASSWORD_LENGTH = 8;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPasswordReset, error: authError, clearError } = useAuth();
  const token = searchParams.get("token");
  const invalidLink = !token || searchParams.get("error") !== null;

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (password !== confirmation) {
      setFormError("Passwords don't match.");
      return;
    }
    setFormError(null);
    setIsLoading(true);
    const { error } = await confirmPasswordReset(token as string, password);
    setIsLoading(false);
    if (!error) {
      setDone(true);
      toast.success("Password updated. You can sign in now.");
    }
  };

  return (
    <div className="min-h-screen bg-ekana-purple-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{done ? "Password updated" : "Choose a new password"}</CardTitle>
          <CardDescription>
            {invalidLink
              ? "This reset link is invalid or has expired."
              : done
                ? "For your security, you've been signed out of all devices."
                : `Use at least ${MIN_PASSWORD_LENGTH} characters.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invalidLink ? (
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Request a new link
            </Button>
          ) : done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {(formError || authError) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError || authError}</AlertDescription>
                </Alert>
              )}
              <Input
                type="password"
                placeholder="New password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
