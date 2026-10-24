'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  mobile?: string | null;
}

export interface TenantInfo {
  id: string;
  businessName: string;
  businessLogo?: string;
  subscriptionStatus: string;
  invoicePrefix: string;
  gstin?: string;
}

function homePathForRole(role: string) {
  if (role === 'SUPER_ADMIN') return '/admin';
  if (role === 'TENANT_MANAGER' || role === 'TENANT_STAFF') return '/customer-dashboard';
  return '/dashboard';
}

interface AuthContextType {
  user: AuthUser | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
  login: (
    accessToken: string,
    refreshToken: string,
    userData: AuthUser,              
    tenantData: TenantInfo | null
  ) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refetchUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      if (pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
        router.push('/login');
      }
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.isActive === false) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
          setTenant(null);
          router.push('/login');
          return;
        }
        setUser({
          id: data.data.id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          mobile: data.data.mobile || null,
        });
        setTenant(data.data.tenant || null);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setTenant(null);
        if (pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Auth context fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = (
    accessToken: string,
    refreshToken: string,
    userData: AuthUser,
    tenantData: TenantInfo | null
  ) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    setTenant(tenantData);
    router.push(homePathForRole(userData.role));
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setTenant(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isLoading,
        login,
        logout,
        refetchUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
