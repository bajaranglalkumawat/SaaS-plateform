'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Download, CheckCircle2, UserPlus, Calculator } from 'lucide-react';
import { generateInvoicePDF, InvoicePDFData } from '@/lib/pdf-generator';

export default function BillingPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discountType, setDiscountType] = useState('FIXED');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<any[]>([
    { productId: '', productName: '', unit: 'PCS', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 },
  ]);

  const [loading, setLoading] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const [cRes, pRes, bRes] = await Promise.all([
        fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/business', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const cData = await cRes.json();
      const pData = await pRes.json();
      const bData = await bRes.json();

      if (cData.success) setCustomers(cData.data);
      if (pData.success) setProducts(pData.data);
      if (bData.success) setTenant(bData.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const newItems = [...items];
    if (prod) {
      newItems[index] = {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unit: prod.unit,
        quantity: 1,
        unitPrice: prod.sellingPrice,
        discount: prod.discount,
        taxRate: prod.taxRate,
      };
    } else {
      newItems[index].productId = '';
    }
    setItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { productId: '', productName: '', unit: 'PCS', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Live Math Calculations
  const calculatedSubtotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.unitPrice || 0);
    const disc = parseFloat(item.discount || 0);
    return acc + (qty * price - disc);
  }, 0);

  const calculatedTaxTotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.unitPrice || 0);
    const disc = parseFloat(item.discount || 0);
    const taxRate = parseFloat(item.taxRate || 0);
    const sub = qty * price - disc;
    return acc + sub * (taxRate / 100);
  }, 0);

  let extraDiscount = parseFloat(discountAmount as any || 0);
  if (discountType === 'PERCENTAGE') {
    extraDiscount = (calculatedSubtotal * extraDiscount) / 100;
  }

  const grandTotal = Math.max(0, calculatedSubtotal + calculatedTaxTotal - extraDiscount);
  const pendingAmount = Math.max(0, grandTotal - parseFloat(paidAmount as any || 0));

  const handleGenerateInvoice = async () => {
    if (!selectedCustomerId) {
      alert('Please select a customer');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items,
          discountType,
          discountAmount: extraDiscount,
          paidAmount: parseFloat(paidAmount as any || 0),
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessInvoice(data.data);
      } else {
        alert(data.error || 'Failed to generate invoice');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!successInvoice) return;
    const cust = customers.find((c) => c.id === successInvoice.customerId);

    const pdfData: InvoicePDFData = {
      invoiceNumber: successInvoice.invoiceNumber,
      invoiceDate: new Date(successInvoice.invoiceDate).toLocaleDateString(),
      paymentStatus: successInvoice.paymentStatus,
      paymentMethod: successInvoice.paymentMethod,
      subtotal: successInvoice.subtotal,
      discountAmount: successInvoice.discountAmount,
      taxAmount: successInvoice.taxAmount,
      grandTotal: successInvoice.grandTotal,
      paidAmount: successInvoice.paidAmount,
      pendingAmount: successInvoice.pendingAmount,
      notes: successInvoice.notes,
      terms: successInvoice.terms,
      footer: successInvoice.footer,
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
        name: cust?.name || 'Customer',
        mobileNumber: cust?.mobileNumber,
        email: cust?.email,
        address: cust?.address,
        gstin: cust?.gstin,
      },
      items: items.map((i) => ({
        productName: i.productName,
        unit: i.unit,
        quantity: parseFloat(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
        discount: parseFloat(i.discount),
        taxRate: parseFloat(i.taxRate),
        taxAmount: (parseFloat(i.quantity) * parseFloat(i.unitPrice) - parseFloat(i.discount)) * (parseFloat(i.taxRate) / 100),
        totalAmount: (parseFloat(i.quantity) * parseFloat(i.unitPrice) - parseFloat(i.discount)) * (1 + parseFloat(i.taxRate) / 100),
      })),
    };

    const doc = generateInvoicePDF(pdfData);
    doc.save(`Invoice_${successInvoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create New Invoice</h1>
          <p className="text-xs text-slate-500">Issue professional tax invoices with automated GST & stock updates</p>
        </div>
      </div>

      {successInvoice ? (
        /* Success State Banner & PDF Downloader */
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-950">Invoice Generated Successfully!</h2>
          <p className="text-sm text-emerald-800">
            Invoice <span className="font-bold">#{successInvoice.invoiceNumber}</span> has been issued and saved. Stock levels updated.
          </p>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Invoice</span>
            </button>
            <button
              onClick={() => {
                setSuccessInvoice(null);
                setItems([{ productId: '', productName: '', unit: 'PCS', quantity: 1, unitPrice: 0, discount: 0, taxRate: 18 }]);
              }}
              className="px-6 py-2.5 bg-white border border-slate-300 font-semibold text-slate-700 text-sm rounded-xl hover:bg-slate-50 transition-colors"
            >
              Create Another Invoice
            </button>
          </div>
        </div>
      ) : (
        /* Invoice Creation Form */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Customer *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobileNumber || 'No Phone'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / PhonePe / GPay</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Invoice Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="p-3 w-48">Product / Item</th>
                    <th className="p-3 w-16">Unit</th>
                    <th className="p-3 w-20">Qty</th>
                    <th className="p-3 w-24">Price (INR)</th>
                    <th className="p-3 w-20">Tax %</th>
                    <th className="p-3 w-28">Total</th>
                    <th className="p-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">-- Custom Item --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.currentStock})
                            </option>
                          ))}
                        </select>
                        {!item.productId && (
                          <input
                            type="text"
                            placeholder="Enter item name..."
                            value={item.productName}
                            onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                            className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-xs"
                          />
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => updateItem(idx, 'taxRate', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center"
                        />
                      </td>
                      <td className="p-2 font-bold text-slate-900">
                        INR {((item.quantity * item.unitPrice - item.discount) * (1 + item.taxRate / 100)).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeItemRow(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={addItemRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Item</span>
            </button>
          </div>

          {/* Totals Summary Calculation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for customer..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="w-full md:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">INR {calculatedSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax:</span>
                <span className="font-bold text-slate-900">INR {calculatedTaxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Discount (INR):</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 p-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs"
                />
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-brand-600">INR {grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span>Amount Paid Now:</span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 p-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs text-emerald-600"
                />
              </div>
              <div className="flex justify-between text-rose-600 font-bold pt-1">
                <span>Pending Balance:</span>
                <span>INR {pendingAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateInvoice}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing & Issuing Invoice...' : 'Generate & Issue Invoice'}
          </button>
        </div>
      )}
    </div>
  );
}
