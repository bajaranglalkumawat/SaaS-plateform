'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const [pRes, bRes] = await Promise.all([
        fetch('/api/subscription/plans'),
        fetch('/api/business', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const pData = await pRes.json();
      const bData = await bRes.json();

      if (pData.success) setPlans(pData.data);
      if (bData.success) setCurrentTenant(bData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (plan: any) => {
    if (plan.monthlyPrice === 0) return;
    setCheckoutLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to initiate Razorpay checkout');
        return;
      }

      // Simulate razorpay verification or fallback
      const verifyRes = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpayOrderId: data.data.orderId,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: 'simulated_sig',
          planId: plan.id,
          billingCycle,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        alert(`Success! Upgraded to ${plan.name}`);
        fetchSubscriptionInfo();
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to Razorpay');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading subscription options...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-100 border border-amber-200 text-amber-900 rounded-full text-xs font-bold">
          <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
          <span>Flexible SaaS Billing Plans</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Scale your business with the right tier
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Upgrade your workspace for unlimited invoices, multi-branch management, advanced reports & stock control.
        </p>

        {/* Toggle Billing Cycle */}
        <div className="pt-2 flex justify-center items-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === 'MONTHLY' ? 'text-slate-900' : 'text-slate-400'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
            className="w-12 h-6 rounded-full bg-slate-900 p-1 flex items-center transition-colors"
          >
            <div
              className={`w-4 h-4 rounded-full bg-brand-500 transition-transform ${
                billingCycle === 'YEARLY' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-xs font-bold ${billingCycle === 'YEARLY' ? 'text-slate-900' : 'text-slate-400'}`}>
            Yearly Billing <span className="text-emerald-600 font-extrabold">(Save 15%)</span>
          </span>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentTenant?.planId === plan.id;
          const price = billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 border flex flex-col justify-between relative transition-all ${
                plan.code === 'pro'
                  ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-xl'
                  : 'border-slate-200 shadow-xs hover:shadow-md'
              }`}
            >
              {plan.code === 'pro' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                </div>

                <div className="py-2 border-y border-slate-100">
                  <span className="text-3xl font-black text-slate-900">INR {price}</span>
                  <span className="text-xs text-slate-400 font-medium"> /{billingCycle.toLowerCase()}</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{plan.maxInvoices === -1 ? 'Unlimited Invoices' : `${plan.maxInvoices} Invoices / month`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{plan.maxProducts === -1 ? 'Unlimited Products' : `${plan.maxProducts} Products Catalog`}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{plan.maxUsers} Staff Account Users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.hasInventory ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Inventory Control & Stock Audit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${plan.hasAdvancedReports ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Advanced Financial & Tax Reports</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold"
                  >
                    Current Plan Active
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgradePlan(plan)}
                    disabled={checkoutLoading}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                      plan.code === 'pro'
                        ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {plan.monthlyPrice === 0 ? 'Free Plan' : 'Upgrade via Razorpay'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
