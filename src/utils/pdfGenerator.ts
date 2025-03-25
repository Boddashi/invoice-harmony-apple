import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings } from '@/models/CompanySettings';

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
  console.log("Starting PDF generation for invoice:", invoiceData.invoice_number);
  
  const { data: companyData } = await supabase
    .from('company_settings')
    .select('*')
    .single();
    
  const companySettings: CompanySettings = companyData 
    ? {
        ...companyData,
        invoice_number_type: (companyData.invoice_number_type as string === "date" || 
                              companyData.invoice_number_type as string === "incremental") 
                              ? (companyData.invoice_number_type as "date" | "incremental") 
                              : "incremental"
      }
    : {
        company_name: '',
        company_email: '',
        company_phone: '',
        company_website: '',
        vat_number: '',
        default_currency: 'USD',
        street: '',
        number: '',
        bus: '',
        postal_code: '',
        city: '',
        country: '',
        bank_name: '',
        account_number: '',
        swift: '',
        iban: '',
        invoice_prefix: '',
        invoice_number_type: 'incremental',
        logo_url: ''
      };

  console.log("Company settings loaded for PDF:", {
    companyName: companySettings.company_name,
    hasLogo: !!companySettings.logo_url,
  });

  const element = document.createElement('div');
  element.className = 'invoice-pdf-content';
  element.style.width = '210mm';
  element.style.padding = '20mm';
  element.style.backgroundColor = 'white';
  element.style.position = 'fixed';
  element.style.left = '-9999px';
  element.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(element);

  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="flex: 1;">
          ${companySettings.logo_url ? `
            <img src="${companySettings.logo_url}" alt="Company Logo" style="max-width: 200px; max-height: 80px; margin-bottom: 20px;">
          ` : ''}
          <h1 style="font-size: 28px; color: #1a1f2c; margin: 0 0 5px 0;">${companySettings.company_name || ''}</h1>
          <div style="color: #8e9196; font-size: 14px;">
            ${companySettings.street ? `${companySettings.street} ${companySettings.number || ''} ${companySettings.bus || ''}<br>` : ''}
            ${companySettings.postal_code || ''} ${companySettings.city || ''} ${companySettings.country ? `, ${companySettings.country}` : ''}<br>
            ${companySettings.company_phone ? `Phone: ${companySettings.company_phone}<br>` : ''}
            ${companySettings.company_email ? `Email: ${companySettings.company_email}<br>` : ''}
            ${companySettings.company_website ? `Website: ${companySettings.company_website}<br>` : ''}
            ${companySettings.vat_number ? `VAT: ${companySettings.vat_number}` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 40px; color: #e5e7eb; font-weight: bold; margin-bottom: 20px;">INVOICE</div>
          <div style="color: #8e9196; font-size: 14px;">
            <div style="margin-bottom: 5px;">
              <strong>Invoice Number:</strong><br>
              #${invoiceData.invoice_number}
            </div>
            <div style="margin-bottom: 5px;">
              <strong>Issue Date:</strong><br>
              ${new Date(invoiceData.issue_date).toLocaleDateString()}
            </div>
            <div>
              <strong>Due Date:</strong><br>
              ${new Date(invoiceData.due_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
        <div>
          <h3 style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase;">From</h3>
          <div style="font-size: 14px;">
            <strong>${companySettings.company_name || ''}</strong>
            ${companySettings.bank_name ? `
              <div style="margin-top: 10px;">
                <strong>Bank Details:</strong><br>
                Bank: ${companySettings.bank_name}<br>
                ${companySettings.account_number ? `Account: ${companySettings.account_number}<br>` : ''}
                ${companySettings.iban ? `IBAN: ${companySettings.iban}<br>` : ''}
                ${companySettings.swift ? `SWIFT: ${companySettings.swift}` : ''}
              </div>
            ` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h3 style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase;">Bill To</h3>
          <div style="font-size: 14px;">
            <strong>${invoiceData.client_name}</strong><br>
            ${invoiceData.user_email}
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Description</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Unit Price</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">VAT</th>
            <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items.map(item => `
            <tr>
              <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${invoiceData.currencySymbol}${item.unit_price.toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.vat_rate}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${invoiceData.currencySymbol}${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between;">
        <div style="width: 60%;">
          ${invoiceData.notes ? `
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase;">Notes</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${invoiceData.notes}</p>
            </div>
          ` : ''}
        </div>
        <div style="width: 35%;">
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Subtotal:</span>
              <span>${invoiceData.currencySymbol}${invoiceData.subTotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Tax:</span>
              <span>${invoiceData.currencySymbol}${invoiceData.taxAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #e5e7eb;">
              <span>Total:</span>
              <span>${invoiceData.currencySymbol}${invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    console.log("Rendering PDF content to canvas");
    // Improved quality settings for html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Increased from 1.25 to 2 for higher resolution
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#ffffff",
      imageTimeout: 0, // No timeout for images
      foreignObjectRendering: true // Enable this for better text rendering
    });

    document.body.removeChild(element);

    console.log("Creating PDF document");
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Optimize the quality vs size ratio by adjusting jpeg quality
    const imgData = canvas.toDataURL('image/jpeg', 0.8); // Increased quality from 0.5 to 0.8
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

    // Get PDF size and optimize if needed
    const pdfBase64 = pdf.output('datauristring');
    const pdfSizeInBytes = Math.ceil((pdfBase64.length * 3) / 4);
    console.log(`Generated PDF size: ${Math.round(pdfSizeInBytes / 1024)} KB`);
    
    // If PDF is too large (>3.5MB), create a more compressed version
    if (pdfSizeInBytes > 3.5 * 1024 * 1024) {
      console.log("PDF is too large, generating a more compressed version");
      const compressedImgData = canvas.toDataURL('image/jpeg', 0.6); // Reduce quality
      pdf.deletePage(1);
      pdf.addImage(compressedImgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      const compressedPdfBase64 = pdf.output('datauristring');
      console.log(`Compressed PDF size: ${Math.round(compressedPdfBase64.length * 3 / 4 / 1024)} KB`);
      return compressedPdfBase64;
    }
    
    console.log("PDF generated successfully, saving to storage...");
    const pdfUrl = await saveInvoicePDF(invoiceData.id, pdfBase64);
    console.log("PDF saved to storage with URL:", pdfUrl);
    
    return pdfBase64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const saveInvoicePDF = async (invoiceId: string, pdfBase64: string): Promise<string> => {
  try {
    console.log(`Saving PDF for invoice ${invoiceId}...`);
    
    const base64Data = pdfBase64.split(',')[1];
    if (!base64Data) {
      throw new Error("Invalid base64 data format");
    }
    
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    const sliceSize = 1024; // Adjusted slice size for better memory performance
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'application/pdf' });
    const file = new File([blob], `invoice-${invoiceId}.pdf`, { type: 'application/pdf' });
    
    console.log(`Created PDF file, size: ${file.size} bytes`);

    // Check if invoices bucket exists, if not, we'll see an error in the logs
    const { data: buckets } = await supabase.storage.listBuckets();
    const invoicesBucketExists = buckets?.some(bucket => bucket.name === 'invoices');
    
    if (!invoicesBucketExists) {
      console.warn("Invoices bucket doesn't exist. Using default public bucket.");
    }

    const { data, error } = await supabase.storage
      .from('invoices')
      .upload(`${invoiceId}/invoice.pdf`, file, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading PDF to storage:', error);
      throw error;
    }

    console.log("PDF uploaded successfully:", data);

    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(`${invoiceId}/invoice.pdf`);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Failed to get public URL for the uploaded PDF");
    }
    
    console.log("PDF public URL:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw error;
  }
};

export const generateReportPDF = async (report: { title: string; type: string; data: any }): Promise<string> => {
  const element = document.createElement('div');
  element.className = 'report-pdf-content';
  element.style.width = '210mm';
  element.style.padding = '20mm';
  element.style.backgroundColor = 'white';
  element.style.position = 'fixed';
  element.style.left = '-9999px';
  document.body.appendChild(element);

  let chartContent = '';
  switch (report.type) {
    case 'monthly':
      chartContent = `
        <div class="chart-section">
          <h3>Revenue Data</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Period</th>
                <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${report.data.map((item: any) => `
                <tr>
                  <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">${item.period}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      break;
    case 'status':
      chartContent = `
        <div class="chart-section">
          <h3>Invoice Status Distribution</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Status</th>
                <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Count</th>
                <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${report.data.map((item: any) => `
                <tr>
                  <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.value}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${(item.percent * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      break;
    case 'client':
      chartContent = `
        <div class="chart-section">
          <h3>Top Clients by Revenue</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Client</th>
                <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${report.data.map((item: any) => `
                <tr>
                  <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      break;
    case 'item':
      chartContent = `
        <div class="chart-section">
          <h3>Items Analysis</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
                <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Revenue</th>
                <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Count</th>
              </tr>
            </thead>
            <tbody>
              ${report.data.map((item: any) => `
                <tr>
                  <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">$${item.amount.toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">${item.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      break;
  }

  element.innerHTML = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="font-size: 24px; color: #1a1f2c; margin: 0;">${report.title}</h1>
        <p style="color: #6b7280; margin: 10px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      ${chartContent}
    </div>
  `;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    document.body.removeChild(element);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    return pdf.output('datauristring');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

