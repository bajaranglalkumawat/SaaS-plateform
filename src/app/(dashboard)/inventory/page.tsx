'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Boxes, Plus, AlertTriangle } from 'lucide-react';

export default function InventoryPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    movementType: 'STOCK_IN',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const [mRes, pRes, lowRes] = await Promise.all([
        fetch('/api/inventory', { headers }),
        fetch('/api/products?limit=200', { headers }),
        fetch('/api/products?lowStock=true&limit=50', { headers }),
      ]);
      const mData = await mRes.json();
      const pData = await pRes.json();
      const lowData = await lowRes.json();
      if (mData.success) setMovements(mData.data || []);
      if (pData.success) setProducts(pData.data || []);
      if (lowData.success) setLowStock(lowData.data || []);
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
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...form,
          quantity: parseFloat(form.quantity),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({ productId: '', quantity: '', movementType: 'STOCK_IN', notes: '' });
        load();
      } else {
        alert(data.error || 'Stock update failed');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Control</h1>
          <p className="text-xs text-slate-500">Stock in / out and movement history</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Adjust Stock
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Low stock alert</p>
            <p className="text-xs text-amber-800 mt-1">
              {lowStock.map((p) => `${p.name} (${p.currentStock} ${p.unit})`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <Boxes className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-bold">Recent stock movements</h2>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b">
            <tr>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Product</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5 text-right">Qty</th>
              <th className="p-3.5">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  Loading inventory...
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No stock movements yet
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3.5">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="p-3.5 font-semibold">{m.product?.name || '—'}</td>
                  <td className="p-3.5">{m.movementType}</td>
                  <td
                    className={`p-3.5 text-right font-bold ${
                      m.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {m.quantity > 0 ? '+' : ''}
                    {m.quantity}
                  </td>
                  <td className="p-3.5 text-slate-500">{m.notes || '—'}</td>
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
            <h2 className="text-base font-bold">Adjust Stock</h2>
            <select
              required
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — stock {p.currentStock} {p.unit}
                </option>
              ))}
            </select>
            <select
              value={form.movementType}
              onChange={(e) => setForm({ ...form, movementType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            >
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment (+/-)</option>
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            />
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs rounded-xl border">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs rounded-xl bg-brand-600 text-white font-bold">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
