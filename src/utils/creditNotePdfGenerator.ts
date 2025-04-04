
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings } from '@/models/CompanySettings';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Get the Supabase URL from the environment or use the hardcoded value
const SUPABASE_URL = "https://sjwqxbjxjlsdngbldhcq.supabase.co";

export interface CreditNoteData {
  id: string;
  credit_note_number: string;
  issue_date: string;
  client_name: string;
  client_address?: string;
  client_vat?: string;
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

export const generateCreditNotePDF = async (creditNoteData: CreditNoteData): Promise<{ base64: string }> => {
  console.log("Starting PDF generation for credit note:", creditNoteData.credit_note_number);
  
  try {
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
          credit_note_prefix: 'CN',
          logo_url: ''
        };

    console.log("Company settings loaded for PDF:", {
      companyName: companySettings.company_name,
      hasLogo: !!companySettings.logo_url,
    });

    // Generate the HTML content for the PDF
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .logo { max-width: 200px; max-height: 80px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #FF3B30; }
            .info-section { margin-bottom: 20px; }
            .label { font-weight: bold; margin-bottom: 3px; color: #666; }
            .value { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #f8f9fa; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .amount { text-align: right; }
            .total { font-weight: bold; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
            .credit-note-label { color: #FF3B30; font-weight: bold; }
            .negative-amount { color: #FF3B30; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              ${companySettings.logo_url ? `<img src="${companySettings.logo_url}" class="logo" alt="Company Logo">` : ''}
              <div style="margin-top: 10px;">
                <div><strong>${companySettings.company_name || 'Your Company'}</strong></div>
                <div>${companySettings.street || ''} ${companySettings.number || ''} ${companySettings.bus ? ', ' + companySettings.bus : ''}</div>
                <div>${companySettings.postal_code || ''} ${companySettings.city || ''} ${companySettings.country ? ', ' + companySettings.country : ''}</div>
                ${companySettings.vat_number ? `<div>VAT: ${companySettings.vat_number}</div>` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <div class="title">CREDIT NOTE</div>
              <div><strong>Number:</strong> ${creditNoteData.credit_note_number}</div>
              <div><strong>Date:</strong> ${new Date(creditNoteData.issue_date).toLocaleDateString()}</div>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between;">
            <div class="info-section" style="flex: 1;">
              <div class="label">Bill To:</div>
              <div class="value"><strong>${creditNoteData.client_name}</strong></div>
              ${creditNoteData.client_address ? `<div class="value">${creditNoteData.client_address}</div>` : ''}
              ${creditNoteData.client_vat ? `<div class="value">VAT: ${creditNoteData.client_vat}</div>` : ''}
            </div>
            
            <div class="info-section" style="flex: 1; text-align: right;">
              ${companySettings.iban ? `
              <div class="label">Bank Account:</div>
              <div class="value">${companySettings.iban}</div>
              ${companySettings.bank_name ? `<div class="value">${companySettings.bank_name}</div>` : ''}
              ${companySettings.swift ? `<div class="value">BIC/SWIFT: ${companySettings.swift}</div>` : ''}
              ` : ''}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>VAT</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${creditNoteData.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${creditNoteData.currencySymbol}${item.unit_price.toFixed(2)}</td>
                  <td>${item.vat_rate}</td>
                  <td class="amount negative-amount">-${creditNoteData.currencySymbol}${Math.abs(item.amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-left: auto; width: 300px; margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <div>Subtotal:</div>
              <div class="negative-amount">-${creditNoteData.currencySymbol}${Math.abs(creditNoteData.subTotal).toFixed(2)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <div>Tax:</div>
              <div class="negative-amount">-${creditNoteData.currencySymbol}${Math.abs(creditNoteData.taxAmount || 0).toFixed(2)}</div>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #ddd; font-weight: bold;">
              <div>Total:</div>
              <div class="negative-amount">-${creditNoteData.currencySymbol}${Math.abs(creditNoteData.total).toFixed(2)}</div>
            </div>
          </div>
          
          ${creditNoteData.notes ? `
          <div style="margin-top: 30px;">
            <div class="label">Notes:</div>
            <div class="value">${creditNoteData.notes}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>This is a credit note for services or goods previously invoiced.</p>
            ${companySettings.terms_and_conditions_url ? `
            <p><a href="${companySettings.terms_and_conditions_url}" target="_blank">View our Terms and Conditions</a></p>
            ` : ''}
            <p>${companySettings.company_name || 'Your Company'} - ${companySettings.company_email || ''} ${companySettings.company_phone ? '- ' + companySettings.company_phone : ''}</p>
          </div>
        </body>
      </html>
    `;

    console.log("Generating PDF locally using html2canvas and jsPDF");
    
    // Create a temporary DOM element to render the HTML
    const element = document.createElement('div');
    element.className = 'credit-note-pdf';
    element.style.width = '210mm';
    element.style.padding = '20mm';
    element.style.backgroundColor = 'white';
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.innerHTML = html;
    document.body.appendChild(element);
    
    try {
      // Render the HTML to canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      // Remove the element from the DOM
      document.body.removeChild(element);
      
      // Create a PDF from the canvas
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Add more pages if content is too long
      let heightLeft = imgHeight - pageHeight;
      let position = -pageHeight;
      
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
      }
      
      // Get the PDF as a base64 string
      const pdfBase64 = pdf.output('datauristring');
      
      console.log("PDF generated successfully with size:", pdfBase64.length);
      
      // Save the PDF to storage
      await saveCreditNotePDF(creditNoteData.id, pdfBase64);
      
      return { base64: pdfBase64 };
    } catch (error: any) {
      console.error("Error generating PDF with html2canvas:", error);
      toast.error(`PDF generation failed locally: ${error.message}`);
      
      // Fallback to server-side PDF generation
      console.log("Falling back to server-side PDF generation");
      
      if (!SUPABASE_URL) {
        console.error("Failed to get Supabase URL");
        throw new Error("Missing Supabase URL configuration");
      }

      try {
        // Call the Supabase edge function to generate the PDF
        const response = await supabase.functions.invoke("generate-pdf", {
          body: { 
            html, 
            documentId: creditNoteData.id,
            documentType: "credit-note"
          }
        });

        if (!response.data || response.error) {
          console.error("Error response from generate-pdf function:", response.error);
          toast.error(`Failed to generate PDF: ${response.error?.message || 'Unknown error'}`);
          throw new Error(`Failed to generate PDF: ${response.error?.message || 'Unknown error'}`);
        }

        const pdfResult = response.data;

        if (!pdfResult?.base64) {
          console.error("Missing PDF data in response:", pdfResult);
          toast.error('Failed to generate PDF: No base64 data returned');
          throw new Error('Failed to generate PDF: No base64 data returned');
        }

        console.log("PDF generated successfully with server-side generation");
        
        // After generating the PDF, save it to the credit_notes bucket
        await saveCreditNotePDF(creditNoteData.id, pdfResult.base64);
        
        // Return the base64 data
        return { base64: pdfResult.base64 };
      } catch (serverError: any) {
        console.error('Error calling generate-pdf function:', serverError);
        toast.error(`Server-side PDF generation failed: ${serverError.message || 'Unknown error'}`);
        throw serverError;
      }
    }
  } catch (error: any) {
    console.error('Error generating credit note PDF:', error);
    toast.error(`PDF generation failed: ${error.message || 'Unknown error'}`);
    throw error;
  }
};

export const saveCreditNotePDF = async (creditNoteId: string, pdfBase64: string): Promise<void> => {
  try {
    console.log(`Saving PDF for credit note ${creditNoteId} to storage...`);
    
    const base64Data = pdfBase64.split(',')[1];
    if (!base64Data) {
      throw new Error("Invalid base64 data format");
    }
    
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    const sliceSize = 1024;
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
    const file = new File([blob], `credit-note-${creditNoteId}.pdf`, { type: 'application/pdf' });
    
    console.log(`Created PDF file, size: ${file.size} bytes`);

    // Upload to the credit_notes bucket
    const { data, error } = await supabase.storage
      .from('credit_notes')
      .upload(`${creditNoteId}/credit-note.pdf`, file, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading PDF to storage:', error);
      throw error;
    }

    console.log("PDF uploaded successfully:", data);

    // Get the public URL for the uploaded PDF
    const { data: urlData } = supabase.storage
      .from('credit_notes')
      .getPublicUrl(`${creditNoteId}/credit-note.pdf`);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Failed to get public URL for the PDF");
    }
    
    // Update the credit note record with just the status
    // Don't try to update the pdf_url since it doesn't exist in the schema
    const { error: updateError } = await supabase
      .from('credit_notes')
      .update({ 
        status: 'pending' 
      })
      .eq('id', creditNoteId);

    if (updateError) {
      console.error('Error updating credit note record:', updateError);
      throw updateError;
    }

    console.log("Credit note record updated to pending status");
  } catch (error: any) {
    console.error('Error saving credit note PDF:', error);
    throw error;
  }
};
