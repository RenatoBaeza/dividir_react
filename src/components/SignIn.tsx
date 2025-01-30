import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from "@/components/hooks/use-toast";

interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
}

export function SignIn() {
  const { setUser } = useAuth();
  const { toast } = useToast();

  return (
    <GoogleLogin
      onSuccess={credentialResponse => {
        if (!credentialResponse.credential) return;
        const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
        const userData = {
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }}
      onError={() => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Login Failed"
        });
      }}
    />
  );
}