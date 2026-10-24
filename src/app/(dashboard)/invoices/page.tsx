'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Download, Eye, Ban, CreditCard, Filter, FileText } from 'lucide-react';
import { generateInvoicePDF, InvoicePDFData } from '@/lib/pdf-generator';

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter) query.append('status', statusFilter);

      const [invRes, bRes] = await Promise.all([
        fetch(`/api/invoices?${query.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/business', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const invData = await invRes.json();
      const bData = await bRes.json();

      if (invData.success) setInvoices(invData.data);
      if (bData.success) setTenant(bData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleDownloadPDF = (invoice: any) => {
    const pdfData: InvoicePDFData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString(),
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      taxAmount: invoice.taxAmount,
      grandTotal: invoice.grandTotal,
      paidAmount: invoice.paidAmount,
      pendingAmount: invoice.pendingAmount,
      notes: invoice.notes,
      terms: invoice.terms,
      footer: invoice.footer,
      business: {
        businessName: tenant?.businessName || 'Business Name',
        ownerName: tenant?.ownerName,
        email: tenant?.email,
        mobileNumber: tenant?.mobileNumber,
        address: tenant?.address,
        city: tenant?.city,
        state: tenant?.state,
        gstin: tenant?.gstin,
        bankName: tenant?.bankName,
        bankAccountNumber: tenant?.bankAccountNumber,
        ifscCode: tenant?.ifscCode,
        upiId: tenant?.upiId,
      },
      customer: {
        name: invoice.customer?.name || 'Customer',
        mobileNumber: invoice.customer?.mobileNumber,
        email: invoice.customer?.email,
        address: invoice.customer?.address,
        gstin: invoice.customer?.gstin,
      },
      items: invoice.items.map((i: any) => ({
        productName: i.productName,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxRate: i.taxRate,
        taxAmount: i.taxAmount,
        totalAmount: i.totalAmount,
      })),
    };

    const doc = generateInvoicePDF(pdfData);
    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
  };

  const handleCancelInvoice = async (invoiceId: string, invNum: string) => {
    if (!confirm(`Are you sure you want to cancel Invoice #${invNum}? Stock will be automatically restored.`)) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert('Invoice cancelled and stock restored!');
        fetchInvoices();
      } else {
        alert(data.error || 'Failed to cancel invoice');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices & Billing History</h1>
          <p className="text-xs text-slate-500">Search, view, download PDF or record payments for customer invoices</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['', 'PAID', 'UNPAID', 'PARTIALLY_PAID', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'All Status' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Invoice Date</th>
                <th className="p-3.5">Grand Total</th>
                <th className="p-3.5">Paid</th>
                <th className="p-3.5">Pending</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-brand-600">#{inv.invoiceNumber}</td>
                    <td className="p-3.5 font-medium text-slate-900">
                      {inv.customer?.name}
                      {inv.customer?.mobileNumber && (
                        <span className="block text-[10px] text-slate-400">{inv.customer.mobileNumber}</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                    <td className="p-3.5 font-bold text-slate-900">INR {inv.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-emerald-600 font-semibold">INR {inv.paidAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-rose-600 font-semibold">INR {inv.pendingAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : inv.paymentStatus === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-700'
                            : inv.paymentStatus === 'CANCELLED'
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleDownloadPDF(inv)}
                        title="Download PDF"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!inv.isCancelled && (
                        <button
                          onClick={() => handleCancelInvoice(inv.id, inv.invoiceNumber)}
                          title="Cancel Invoice & Restore Stock"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No matching invoices found.
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
