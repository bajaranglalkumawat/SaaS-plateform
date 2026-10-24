import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Table } from 'jspdf-autotable';

export interface InvoicePDFData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
  notes?: string;
  terms?: string;
  footer?: string;
  business: {
    businessName: string;
    ownerName?: string;
    email?: string;
    mobileNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
    pan?: string;
    bankName?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  customer: {
    name: string;
    mobileNumber?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
  };
  items: Array<{
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
  }>;
}

export function generateInvoicePDF(data: InvoicePDFData): jsPDF {
  const doc = new jsPDF();
  const primaryColor = [12, 140, 233]; // Brand Blue (#0c8ce9)

  // 1. Header & Title Banner
  doc.setFillColor(12, 140, 233);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.business.businessName.toUpperCase(), 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('TAX INVOICE', 196, 18, { align: 'right' });
  doc.text(`#${data.invoiceNumber}`, 196, 25, { align: 'right' });

  let y = 40;

  // 2. Business & Customer Info Grid
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);

  // Business Details (Left Column)
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED FROM:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let bY = y + 5;
  if (data.business.ownerName) { doc.text(data.business.ownerName, 14, bY); bY += 4; }
  if (data.business.address) { doc.text(`${data.business.address}, ${data.business.city || ''} ${data.business.state || ''}`, 14, bY); bY += 4; }
  if (data.business.mobileNumber) { doc.text(`Phone: ${data.business.mobileNumber}`, 14, bY); bY += 4; }
  if (data.business.email) { doc.text(`Email: ${data.business.email}`, 14, bY); bY += 4; }
  if (data.business.gstin) { doc.text(`GSTIN: ${data.business.gstin}`, 14, bY); bY += 4; }

  // Customer Details (Right Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILLED TO:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let cY = y + 5;
  doc.text(data.customer.name, 120, cY); cY += 4;
  if (data.customer.address) { doc.text(`${data.customer.address}, ${data.customer.city || ''} ${data.customer.state || ''}`, 120, cY); cY += 4; }
  if (data.customer.mobileNumber) { doc.text(`Phone: ${data.customer.mobileNumber}`, 120, cY); cY += 4; }
  if (data.customer.gstin) { doc.text(`GSTIN: ${data.customer.gstin}`, 120, cY); cY += 4; }

  y = Math.max(bY, cY) + 6;

  // Invoice Dates & Payment Status Strip
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 12, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.invoiceDate}`, 30, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.text(`Status:`, 90, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.paymentStatus}`, 105, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.text(`Method:`, 150, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.paymentMethod}`, 166, y + 8);

  y += 18;

  // 3. Product Table
  const tableHead = [['#', 'Item & Description', 'Unit Price', 'Qty', 'Tax %', 'Tax Amt', 'Total (INR)']];
  const tableRows = data.items.map((item, idx) => [
    idx + 1,
    item.productName,
    `INR ${item.unitPrice.toFixed(2)}`,
    `${item.quantity} ${item.unit}`,
    `${item.taxRate}%`,
    `INR ${item.taxAmount.toFixed(2)}`,
    `INR ${item.totalAmount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [12, 140, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 18 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25, halign: 'right' },
    },
  });

  const lastTable = (doc as jsPDF & { getLastAutoTable: () => Table | null }).getLastAutoTable();
  y = (lastTable?.finalY ?? y) + 10;

  // 4. Totals Summary Box
  const summaryX = 120;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text('Subtotal:', summaryX, y);
  doc.text(`INR ${data.subtotal.toFixed(2)}`, 196, y, { align: 'right' });
  y += 5;

  if (data.discountAmount > 0) {
    doc.text('Discount:', summaryX, y);
    doc.text(`- INR ${data.discountAmount.toFixed(2)}`, 196, y, { align: 'right' });
    y += 5;
  }

  doc.text('GST / Tax:', summaryX, y);
  doc.text(`+ INR ${data.taxAmount.toFixed(2)}`, 196, y, { align: 'right' });
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Grand Total:', summaryX, y);
  doc.text(`INR ${data.grandTotal.toFixed(2)}`, 196, y, { align: 'right' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Paid Amount:', summaryX, y);
  doc.text(`INR ${data.paidAmount.toFixed(2)}`, 196, y, { align: 'right' });
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('Pending Balance:', summaryX, y);
  doc.text(`INR ${data.pendingAmount.toFixed(2)}`, 196, y, { align: 'right' });

  // 5. Bank & Payment Details (Bottom Left)
  if (data.business.bankName || data.business.upiId) {
    const bankY = y - 20;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BANK & PAYMENT DETAILS', 14, bankY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let lineY = bankY + 4;
    if (data.business.bankName) { doc.text(`Bank Name: ${data.business.bankName}`, 14, lineY); lineY += 4; }
    if (data.business.bankAccountNumber) { doc.text(`Account No: ${data.business.bankAccountNumber}`, 14, lineY); lineY += 4; }
    if (data.business.ifscCode) { doc.text(`IFSC Code: ${data.business.ifscCode}`, 14, lineY); lineY += 4; }
    if (data.business.upiId) { doc.text(`UPI ID: ${data.business.upiId}`, 14, lineY); lineY += 4; }
  }

  // 6. Footer Terms
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(data.terms || 'Thank you for your business!', 105, 280, { align: 'center' });
  doc.text(data.footer || 'This is a computer generated document.', 105, 285, { align: 'center' });

  return doc;
}
