'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  AlertTriangle,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Clock,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  const m = data?.metrics || {};

  // Chart Mock Aggregations
  const salesChartData = [
    { name: 'Mon', sales: m.todaySales * 0.4 || 1200, revenue: m.todaySales * 0.3 || 900 },
    { name: 'Tue', sales: m.todaySales * 0.7 || 2400, revenue: m.todaySales * 0.5 || 1800 },
    { name: 'Wed', sales: m.todaySales * 0.5 || 1800, revenue: m.todaySales * 0.4 || 1400 },
    { name: 'Thu', sales: m.todaySales * 0.9 || 3500, revenue: m.todaySales * 0.8 || 2900 },
    { name: 'Fri', sales: m.todaySales * 1.2 || 4800, revenue: m.todaySales * 1.1 || 4200 },
    { name: 'Sat', sales: m.todaySales * 1.5 || 6200, revenue: m.todaySales * 1.4 || 5600 },
    { name: 'Sun', sales: m.todaySales || 5100, revenue: m.totalRevenue ? m.totalRevenue / 10 : 4800 },
  ];

  const paymentStatusData = [
    { name: 'Received', value: m.totalRevenue || 1, color: '#10b981' },
    { name: 'Pending', value: m.pendingPayments || 0, color: '#f59e0b' },
    { name: 'Overdue', value: m.overduePayments || 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>Business Performance Overview</span>
            <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time revenue, stock alerts & billing analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today&apos;s Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Sales</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">INR {m.todaySales?.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{m.todayInvoiceCount} Invoices generated today</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">INR {m.totalRevenue?.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-2">
            <span>Collected across all paid receipts</span>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-3">INR {m.pendingPayments?.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold mt-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>INR {m.overduePayments?.toLocaleString('en-IN')} overdue</span>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Profit</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">INR {m.estimatedProfit?.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-2">
            <span>Expenses: INR {m.totalExpenses?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Customers</p>
            <p className="text-lg font-bold text-slate-800">{m.totalCustomers}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Products</p>
            <p className="text-lg font-bold text-slate-800">{m.totalProducts}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Low Stock Alerts</p>
            <p className="text-lg font-bold text-rose-600">{m.lowStockProducts} Items</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">Weekly Sales & Revenue Trend</h2>
            <span className="text-xs text-slate-400 font-medium">7 Days Trend</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8ce9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0c8ce9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#0c8ce9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-800 mb-2">Payment Status Distribution</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentStatusData} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={4}>
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {paymentStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">INR {item.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Recent Generated Invoices</h2>
          <Link href="/invoices" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            View All Invoices →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data?.recentInvoices?.length > 0 ? (
                data.recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-brand-600">#{inv.invoiceNumber}</td>
                    <td className="p-3.5 font-medium text-slate-900">{inv.customer?.name}</td>
                    <td className="p-3.5 text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td className="p-3.5 font-bold text-slate-900">INR {inv.grandTotal?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : inv.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No invoices generated yet. Click &quot;Create Invoice&quot; above to issue your first invoice!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
