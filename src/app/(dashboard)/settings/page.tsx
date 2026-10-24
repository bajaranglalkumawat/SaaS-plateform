'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Sparkles, Shield, ArrowRight, ShieldAlert, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user, tenant, logout } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const links = [
    {
      href: '/profile',
      title: 'My Profile',
      desc: 'Name, mobile, address, WhatsApp & personal details',
      icon: User,
    },
    ...(isSuperAdmin
      ? [
          {
            href: '/admin',
            title: 'Platform Admin Panel',
            desc: 'Manage businesses, packages and subscriptions',
            icon: ShieldAlert,
          },
        ]
      : [
          {
            href: '/business',
            title: 'Company Profile',
            desc: 'Business details, GSTIN, bank & invoice footer',
            icon: Building2,
          },
          {
            href: '/subscription',
            title: 'Subscription Plans',
            desc: 'Upgrade plan, billing cycle & trial status',
            icon: Sparkles,
          },
        ]),
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-xs text-slate-500">Account and business configuration</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            {user?.mobile && <p className="text-xs text-slate-400 mt-0.5">{user.mobile}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs pt-2">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 font-semibold uppercase">Role</p>
            <p className="font-bold text-slate-800 mt-0.5">{user?.role || '—'}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-slate-400 font-semibold uppercase">Business</p>
            <p className="font-bold text-slate-800 mt-0.5 truncate">
              {isSuperAdmin ? 'Platform' : tenant?.businessName || '—'}
            </p>
          </div>
          {!isSuperAdmin && (
            <div className="bg-slate-50 rounded-xl p-3 col-span-2">
              <p className="text-slate-400 font-semibold uppercase">Subscription</p>
              <p className="font-bold text-slate-800 mt-0.5">{tenant?.subscriptionStatus || '—'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 hover:border-brand-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          );
        })}
      </div>

      <button
        onClick={logout}
        className="w-full py-3 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
