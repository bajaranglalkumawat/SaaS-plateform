'use client';

import React, { useEffect, useState } from 'react';
import { User, AlertCircle } from 'lucide-react';

interface Profile {
  name: string;
  email: string | null;
  mobileNumber: string | null;
  address: string | null;
  openingBalance: number;
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('Not authenticated');
          return;
        }
        const res = await fetch('/api/customers/my-profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to load profile');
        setProfile(json.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-500" />
          Account Details
        </h1>
        <p className="text-xs text-slate-500">Your customer profile with this business</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-xl border border-rose-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading profile...</p>
      ) : profile ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div>
            <p className="text-lg font-bold text-slate-900">{profile.name}</p>
            <p className="text-xs text-slate-500">{profile.email || 'No email'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 font-semibold uppercase">Mobile</p>
              <p className="font-bold text-slate-800 mt-0.5">{profile.mobileNumber || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 font-semibold uppercase">Opening Balance</p>
              <p className="font-bold text-slate-800 mt-0.5">
                INR {Number(profile.openingBalance || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 col-span-2">
              <p className="text-slate-400 font-semibold uppercase">Address</p>
              <p className="font-bold text-slate-800 mt-0.5">{profile.address || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 font-semibold uppercase">Invoices</p>
              <p className="font-bold text-slate-800 mt-0.5">{profile.totalInvoices}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-400 font-semibold uppercase">Total Paid</p>
              <p className="font-bold text-emerald-700 mt-0.5">
                INR {Number(profile.totalPaid || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 col-span-2">
              <p className="text-slate-400 font-semibold uppercase">Amount Due</p>
              <p className="font-bold text-rose-700 mt-0.5">
                INR {Number(profile.totalDue || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
