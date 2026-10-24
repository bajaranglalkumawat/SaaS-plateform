'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  invoiceId: string;
  referenceNo?: string | null;
}

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
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
        const res = await fetch('/api/customers/my-payments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to load payments');
        setPayments(json.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-500" />
          My Payments
        </h1>
        <p className="text-xs text-slate-500">Payment history for your customer account</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 text-xs p-3 rounded-xl border border-rose-100">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Invoice</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Reference</th>
                <th className="p-3.5">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3.5 text-slate-500">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3.5 font-semibold">{p.invoiceId}</td>
                    <td className="p-3.5">{p.paymentMethod}</td>
                    <td className="p-3.5 text-slate-500">{p.referenceNo || '—'}</td>
                    <td className="p-3.5 font-bold text-emerald-700">
                      INR {Number(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
