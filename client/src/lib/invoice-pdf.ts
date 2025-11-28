import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Invoice, Customer } from "@shared/schema";

const formatCurrency = (value: number) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 });

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
  const formattedLaborCost = formatCurrency(invoice.labor_cost);

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
          <p style="margin: 0; color: #666; font-size: 12px; font-weight: bold;">Status: ${
            invoice.status?.toUpperCase() || "DRAFT"
          }</p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <p style="margin: 0 0 8px 0; color: #333; font-weight: bold;">Work Performed</p>
        <p style="margin: 0; color: #666;">${invoice.workPerformed || "Service performed"}</p>
        ${invoice.description ? `<p style=\"margin: 10px 0 0 0; color: #666;\">${invoice.description}</p>` : ""}
      </div>

      <div style="padding: 20px; background: #f3f4f6; border-radius: 6px; text-align: center; margin-bottom: 30px;">
        <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">Amount Due: $${formattedLaborCost}</p>
      </div>

      <div style="margin-top: 40px; padding: 20px; background: #f3f4f6; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 13px; font-weight: bold;">Payment Methods</h3>
        <div style="font-size: 11px; color: #666; line-height: 1.6;">
          <p style="margin: 5px 0;"><strong>Cash:</strong> Payment accepted at time of service</p>
          <p style="margin: 5px 0;"><strong>Zelle:</strong> Send payment to ferde.estime@yahoo.com</p>
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
