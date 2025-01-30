import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface AuthContextType {
  user: {
    email: string;
    name: string;
    picture: string;
  } | null;
  setUser: (user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID is not configured in environment variables');
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ user, setUser, logout }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}