import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Boxes,
  Users,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-500/30">
            S
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">BillFlow SaaS</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/25 transition-all"
          >
            Start Free Trial
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-brand-400 text-xs font-bold shadow-xl">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Production-Ready Multi-Tenant Billing Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Commercial SaaS Billing & <br />
          <span className="bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
            Business Management System
          </span>
        </h1>

        <p className="text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Complete multi-tenant solution for business owners to generate professional GST invoices, track stock inventory, manage customer debt, monitor expenses and scale subscriptions.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm rounded-xl shadow-xl shadow-brand-500/30 flex items-center justify-center gap-2 transition-all"
          >
            <span>Activate 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm rounded-xl border border-slate-800 transition-colors"
          >
            Demo Sign In
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16 relative z-10 border-t border-slate-900">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl font-bold text-white">Built for Commercial Scaling</h2>
          <p className="text-xs text-slate-400">Everything business sellers need in one unified platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <ShieldCheck className="w-8 h-8 text-brand-400" />
            <h3 className="text-base font-bold text-white">Strict Multi-Tenant Isolation</h3>
            <p className="text-xs text-slate-400">
              Every business gets complete database isolation via tenant key protection. Business A never accesses Business B.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <Receipt className="w-8 h-8 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Professional PDF Invoicing</h3>
            <p className="text-xs text-slate-400">
              Generate clean GST invoices with business logos, custom serials, bank account details and payment QR codes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <Boxes className="w-8 h-8 text-purple-400" />
            <h3 className="text-base font-bold text-white">Inventory & Stock Deduction</h3>
            <p className="text-xs text-slate-400">
              Stock automatically decreases upon sales and increases on returns with full movement audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© 2026 BillFlow SaaS Platform. All rights reserved. Commercial Billing Architecture.</p>
      </footer>
    </div>
  );
}
