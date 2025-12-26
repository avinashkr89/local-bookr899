import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { authenticateUser, initializeDB, createUser } from './db';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (user: Omit<User, 'id' | 'createdAt'>) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDB();
        const storedUser = localStorage.getItem('localbookr_session');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Auth Init Error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, passwordHash: string): Promise<boolean> => {
    try {
      const appUser = await authenticateUser(email, passwordHash);
      
      if (appUser) {
        // Special check: If provider, check if active
        if (appUser.role === Role.PROVIDER) {
          // In a real app, you'd fetch provider status here.
          // For now, we rely on the dashboard to block access or show pending message
        }

        setUser(appUser);
        localStorage.setItem('localbookr_session', JSON.stringify(appUser));
        return true;
      } else {
        toast.error('Invalid Credentials');
        return false;
      }
    } catch (e) {
      console.error("Login Exception:", e);
      toast.error("Login failed");
      return false;
    }
  };

  const register = async (newUser: Omit<User, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const createdUser = await createUser(newUser);
      // Auto login after register
      setUser(createdUser);
      localStorage.setItem('localbookr_session', JSON.stringify(createdUser));
      return true;
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('localbookr_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
