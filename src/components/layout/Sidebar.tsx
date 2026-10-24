'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  type LucideIcon,
  LayoutDashboard,
  Building2,
  Package,
  Users,
  FileText,
  CreditCard,
  Boxes,
  Receipt,
  BarChart3,
  Sparkles,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronRight,
  UserRound,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  businessName?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export default function Sidebar({ userRole = 'TENANT_OWNER', businessName = 'My Business' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  if (userRole === 'SUPER_ADMIN') {
    return (
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl select-none z-30">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-bold text-xl shadow-lg">
            A
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-slate-100 text-base leading-tight truncate">BillFlow Admin</h1>
            <p className="text-xs text-rose-400 font-medium truncate">Super Admin</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {[
            { name: 'Platform Admin', href: '/admin', icon: ShieldAlert },
            { name: 'My Profile', href: '/profile', icon: UserRound },
            { name: 'Settings', href: '/settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-rose-400 font-semibold border-l-4 border-rose-500 pl-2.5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-400" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Account</span>
          </button>
        </div>
      </aside>
    );
  }

  // Role-based navigation
  const isOwner = userRole === 'TENANT_OWNER';
  const isCustomer = userRole === 'TENANT_STAFF' || userRole === 'TENANT_MANAGER';

  const ownerNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Invoice', href: '/billing', icon: FileText, highlight: true },
    { name: 'Invoices & Search', href: '/invoices', icon: Receipt },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Products Catalog', href: '/products', icon: Package },
    { name: 'Customers CRM', href: '/customers', icon: Users },
    { name: 'Inventory Control', href: '/inventory', icon: Boxes },
    { name: 'Expense Manager', href: '/expenses', icon: Receipt },
    { name: 'Business Reports', href: '/reports', icon: BarChart3 },
    { name: 'Company Profile', href: '/business', icon: Building2 },
    { name: 'My Profile', href: '/profile', icon: UserRound },
    { name: 'Subscription Plans', href: '/subscription', icon: Sparkles },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const customerNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/customer-dashboard', icon: LayoutDashboard },
    { name: 'My Invoices', href: '/customer-invoices', icon: Receipt },
    { name: 'My Payments', href: '/customer-payments', icon: CreditCard },
    { name: 'Account Details', href: '/customer-profile', icon: FileText },
    { name: 'My Profile', href: '/profile', icon: UserRound },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const navItems = isOwner ? ownerNavItems : customerNavItems;

  // Determine header display based on role
  const headerTitle = isOwner ? 'BillFlow SaaS' : 'BillFlow Customer';
  const headerSubtitle = isOwner ? businessName : 'My Account';
  const headerIcon = isOwner ? 'S' : 'C';

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-xl select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
          {headerIcon}
        </div>
        <div className="overflow-hidden">
          <h1 className="font-bold text-slate-100 text-base leading-tight truncate">{headerTitle}</h1>
          <p className="text-xs text-brand-400 font-medium truncate">{headerSubtitle}</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                item.highlight
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/30 font-semibold'
                  : isActive
                  ? 'bg-slate-800 text-brand-400 font-semibold border-l-4 border-brand-500 pl-2.5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : item.highlight ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && !item.highlight && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Action */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Account</span>
        </button>
      </div>
    </aside>
  );
}
