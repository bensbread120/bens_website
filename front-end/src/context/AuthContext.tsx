import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { User, userApi } from "../services/api";

// Context type
type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  create: (email: string, password: string) => Promise<void>;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
type AuthProviderProps = {
  children: ReactNode;
  initialUser?: User | null;
};

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser); 

  useEffect(() => {
    if (!initialUser) {
      userApi.getCurrentUser()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    }
  }, [initialUser]);

  const login = async (email: string, password: string) => {
    const data = await userApi.login(email, password);
    setUser(data);
  };

  const logout = async () => {
    await userApi.logout();
    setUser(null);
  };

  const create = async (email: string, password: string) => {
    await userApi.createUser(email, password);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, create }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
