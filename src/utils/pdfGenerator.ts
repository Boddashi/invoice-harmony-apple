
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

export interface InvoiceData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  client_name: string;
  user_email: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: string;
    amount: number;
  }>;
  subTotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  currencySymbol: string;
}

export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<string> => {
  // Create a temporary div to render the invoice HTML
  const element = document.createElement('div');
  element.className = 'invoice-pdf-content';
  element.style.width = '210mm';
  element.style.padding = '20mm';
  element.style.backgroundColor = 'white';
  element.style.position = 'fixed';
  element.style.left = '-9999px';
  document.body.appendChild(element);

  // Create invoice HTML content
  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h1 style="font-size: 24px; color: #4a5568; margin-bottom: 5px;">INVOICE</h1>
          <p style="margin: 0; color: #718096;">#${invoiceData.invoice_number}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-weight: bold;">Issue Date: ${new Date(invoiceData.issue_date).toLocaleDateString()}</p>
          <p style="margin: 0; font-weight: bold;">Due Date: ${new Date(invoiceData.due_date).toLocaleDateString()}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="margin-bottom: 5px;">From:</h3>
          <p style="margin: 0;">${invoiceData.user_email}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin-bottom: 5px;">To:</h3>
          <p style="margin: 0;">${invoiceData.client_name}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f7fafc;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">Description</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Quantity</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Unit Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">VAT</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items.map(item => `
            <tr>
              <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${invoiceData.currencySymbol}${item.unit_price.toFixed(2)}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${item.vat_rate}</td>
              <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${invoiceData.currencySymbol}${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between;">
        <div style="width: 60%;">
          ${invoiceData.notes ? `
            <h3 style="margin-bottom: 5px;">Notes:</h3>
            <p style="margin: 0; color: #718096;">${invoiceData.notes}</p>
          ` : ''}
        </div>
        <div style="width: 35%;">
          <div style="background-color: #f7fafc; padding: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Subtotal:</span>
              <span>${invoiceData.currencySymbol}${invoiceData.subTotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Tax:</span>
              <span>${invoiceData.currencySymbol}${invoiceData.taxAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px; padding-top: 5px; border-top: 1px solid #e2e8f0;">
              <span>Total:</span>
              <span>${invoiceData.currencySymbol}${invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Remove the temporary element
    document.body.removeChild(element);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add canvas image to PDF
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save PDF
    const pdfBase64 = pdf.output('datauristring');
    
    // Automatically save the PDF to Supabase storage
    await saveInvoicePDF(invoiceData.id, pdfBase64);
    
    return pdfBase64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const saveInvoicePDF = async (invoiceId: string, pdfBase64: string): Promise<string> => {
  try {
    // Convert data URI to Blob
    const byteString = atob(pdfBase64.split(',')[1]);
    const mimeString = pdfBase64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `invoice-${invoiceId}.pdf`, { type: 'application/pdf' });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(`${invoiceId}/invoice.pdf`, file, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(`${invoiceId}/invoice.pdf`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw error;
  }
};
