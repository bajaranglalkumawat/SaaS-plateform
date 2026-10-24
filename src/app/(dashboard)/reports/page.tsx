'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, DollarSign, Calendar, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Generating business reports...</div>;
  }

  const m = metrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Financial Reports & Analytics</h1>
          <p className="text-xs text-slate-500">Sales tax reports, Profit & Loss summaries and monthly audit statements</p>
        </div>
      </div>

      {/* Profit and Loss Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <BarChart3 className="w-5 h-5 text-brand-600" />
          <span>Profit & Loss Statement (Year-to-Date)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Revenue</span>
            <p className="text-xl font-extrabold text-slate-900 mt-1">INR {m.totalRevenue?.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Expenses</span>
            <p className="text-xl font-extrabold text-rose-600 mt-1">INR {m.totalExpenses?.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs text-emerald-700 font-semibold uppercase">Net Estimated Profit</span>
            <p className="text-xl font-extrabold text-emerald-800 mt-1">INR {m.estimatedProfit?.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Available Report Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <FileText className="w-6 h-6 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900">Monthly Performance Report</h3>
          <p className="text-xs text-slate-500">Summary of total invoices, taxes, discounts, net sales & cost breakdown.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Sales Tax (GST) Statement</h3>
          <p className="text-xs text-slate-500">Itemized tax rate collections (5%, 12%, 18%, 28%) for easy GST returns filing.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <DollarSign className="w-6 h-6 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">Customer Debt & Ledger Report</h3>
          <p className="text-xs text-slate-500">Overview of unpaid balances, top buyers and customer purchase histories.</p>
        </div>
      </div>
    </div>
  );
}
