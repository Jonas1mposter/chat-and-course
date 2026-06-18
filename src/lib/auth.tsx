import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken } from "./api";

export type Role = "student" | "teacher" | "admin";
export type User = { sub: string; email: string; name: string; role: Role };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: "student" | "teacher") => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user } = await api<{ user: User }>("/api/auth/me");
      setUser(user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const { token, user } = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(token);
    setUser({ ...user, sub: (user as any).id ?? (user as any).sub });
  };

  const register: AuthCtx["register"] = async (email, password, name, role) => {
    const { token, user } = await api<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: { email, password, name, role },
    });
    setToken(token);
    setUser({ ...user, sub: (user as any).id ?? (user as any).sub });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
};