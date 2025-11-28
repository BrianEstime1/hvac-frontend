import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Invoice, Customer } from "@shared/schema";

export async function generateInvoicePDF(
  invoice: Invoice,
  customer: Customer | undefined,
  fileName: string
) {
  const canvas = await html2canvas(
    document.getElementById(`invoice-content-${invoice.id}`) as HTMLElement,
    {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    }
  );

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 210; // A4 width
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  pdf.save(`${fileName}.pdf`);
}

export function createInvoiceHTML(
  invoice: Invoice,
  customer: Customer | undefined
) {
  return `
    <div style="padding: 40px; background: white; color: #000;">
      <div style="margin-bottom: 40px;">
        <h1 style="margin: 0; color: #2563eb;">INVOICE</h1>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">FerdAir Manager</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <p style="margin: 0; font-weight: bold;">From:</p>
          <p style="margin: 5px 0; color: #666;">FerdAir</p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">Professional HVAC Services</p>
        </div>
        <div>
          <p style="margin: 0; font-weight: bold;">Bill To:</p>
          <p style="margin: 5px 0; color: #333;">${customer?.name || "Unknown Customer"}</p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">${customer?.email || ""}</p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">${customer?.phone || ""}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; background: #f3f4f6; padding: 20px;">
        <div>
          <p style="margin: 0; color: #666; font-size: 12px;">Invoice #${invoice.id}</p>
        </div>
        <div>
          <p style="margin: 0; color: #666; font-size: 12px;">Date: ${invoice.date}</p>
        </div>
        <div>
          <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">Status: ${invoice.status?.toUpperCase() || "DRAFT"}</p>
        </div>
      </div>

      <div style="margin-bottom: 40px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #2563eb;">
              <th style="padding: 10px 0; text-align: left; color: #333;">Description</th>
              <th style="padding: 10px 0; text-align: right; color: #333;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 15px 0; color: #333;">${invoice.description || "Invoice"}</td>
              <td style="padding: 15px 0; text-align: right; color: #333;">$${invoice.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="text-align: right; margin-bottom: 40px;">
        <div style="border-top: 2px solid #2563eb; padding-top: 10px; width: 200px; margin-left: auto;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #333; font-weight: bold;">Total:</span>
            <span style="color: #2563eb; font-weight: bold; font-size: 18px;">$${invoice.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 40px; padding: 20px; background: #f3f4f6; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 13px; font-weight: bold;">Payment Methods</h3>
        <div style="font-size: 11px; color: #666; line-height: 1.6;">
          <p style="margin: 5px 0;"><strong>Cash:</strong> Payment accepted at time of service</p>
          <p style="margin: 5px 0;"><strong>Zelle:</strong> Send payment to (561) 577-5327</p>
          <p style="margin: 5px 0;"><strong>Check:</strong> Make checks payable to FERDAIR LLC</p>
          <p style="margin: 10px 0 0 0;">Please reference Invoice #${invoice.id} with your payment.</p>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 11px;">
        <p style="margin: 5px 0;">Thank you for your business!</p>
        <p style="margin: 5px 0;">For questions, please contact us at Ferde.Estime@yahoo.com or call (561) 577-5327.</p>
      </div>
    </div>
  `;
}
