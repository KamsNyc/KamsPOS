"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface Employee {
  id: string;
  name: string;
  role: "ADMIN" | "CASHIER";
  metadata?: Record<string, any>;
}

interface AuthContextType {
  storeUser: SupabaseUser | null;
  employee: Employee | null;
  loading: boolean;
  loginStore: (email: string, pin: string) => Promise<void>; // Actually email/pass for Supabase
  loginEmployee: (userId: string, pin: string) => Promise<boolean>;
  logoutStore: () => Promise<void>;
  logoutEmployee: () => Promise<void>;
  refreshStore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storeUser, setStoreUser] = useState<SupabaseUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Check Supabase Session (Store Layer)
        const { data: { session } } = await supabase.auth.getSession();
        setStoreUser(session?.user ?? null);

        if (session?.user) {
          // 2. Check Employee Session (App Layer) - persisted in localStorage
          const storedEmployee = localStorage.getItem("kams_pos_employee");
          if (storedEmployee) {
            setEmployee(JSON.parse(storedEmployee));
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setStoreUser(session?.user ?? null);
      if (!session) {
        setEmployee(null);
        localStorage.removeItem("kams_pos_employee");
        // Do not redirect here, let middleware or protected pages handle it
        // This allows public pages like /signup to work without getting redirected to /login
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const loginStore = async (email: string, pass: string) => {
    // This is handled by Supabase Auth UI or custom form calling supabase.auth.signInWithPassword
    // We'll expose the state, but the actual login logic often happens in the login form component.
    // However, we can wrap it here if desired.
  };

  const loginEmployee = async (userId: string, pin: string): Promise<boolean> => {
    if (!storeUser) return false;

    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin }),
      });

      if (res.ok) {
        const data = await res.json();
        const emp: Employee = {
          id: data.user.id,
          name: data.user.name,
          role: data.user.role,
          metadata: data.user.metadata,
        };
        setEmployee(emp);
        localStorage.setItem("kams_pos_employee", JSON.stringify(emp));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Employee login error:", error);
      return false;
    }
  };

  const logoutStore = async () => {
    // Clear employee cookie first
    try {
      await fetch("/api/auth/logout-employee", {
        method: "POST",
      });
    } catch (error) {
      // Ignore - store logout will invalidate everything anyway
    }
    
    await supabase.auth.signOut();
    setStoreUser(null);
    setEmployee(null);
    localStorage.removeItem("kams_pos_employee");
    router.push("/login");
  };

  const logoutEmployee = async () => {
    try {
      // Clear server-side cookie
      await fetch("/api/auth/logout-employee", {
        method: "POST",
      });
    } catch (error) {
      console.error("Error logging out employee:", error);
    }
    
    // Clear client-side state
    setEmployee(null);
    localStorage.removeItem("kams_pos_employee");
    router.push("/select-profile");
  };
  
  const refreshStore = async () => {
     const { data: { session } } = await supabase.auth.getSession();
     setStoreUser(session?.user ?? null);
  }

  return (
    <AuthContext.Provider
      value={{
        storeUser,
        employee,
        loading,
        loginStore: async () => {}, // Placeholder as login usually happens in page
        loginEmployee,
        logoutStore,
        logoutEmployee,
        refreshStore
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useStore() {
    const { storeUser, loading } = useAuth();
    return { user: storeUser, loading };
}

export function useEmployee() {
    const { employee, loginEmployee, logoutEmployee } = useAuth();
    return { user: employee, login: loginEmployee, logout: logoutEmployee };
}

