'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  IndianRupee,
  Package,
  Search,
  Plus,
  Pencil,
  Ban,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type Tab = 'overview' | 'customers' | 'packages';

const STATUS_OPTIONS = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'];

const emptyPlanForm = {
  name: '',
  code: '',
  description: '',
  monthlyPrice: '499',
  yearlyPrice: '4999',
  maxInvoices: '200',
  maxProducts: '300',
  maxUsers: '2',
  maxCustomers: '500',
  hasInventory: true,
  hasAdvancedReports: false,
  hasMultipleBranches: false,
  isActive: true,
};

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('customers');
  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editTenant, setEditTenant] = useState<any | null>(null);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);
  const [tenantForm, setTenantForm] = useState({
    planId: '',
    subscriptionStatus: 'ACTIVE',
    trialEndsAt: '',
    subscriptionEndsAt: '',
    notes: '',
    businessName: '',
    ownerName: '',
    email: '',
    mobileNumber: '',
    address: '',
    city: '',
    state: '',
  });
  const [savingTenant, setSavingTenant] = useState(false);

  const [planModal, setPlanModal] = useState<'create' | 'edit' | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [savingPlan, setSavingPlan] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json',
  });

  const loadTenants = useCallback(async () => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (statusFilter) query.set('status', statusFilter);
    const res = await fetch(`/api/admin/tenants?${query}`, { headers: authHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load customers');
    setMetrics(json.data.metrics);
    setTenants(json.data.tenants || []);
  }, [search, statusFilter]);

  const loadPlans = useCallback(async () => {
    const res = await fetch('/api/admin/plans', { headers: authHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load packages');
    setPlans(json.data || []);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadTenants(), loadPlans()]);
    } catch (e: any) {
      setError(e.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [loadTenants, loadPlans]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    refreshAll();
  }, [user, authLoading, router, refreshAll]);

  const openEditTenant = async (t: any) => {
    setEditTenant(t);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${t.id}`, { headers: authHeaders() });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Failed to load business details');
        return;
      }

      const tenant = json.data;
      setTenantUsers(tenant.users || []);
      setTenantForm({
        planId: tenant.planId || '',
        subscriptionStatus: tenant.subscriptionStatus || 'ACTIVE',
        trialEndsAt: tenant.trialEndsAt ? tenant.trialEndsAt.slice(0, 10) : '',
        subscriptionEndsAt: tenant.subscriptionEndsAt ? tenant.subscriptionEndsAt.slice(0, 10) : '',
        notes: '',
        businessName: tenant.businessName || '',
        ownerName: tenant.ownerName || '',
        email: tenant.email || '',
        mobileNumber: tenant.mobileNumber || '',
        address: tenant.address || '',
        city: tenant.city || '',
        state: tenant.state || '',
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  const saveTenant = async (extra?: {
    deactivateUsers?: boolean;
    activateUsers?: boolean;
    subscriptionStatus?: string;
  }) => {
    if (!editTenant) return;
    setSavingTenant(true);
    try {
      const status = extra?.subscriptionStatus || tenantForm.subscriptionStatus;
      const res = await fetch(`/api/admin/tenants/${editTenant.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          planId: tenantForm.planId || null,
          subscriptionStatus: status,
          trialEndsAt: tenantForm.trialEndsAt || null,
          subscriptionEndsAt: tenantForm.subscriptionEndsAt || null,
          businessName: tenantForm.businessName,
          ownerName: tenantForm.ownerName,
          email: tenantForm.email,
          mobileNumber: tenantForm.mobileNumber,
          address: tenantForm.address,
          city: tenantForm.city,
          state: tenantForm.state,
          notes: tenantForm.notes || 'Updated by Super Admin',
          deactivateUsers: extra?.deactivateUsers,
          activateUsers: extra?.activateUsers,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Update failed');
        return;
      }
      setEditTenant(null);
      await refreshAll();
    } catch {
      alert('Update failed');
    } finally {
      setSavingTenant(false);
    }
  };

  const openCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm(emptyPlanForm);
    setPlanModal('create');
  };

  const openEditPlan = (p: any) => {
    setEditingPlanId(p.id);
    setPlanForm({
      name: p.name || '',
      code: p.code || '',
      description: p.description || '',
      monthlyPrice: String(p.monthlyPrice ?? 0),
      yearlyPrice: String(p.yearlyPrice ?? 0),
      maxInvoices: String(p.maxInvoices ?? 50),
      maxProducts: String(p.maxProducts ?? 100),
      maxUsers: String(p.maxUsers ?? 1),
      maxCustomers: String(p.maxCustomers ?? 100),
      hasInventory: !!p.hasInventory,
      hasAdvancedReports: !!p.hasAdvancedReports,
      hasMultipleBranches: !!p.hasMultipleBranches,
      isActive: !!p.isActive,
    });
    setPlanModal('edit');
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const isEdit = planModal === 'edit' && editingPlanId;
      const res = await fetch(isEdit ? `/api/admin/plans/${editingPlanId}` : '/api/admin/plans', {
        method: isEdit ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(planForm),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Save failed');
        return;
      }
      setPlanModal(null);
      await loadPlans();
      await loadTenants();
    } catch {
      alert('Save failed');
    } finally {
      setSavingPlan(false);
    }
  };

  const deactivatePlan = async (id: string, name: string) => {
    if (!confirm(`Deactivate package "${name}"?`)) return;
    const res = await fetch(`/api/admin/plans/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const json = await res.json();
    if (!json.success) alert(json.error || 'Failed');
    else await loadPlans();
  };

  if (authLoading) {
    return <p className="text-sm text-slate-500">Loading admin panel...</p>;
  }
  if (user && user.role !== 'SUPER_ADMIN') return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'customers', label: 'Customers / Businesses' },
    { id: 'packages', label: 'Packages' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          Platform Admin Panel
        </h1>
        <p className="text-xs text-slate-500">
          Manage all registered businesses, assign packages, and control subscriptions
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-xl border border-rose-100">{error}</div>
      )}

      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors ${
              tab === t.id
                ? 'bg-white border border-b-white border-slate-200 text-brand-600 -mb-px'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Businesses', value: metrics?.totalBusinesses ?? '-', icon: Building2 },
            { label: 'Active', value: metrics?.activeBusinesses ?? '-', icon: CheckCircle2 },
            { label: 'On Trial', value: metrics?.trialingBusinesses ?? '-', icon: Users },
            { label: 'Expired', value: metrics?.expiredBusinesses ?? '-', icon: Ban },
            { label: 'Platform Users', value: metrics?.totalUsers ?? '-', icon: Users },
            { label: 'Packages', value: metrics?.plansCount ?? plans.length, icon: Package },
            {
              label: 'Revenue',
              value: metrics ? `INR ${Number(metrics.platformRevenue || 0).toLocaleString('en-IN')}` : '-',
              icon: IndianRupee,
            },
            { label: 'Canceled', value: metrics?.canceledBusinesses ?? '-', icon: Ban },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{card.label}</span>
                  <Icon className="w-4 h-4 text-brand-500" />
                </div>
                <p className="text-xl font-black text-slate-900 mt-2">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Customers */}
      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && refreshAll()}
                placeholder="Search business, owner, email, mobile..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={refreshAll}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Search
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b">
                  <tr>
                    <th className="p-3.5">Business</th>
                    <th className="p-3.5">Owner</th>
                    <th className="p-3.5">Package</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Usage</th>
                    <th className="p-3.5">Joined</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Loading...
                      </td>
                    </tr>
                  ) : tenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No businesses found
                      </td>
                    </tr>
                  ) : (
                    tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-semibold">{t.businessName}</td>
                        <td className="p-3.5">
                          <div>{t.ownerName}</div>
                          <div className="text-slate-400">{t.email}</div>
                          <div className="text-slate-400">{t.mobileNumber}</div>
                        </td>
                        <td className="p-3.5">{t.plan?.name || '-'}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              t.subscriptionStatus === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : t.subscriptionStatus === 'TRIALING'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {t.subscriptionStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          U:{t._count?.users || 0} | Inv:{t._count?.invoices || 0} | C:
                          {t._count?.customers || 0}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => openEditTenant(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-bold hover:bg-brand-100"
                          >
                            <Pencil className="w-3 h-3" />
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Packages */}
      {tab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCreatePlan}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Create Package
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`bg-white border rounded-2xl p-5 space-y-3 ${
                  p.isActive ? 'border-slate-200' : 'border-rose-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {p.isActive ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 min-h-[32px]">{p.description || '-'}</p>
                <div className="flex gap-4 text-sm font-black text-slate-900">
                  <span>INR {p.monthlyPrice}/mo</span>
                  <span className="text-slate-400 font-semibold">INR {p.yearlyPrice}/yr</span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>
                    Limits: Inv {p.maxInvoices === -1 ? 'Unlimited' : p.maxInvoices} | Products{' '}
                    {p.maxProducts === -1 ? 'Unlimited' : p.maxProducts} | Users {p.maxUsers} | Customers{' '}
                    {p.maxCustomers === -1 ? 'Unlimited' : p.maxCustomers}
                  </p>
                  <p>
                    Features: {p.hasInventory ? 'Inventory' : ''}
                    {p.hasAdvancedReports ? ' | Reports' : ''}
                    {p.hasMultipleBranches ? ' | Branches' : ''}
                  </p>
                  <p className="font-semibold text-slate-700">
                    Assigned to {p._count?.tenants || 0} businesses
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEditPlan(p)}
                    className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  {p.isActive && (
                    <button
                      onClick={() => deactivatePlan(p.id, p.name)}
                      className="px-3 py-2 text-xs font-bold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100"
                    >
                      Off
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage customer modal */}
      {editTenant && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Manage Business</h2>
                <p className="text-xs text-slate-500">{editTenant.businessName}</p>
              </div>
              <button onClick={() => { setEditTenant(null); setTenantUsers([]); }}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">Business Name</span>
                  <input
                    value={tenantForm.businessName}
                    onChange={(e) => setTenantForm({ ...tenantForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">Owner Name</span>
                  <input
                    value={tenantForm.ownerName}
                    onChange={(e) => setTenantForm({ ...tenantForm, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">Business Email</span>
                  <input
                    type="email"
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">Mobile Number</span>
                  <input
                    value={tenantForm.mobileNumber}
                    onChange={(e) => setTenantForm({ ...tenantForm, mobileNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">Address</span>
                  <input
                    value={tenantForm.address}
                    onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">City</span>
                  <input
                    value={tenantForm.city}
                    onChange={(e) => setTenantForm({ ...tenantForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">State</span>
                  <input
                    value={tenantForm.state}
                    onChange={(e) => setTenantForm({ ...tenantForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-600">Assign Package</span>
                <select
                  value={tenantForm.planId}
                  onChange={(e) => setTenantForm({ ...tenantForm, planId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  <option value="">No package</option>
                  {plans
                    .filter((p) => p.isActive || p.id === tenantForm.planId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - INR {p.monthlyPrice}/mo
                      </option>
                    ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-600">Subscription Status</span>
                <select
                  value={tenantForm.subscriptionStatus}
                  onChange={(e) =>
                    setTenantForm({ ...tenantForm, subscriptionStatus: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">Trial ends</span>
                  <input
                    type="date"
                    value={tenantForm.trialEndsAt}
                    onChange={(e) => setTenantForm({ ...tenantForm, trialEndsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-semibold text-slate-600">Subscription ends</span>
                  <input
                    type="date"
                    value={tenantForm.subscriptionEndsAt}
                    onChange={(e) =>
                      setTenantForm({ ...tenantForm, subscriptionEndsAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-600">Admin note</span>
                <input
                  value={tenantForm.notes}
                  onChange={(e) => setTenantForm({ ...tenantForm, notes: e.target.value })}
                  placeholder="Reason for change..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <p className="font-bold text-slate-700">Users ({tenantUsers.length})</p>
                {tenantUsers.length === 0 ? (
                  <p className="text-slate-400">No users linked</p>
                ) : (
                  tenantUsers.map((u) => (
                    <div
                      key={u.id}
                      className="bg-white border border-slate-200 rounded-lg p-2.5 space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-slate-500">{u.email}</p>
                      <p className="text-slate-500">
                        {u.mobile || '—'}
                        {u.whatsapp ? ` · WA ${u.whatsapp}` : ''}
                      </p>
                      <p className="text-slate-500">
                        {[u.city, u.state, u.country].filter(Boolean).join(', ') || 'No address'}
                        {u.designation ? ` · ${u.designation}` : ''}
                      </p>
                      <p className="text-slate-400">
                        {u.role}
                        {u.lastLoginAt
                          ? ` · Last login ${new Date(u.lastLoginAt).toLocaleDateString()}`
                          : ' · Never logged in'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                disabled={savingTenant}
                onClick={() => saveTenant()}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {savingTenant ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                disabled={savingTenant}
                onClick={() => saveTenant({ activateUsers: true })}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl"
              >
                Activate Login
              </button>
              <button
                disabled={savingTenant}
                onClick={() => {
                  if (confirm('Block all users of this business from logging in?')) {
                    saveTenant({ deactivateUsers: true, subscriptionStatus: 'CANCELED' });
                  }
                }}
                className="px-4 py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl"
              >
                Suspend Business
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package create/edit modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={savePlan}
            className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">
                {planModal === 'create' ? 'Create Package' : 'Edit Package'}
              </h2>
              <button type="button" onClick={() => setPlanModal(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="col-span-2 space-y-1">
                <span className="font-semibold">Name</span>
                <input
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </label>
              {planModal === 'create' && (
                <label className="col-span-2 space-y-1">
                  <span className="font-semibold">Code (unique)</span>
                  <input
                    required
                    value={planForm.code}
                    onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
                    placeholder="basic_pro"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
              )}
              <label className="col-span-2 space-y-1">
                <span className="font-semibold">Description</span>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  rows={2}
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Monthly INR</span>
                <input
                  type="number"
                  value={planForm.monthlyPrice}
                  onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold">Yearly INR</span>
                <input
                  type="number"
                  value={planForm.yearlyPrice}
                  onChange={(e) => setPlanForm({ ...planForm, yearlyPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </label>
              {(
                [
                  ['maxInvoices', 'Max Invoices (-1 = unlimited)'],
                  ['maxProducts', 'Max Products'],
                  ['maxUsers', 'Max Users'],
                  ['maxCustomers', 'Max Customers'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-1">
                  <span className="font-semibold">{label}</span>
                  <input
                    type="number"
                    value={(planForm as any)[key]}
                    onChange={(e) => setPlanForm({ ...planForm, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              {(
                [
                  ['hasInventory', 'Inventory'],
                  ['hasAdvancedReports', 'Advanced Reports'],
                  ['hasMultipleBranches', 'Multi Branch'],
                  ['isActive', 'Active'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(planForm as any)[key]}
                    onChange={(e) => setPlanForm({ ...planForm, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanModal(null)}
                className="px-4 py-2 text-xs rounded-xl border"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPlan}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white disabled:opacity-50"
              >
                {savingPlan ? 'Saving...' : 'Save Package'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

