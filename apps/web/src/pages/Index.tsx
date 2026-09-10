
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (!user.profileComplete) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  return null; // This component just redirects
};

export default Index;
