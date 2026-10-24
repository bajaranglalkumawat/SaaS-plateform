'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';

const SUPER_ADMIN_ALLOWED = new Set(['/admin', '/settings']);

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, tenant, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === 'SUPER_ADMIN') {
      const allowed = SUPER_ADMIN_ALLOWED.has(pathname) || pathname.startsWith('/admin');
      if (!allowed) {
        router.replace('/admin');
      }
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading business workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar userRole={user?.role} businessName={tenant?.businessName || 'My Business'} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          userName={user?.name}
          userRole={user?.role}
          subscriptionStatus={tenant?.subscriptionStatus}
        />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  );
}
