'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Sparkles, User, Bell } from 'lucide-react';

interface NavbarProps {
  userName?: string;
  userRole?: string;
  subscriptionStatus?: string;
}

export default function Navbar({
  userName = 'Owner User',
  userRole = 'TENANT_OWNER',
  subscriptionStatus = 'TRIALING',
}: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const isPlatformAdmin = userRole === 'SUPER_ADMIN';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/invoices?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs">
      {isPlatformAdmin ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-rose-500">Private Console</p>
          <h2 className="text-sm font-black text-slate-900">Platform Admin</h2>
        </div>
      ) : (
        <form onSubmit={handleSearchSubmit} className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
          />
        </form>
      )}

      {/* Action Controls & Profile Pill */}
      <div className="flex items-center gap-4">
        {!isPlatformAdmin && (
          <>
            <Link
              href="/subscription"
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>{subscriptionStatus === 'ACTIVE' ? 'Pro Plan Active' : 'Free Trial Active'}</span>
            </Link>

            <Link
              href="/billing"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Invoice</span>
            </Link>

            <div className="h-5 w-[1px] bg-slate-200" />
          </>
        )}

        {/* User Info Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center text-xs font-bold ring-2 ring-brand-500/30">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{userName}</p>
            <span className="text-[10px] text-slate-400 font-medium uppercase">{userRole.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
