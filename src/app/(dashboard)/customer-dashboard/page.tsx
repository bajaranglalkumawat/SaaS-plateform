'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  Eye,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  invoiceDate: string;
  status: string;
  items?: Array<{ productName: string; quantity: number; unitPrice: number }>;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  invoiceId: string;
  referenceNo?: string;
}

interface CustomerData {
  name: string;
  email: string;
  mobileNumber: string;
  address: string;
  openingBalance: number;
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
}

export default function CustomerDashboard() {
  const { user, tenant } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('accessToken');

        if (!token) {
          setError('Not authenticated');
          return;
        }

        // Fetch customer invoices
        const invoicesRes = await fetch('/api/customers/my-invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!invoicesRes.ok) throw new Error('Failed to fetch invoices');
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.data || []);

        // Fetch customer payments
        const paymentsRes = await fetch('/api/customers/my-payments', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!paymentsRes.ok) throw new Error('Failed to fetch payments');
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.data || []);

        // Fetch customer profile data
        const profileRes = await fetch('/api/customers/my-profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileRes.json();
        setCustomerData(profileData.data);

        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Welcome Back, {customerData?.name}! 👋</h1>
        <p className="text-brand-100 mt-1">Manage your invoices and payments in one place</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Invoices</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {customerData?.totalInvoices || 0}
              </p>
            </div>
            <FileText className="w-12 h-12 text-brand-100 rounded-full p-2.5 bg-brand-50" />
          </div>
        </div>

        {/* Total Amount Paid */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Amount Paid</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ₹{(customerData?.totalPaid || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <CreditCard className="w-12 h-12 text-green-100 rounded-full p-2.5 bg-green-50" />
          </div>
        </div>

        {/* Total Due */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Amount Due</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ₹{(customerData?.totalDue || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-100 rounded-full p-2.5 bg-orange-50" />
          </div>
        </div>

        {/* Account Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Opening Balance</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ₹{(customerData?.openingBalance || 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-100 rounded-full p-2.5 bg-blue-50" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Recent Invoices
            </h2>
          </div>

          {invoices.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <p>No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Invoice #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        ₹{invoice.totalAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === 'PAID'
                              ? 'bg-green-100 text-green-700'
                              : invoice.status === 'PENDING'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowInvoiceModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Recent Payments
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <p>No payments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 5).map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        ₹{payment.amount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{payment.invoiceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                Invoice {selectedInvoice.invoiceNumber}
              </h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Invoice Date</p>
                  <p className="text-slate-900 font-semibold">
                    {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Due Date</p>
                  <p className="text-slate-900 font-semibold">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total Amount</p>
                  <p className="text-slate-900 font-semibold">
                    ₹{selectedInvoice.totalAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Amount Paid</p>
                  <p className="text-slate-900 font-semibold">
                    ₹{selectedInvoice.paidAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Items</p>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                            Product
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="px-3 py-2 text-slate-700">{item.productName}</td>
                            <td className="px-3 py-2 text-right text-slate-700">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-700">
                              ₹{item.unitPrice.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
