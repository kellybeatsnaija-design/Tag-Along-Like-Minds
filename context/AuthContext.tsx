import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mocking an initial auth tokens check from secure local storage
    const checkAuthStatus = setTimeout(() => {
        // CHANGE THIS LINE: Set a mock profile to instantly bypass the login screen
        // setUser(null); 
        setUser({ name: 'Augustine' }); 
        setIsLoading(false);
    }, 100); // Shortened delay for faster hot-reloading

    return () => clearTimeout(checkAuthStatus);
  }, []);
    

  const signIn = () => setUser({ name: 'Augustine' }); // Links to your dashboard greeting
  const signOut = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be wrapped within an AuthProvider component');
  }
  return context;
}
