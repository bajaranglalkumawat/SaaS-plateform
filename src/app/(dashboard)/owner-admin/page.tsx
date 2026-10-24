'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Search,
  MoreVertical,
  Ban,
  CheckCircle2,
  Trash2,
  Eye,
  Filter,
  TrendingUp,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobileNumber: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  gstin: string | null;
  status: string;
  blockedReason: string | null;
  blockedAt: string | null;
  totalInvoices: number;
  totalPayments: number;
  totalPurchases: number;
  totalPaid: number;
  totalPending: number;
  lastPaymentDate: string | null;
  createdAt: string;
}

interface Metrics {
  total: number;
  active: number;
  blocked: number;
  totalRevenue: number;
  totalPending: number;
  totalPaid: number;
}

export default function OwnerAdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState<'details' | 'block' | 'delete' | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);

      const res = await fetch(`/api/customers/manage?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setCustomers(data.data.customers);
        setMetrics(data.data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleBlockCustomer = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch('/api/customers/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          action: 'BLOCK',
          reason: blockReason || 'Blocked by owner',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(null);
        setBlockReason('');
        fetchCustomers();
      } else {
        alert(data.error || 'Failed to block customer');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockCustomer = async (customerId: string) => {
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch('/api/customers/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId,
          action: 'UNBLOCK',
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchCustomers();
      } else {
        alert(data.error || 'Failed to unblock customer');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(`/api/customers/manage?customerId=${selectedCustomer.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(null);
        fetchCustomers();
      } else {
        alert(data.error || 'Failed to delete customer');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Owner Admin Panel</h1>
        <p className="text-sm text-slate-500">Manage all customers, block/unblock, and view analytics</p>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Total Customers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.active}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Blocked</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.blocked}</p>
              </div>
              <Ban className="w-8 h-8 text-rose-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Total Revenue</p>
                <p className="text-xl font-bold text-slate-900 mt-1">₹{(metrics.totalRevenue / 100000).toFixed(1)}L</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Amount Paid</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">₹{(metrics.totalPaid / 100000).toFixed(1)}L</p>
              </div>
              <IndianRupee className="w-8 h-8 text-emerald-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Pending</p>
                <p className="text-xl font-bold text-orange-600 mt-1">₹{(metrics.totalPending / 100000).toFixed(1)}L</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, email, or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="p-3.5">Name & Status</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Invoices</th>
                <th className="p-3.5">Total Purchase</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Pending</th>
                <th className="p-3.5">Last Payment</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{customer.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            customer.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {customer.mobileNumber && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {customer.mobileNumber}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3" /> {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {customer.city && (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3" /> {customer.city}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{customer.totalInvoices}</td>
                    <td className="p-3.5 font-bold text-slate-900">₹{customer.totalPurchases.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-emerald-600 font-semibold">₹{customer.totalPaid.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 font-extrabold text-orange-600">₹{customer.totalPending.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-slate-500">
                      {customer.lastPaymentDate ? (
                        <div className="flex items-center gap-1 text-[10px]">
                          <Clock className="w-3 h-3" />
                          {new Date(customer.lastPaymentDate).toLocaleDateString('en-IN')}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveMenu(activeMenu === customer.id ? null : customer.id)}
                          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </button>

                        {activeMenu === customer.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-48">
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowModal('details');
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100"
                            >
                              <Eye className="w-3 h-3" /> View Details
                            </button>

                            {customer.status === 'ACTIVE' ? (
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowModal('block');
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-b border-slate-100 font-semibold"
                              >
                                <Ban className="w-3 h-3" /> Block Customer
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  handleUnblockCustomer(customer.id);
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-emerald-50 text-emerald-600 flex items-center gap-2 border-b border-slate-100 font-semibold"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Unblock Customer
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowModal('delete');
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-semibold"
                            >
                              <Trash2 className="w-3 h-3" /> Delete Customer
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showModal === 'details' && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h2>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 font-semibold mb-1">Mobile Number</p>
                <p className="text-slate-900 font-medium">{selectedCustomer.mobileNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-1">Email</p>
                <p className="text-slate-900 font-medium">{selectedCustomer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-1">City</p>
                <p className="text-slate-900 font-medium">{selectedCustomer.city || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-1">GSTIN</p>
                <p className="text-slate-900 font-medium">{selectedCustomer.gstin || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 font-semibold mb-1">Address</p>
                <p className="text-slate-900 font-medium">{selectedCustomer.address || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-900 mb-3">Financial Summary</h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-slate-500 font-semibold">Total Invoices</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{selectedCustomer.totalInvoices}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-slate-500 font-semibold">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">₹{(selectedCustomer.totalPaid / 1000).toFixed(1)}K</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-slate-500 font-semibold">Total Pending</p>
                  <p className="text-lg font-bold text-orange-600 mt-1">₹{(selectedCustomer.totalPending / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showModal === 'block' && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Block Customer</h2>
            <p className="text-sm text-slate-600">
              Are you sure you want to block <strong>{selectedCustomer.name}</strong>? They will not be able to place new orders.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason (Optional)</label>
              <textarea
                rows={3}
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Payment default, Invalid documents..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockCustomer}
                disabled={actionLoading}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Blocking...' : 'Block Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showModal === 'delete' && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-600" />
              <h2 className="text-lg font-bold text-slate-900">Delete Customer</h2>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong>{selectedCustomer.name}</strong>? This action cannot be undone.
              {(selectedCustomer.totalInvoices > 0 || selectedCustomer.totalPayments > 0) && (
                <span className="block mt-2 text-rose-600 font-semibold">
                  ⚠️ This customer has existing transactions and cannot be deleted.
                </span>
              )}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={actionLoading || selectedCustomer.totalInvoices > 0 || selectedCustomer.totalPayments > 0}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
