'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'CASH',
    referenceNo: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const [pRes, iRes] = await Promise.all([
        fetch('/api/payments', { headers }),
        fetch('/api/invoices?limit=100', { headers }),
      ]);
      const pData = await pRes.json();
      const iData = await iRes.json();
      if (pData.success) setPayments(pData.data || []);
      if (iData.success) {
        const unpaid = (iData.data || []).filter(
          (inv: any) =>
            (inv.paymentStatus === 'UNPAID' || inv.paymentStatus === 'PARTIALLY_PAID') &&
            (inv.pendingAmount || 0) > 0
        );
        setInvoices(unpaid);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({ invoiceId: '', amount: '', paymentMethod: 'CASH', referenceNo: '', notes: '' });
        load();
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments</h1>
          <p className="text-xs text-slate-500">Record collections against unpaid invoices</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase">Collected (listed)</span>
          <p className="text-2xl font-black mt-1">INR {totalCollected.toLocaleString('en-IN')}</p>
        </div>
        <CreditCard className="w-8 h-8 text-brand-400" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b">
            <tr>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Invoice</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Method</th>
              <th className="p-3.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Loading payments...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No payments recorded yet
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3.5">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="p-3.5 font-semibold">{p.invoice?.invoiceNumber || '—'}</td>
                  <td className="p-3.5">{p.customer?.name || '—'}</td>
                  <td className="p-3.5">{p.paymentMethod}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-600">
                    ₹{(p.amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-base font-bold">Record Payment</h2>
            <div className="space-y-3">
              <select
                required
                value={form.invoiceId}
                onChange={(e) => {
                  const inv = invoices.find((i) => i.id === e.target.value);
                  setForm({
                    ...form,
                    invoiceId: e.target.value,
                    amount: inv ? String(inv.pendingAmount || '') : '',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">Select unpaid invoice</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — pending ₹{(inv.pendingAmount || 0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
              <input
                placeholder="Reference / UTR (optional)"
                value={form.referenceNo}
                onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs rounded-xl border">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs rounded-xl bg-brand-600 text-white font-bold">
                Save Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
