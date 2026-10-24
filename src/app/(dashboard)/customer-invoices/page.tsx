'use client';

import React, { useEffect, useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string | null;
  invoiceDate: string;
  status: string;
}

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
        const res = await fetch('/api/customers/my-invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to load invoices');
        setInvoices(json.data || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load invoices');
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
          <FileText className="w-5 h-5 text-brand-500" />
          My Invoices
        </h1>
        <p className="text-xs text-slate-500">Invoices linked to your customer account</p>
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
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Due</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No invoices found for your account
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-semibold">{inv.invoiceNumber}</td>
                    <td className="p-3.5 text-slate-500">
                      {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3.5 font-bold">
                      INR {Number(inv.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      INR {Number(inv.paidAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : inv.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {inv.status}
                      </span>
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
