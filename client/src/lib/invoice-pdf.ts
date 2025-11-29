import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Invoice, Customer } from "@shared/schema";

/** Format number as currency */
const formatCurrency = (value: number) =>
  Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Generates the PDF file using html2canvas + jsPDF */
export async function generateInvoicePDF(
  invoice: Invoice,
  customer: Customer | undefined,
  fileName: string
) {
  const element = document.getElementById(
    `invoice-content-${invoice.id}`
  ) as HTMLElement;

  if (!element) {
    console.error("Invoice HTML container not found.");
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 210; // PDF width
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  pdf.save(`${fileName}.pdf`);
}

/** Builds the HTML content that gets rendered into the PDF */
export function createInvoiceHTML(
  invoice: Invoice,
  customer: Customer | undefined
) {
  // Correct values from backend
  const formattedTotal = formatCurrency(invoice.total || 0);
  const formattedSubtotal = formatCurrency(invoice.subtotal || 0);
  const formattedTax = formatCurrency(invoice.tax || 0);

  // Work performed safe fallback
  const workPerformed =
    invoice.workPerformed ||
    invoice.work_performed ||
    "Service performed";

  return `
    <div style="padding: 40px; background: white; color: #000; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.7;">
    
      <!-- Header -->
      <div style="margin-bottom: 40px;">
        <h1 style="margin: 0; color: #2563eb;">INVOICE</h1>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">FerdAir Manager</p>
      </div>

      <!-- From / Bill To -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <p style="margin: 0; font-weight: bold;">From:</p>
          <p style="margin: 5px 0; color: #666;">FerdAir</p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">
            Professional HVAC Services
          </p>
        </div>

        <div>
          <p style="margin: 0; font-weight: bold;">Bill To:</p>
          <p style="margin: 5px 0; color: #333;">${customer?.name || "Unknown Customer"}</p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">${customer?.email || ""}</p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">${customer?.phone || ""}</p>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; background: #f3f4f6; padding: 20px;">
        <p style="margin: 0; color: #666; font-size: 12px;">Invoice #${invoice.id}</p>
        <p style="margin: 0; color: #666; font-size: 12px;">Date: ${invoice.date}</p>
        <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">
          Status: ${(invoice.status || "draft").toUpperCase()}
        </p>
      </div>

      <!-- Work Performed -->
      <div style="margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; color: #333; font-weight: bold;">Work Performed</p>
        <p style="margin: 0; color: #444; white-space: pre-wrap; word-break: break-word; font-size: 15px; line-height: 1.8;">${workPerformed}</p>

        ${
          invoice.description
            ? `<p style="margin: 10px 0 0 0; color: #666;">${invoice.description}</p>`
            : ""
        }
      </div>

      <!-- Total Section -->
      <div style="padding: 20px; background: #f3f4f6; border-radius: 6px; text-align: center; margin-bottom: 30px;">
        <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
          Amount Due: $${formattedTotal}
        </p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">
          Subtotal: $${formattedSubtotal} | Tax: $${formattedTax}
        </p>
      </div>

      <!-- Payment Instructions -->
      <div style="margin-top: 40px; padding: 20px; background: #f3f4f6; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 13px; font-weight: bold;">Payment Methods</h3>
        <div style="font-size: 11px; color: #666; line-height: 1.6;">
          <p><strong>Cash:</strong> Payment at time of service</p>
          <p><strong>Zelle:</strong> ferde.estime@yahoo.com</p>
          <p><strong>Check:</strong> Make payable to FERDAIR LLC</p>
          <p style="margin-top: 10px;">Please reference Invoice #${invoice.id}</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 11px;">
        <p style="margin: 5px 0;">Thank you for your business!</p>
        <p style="margin: 5px 0;">
          For questions, email Ferde.Estime@yahoo.com or call (561) 577-5327.
        </p>
      </div>

    </div>
  `;
}
