import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Invoice, Customer, Quote } from "@shared/schema";

const BRAND_INFO = {
  name: "FERDAIR LLC",
  services: "AIR CONDITIONING, HEATING & COOLING",
  tagline: "RESIDENTIAL & COMMERCIAL SERVICES",
  license: "LICENSED & INSURED — CAC1822074",
  address: "451 Oleander Rd Lantana, FL 33462",
  phone: "Phone: 561-577-5327",
  email: "Email: ferde.estime@yahoo.com",
};


const OWNER_SIGNATURE = "data:image/png;base64,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";

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type DocumentType = "invoice" | "quote";

interface DocumentPayload {
  id: number;
  numberLabel: string;
  documentNumber: string;
  date: string;
  billToName: string;
  billToAddress: string;
  title?: string;
  description?: string;
  secondaryTitle?: string;
  secondaryDescription?: string;
  totalAmount: number;
  laborAmount?: number;
  includeRequiredStatement?: boolean;
  requiredStatement?: string;
  paymentTerms?: string;
  customerSignature?: string;
  ownerSignature?: string;
  extraNote?: string;
}

const buildHeader = () => `
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="/ferdair-logo.png" alt="FerdAir" style="height: 88px; object-fit: contain; margin-bottom: 12px;" />
    <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.02em;">${BRAND_INFO.name}</div>
    <div style="font-size: 18px; font-weight: 700;">${BRAND_INFO.services}</div>
    <div style="font-size: 17px; font-weight: 600;">${BRAND_INFO.tagline}</div>
    <div style="font-size: 16px; margin-top: 6px;">${BRAND_INFO.license}</div>
    <div style="font-size: 16px;">${BRAND_INFO.address}</div>
    <div style="font-size: 16px;">${BRAND_INFO.phone}</div>
    <div style="font-size: 16px;">${BRAND_INFO.email}</div>
  </div>
`;

function buildDocumentHTML(type: DocumentType, payload: DocumentPayload) {
  const title = type === "invoice" ? "INVOICE" : "QUOTE";
  const requiredStatementBlock =
    type === "quote" && payload.includeRequiredStatement
      ? `<div style="margin-bottom: 18px;">
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 6px;">Required Statement</div>
          <div style="font-size: 16px; line-height: 1.75;">${
            payload.requiredStatement ||
            "Quote includes all the work shown on the attached worksheet."
          }</div>
        </div>`
      : "";

  const paymentTermsBlock =
    type === "quote" && payload.paymentTerms
      ? `<div style="margin-bottom: 18px;">
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 6px;">Payment Terms</div>
          <div style="font-size: 16px; line-height: 1.75;">${payload.paymentTerms}</div>
        </div>`
      : "";

  const extraNoteBlock = payload.extraNote
    ? `<div style="margin-top: 12px; font-size: 16px; line-height: 1.75;">${payload.extraNote}</div>`
    : "";

  const laborAmountBlock =
    payload.laborAmount !== undefined
      ? `<div style="display: flex; justify-content: space-between; font-size: 16px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="font-weight: 700;">Labor/Materials</span>
          <span>$${formatCurrency(payload.laborAmount)}</span>
        </div>`
      : "";

  const totalsBlock = `
    <div style="margin-bottom: 18px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
      ${laborAmountBlock}
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 800; padding-top: 12px;">
        <span>TOTAL</span>
        <span>$${formatCurrency(payload.totalAmount)}</span>
      </div>
    </div>`;

  const titleBlock = payload.title
    ? `<div style="font-size: 18px; font-weight: 700; margin-bottom: 6px;">${payload.title}</div>`
    : "";

  const descriptionBlock = payload.description
    ? `<div style="margin-bottom: 12px;">
        ${titleBlock}
        <div style="font-size: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; white-space: pre-wrap;">${payload.description}</div>
      </div>`
    : "";

  const secondaryBlock = payload.secondaryDescription
    ? `<div style="margin-bottom: 12px;">
        ${payload.secondaryTitle ? `<div style="font-size: 18px; font-weight: 700; margin-bottom: 6px;">${payload.secondaryTitle}</div>` : ""}
        <div style="font-size: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; white-space: pre-wrap;">${payload.secondaryDescription}</div>
      </div>`
    : "";

  // Dual signature block - Owner on left, Customer on right
  const signatureBlock = `
    <div style="margin-top: 22px;">
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Signatures</div>
      <div style="display: flex; justify-content: space-between; gap: 40px;">
        <!-- Owner/Technician Signature (Left) -->
        <div style="flex: 1;">
          <div style="height: 80px; display: flex; align-items: flex-end; justify-content: flex-start;">
            ${payload.ownerSignature ? `<img src="${payload.ownerSignature}" style="height: 72px; object-fit: contain;" />` : ""}
          </div>
          <div style="border-top: 1px solid #0f172a; margin-top: 10px; padding-top: 8px; font-size: 14px;">
            <div style="font-weight: 700;">Ferde Estime</div>
            <div>FerdAir LLC</div>
            <div style="font-style: italic; color: #64748b; margin-top: 4px;">Technician Signature</div>
          </div>
        </div>
        
        <!-- Customer Signature (Right) -->
        <div style="flex: 1;">
          <div style="height: 80px; display: flex; align-items: flex-end; justify-content: flex-start;">
            ${payload.customerSignature ? `<img src="${payload.customerSignature}" style="height: 72px; object-fit: contain;" />` : ""}
          </div>
          <div style="border-top: 1px solid #0f172a; margin-top: 10px; padding-top: 8px; font-size: 14px;">
            <div style="font-weight: 700;">${payload.billToName || "Customer"}</div>
            <div style="font-style: italic; color: #64748b; margin-top: 4px;">Customer Signature – Authorization to Begin Work</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return `
    <div style="padding: 32px 40px 72px; background: #fff; color: #0f172a; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 16px; line-height: 1.8; max-width: 850px; margin: 0 auto; box-sizing: border-box;">
      ${buildHeader()}

      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 26px; font-weight: 800; letter-spacing: 0.08em;">${title}</div>
        <div style="display: flex; justify-content: center; gap: 24px; font-size: 16px; margin-top: 10px;">
          <span><strong>${payload.numberLabel}:</strong> ${payload.documentNumber}</span>
          <span><strong>Date:</strong> ${payload.date}</span>
        </div>
      </div>

      <div style="margin-bottom: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc;">
        <div style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Bill To</div>
        <div style="font-size: 16px; line-height: 1.8; white-space: pre-wrap;">${payload.billToName}<br/>${payload.billToAddress || ""}</div>
      </div>

      ${descriptionBlock}
      ${secondaryBlock}

      ${totalsBlock}

      ${requiredStatementBlock}
      ${paymentTermsBlock}
      ${signatureBlock}

      <div style="margin-top: 16px; padding: 16px; border-radius: 12px; background: #f8fafc;">
        <div style="font-size: 18px; font-weight: 800; margin-bottom: 6px;">Payment Methods</div>
        <div style="font-size: 16px; line-height: 1.7;">
          <div><strong>Cash:</strong> Payment at time of service</div>
          <div><strong>Zelle:</strong> ferde.estime@yahoo.com</div>
          <div><strong>Check:</strong> Payable to FERDAIR LLC</div>
          <div><strong>Credit Card:</strong> Pay securely with any major credit card</div>
        </div>
        ${extraNoteBlock}
      </div>
    </div>
  `;
}

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
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollY: -window.scrollY,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let imgWidth = pageWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > pageHeight) {
    imgHeight = pageHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const xOffset = (pageWidth - imgWidth) / 2;

  pdf.addImage(imgData, "PNG", xOffset, 0, imgWidth, imgHeight, undefined, "FAST");
  pdf.save(`${fileName}.pdf`);
}

export function createInvoiceHTML(
  invoice: Invoice,
  customer: Customer | undefined
) {
  const laborAmount =
    invoice.labor_cost ?? invoice.subtotal ?? invoice.total ?? 0;

  const payload: DocumentPayload = {
    id: invoice.id,
    numberLabel: "Invoice #",
    documentNumber: invoice.invoiceNumber || `INV-${invoice.id}`,
    date: invoice.date,
    billToName: customer?.name || invoice.customerName || "",
    billToAddress: customer?.address || "",
    title: "Work to be Performed",
    description:
      invoice.workPerformed || (invoice as any).work_performed || "",
    secondaryTitle: "Description of Work Performed",
    secondaryDescription:
      invoice.description || (invoice as any).description || "",
    totalAmount: laborAmount,
    laborAmount,
    includeRequiredStatement: false,
    requiredStatement: "",
    paymentTerms: undefined,
    customerSignature: invoice.customer_signature || undefined,
    ownerSignature: OWNER_SIGNATURE, // Always include owner signature
  };

  return buildDocumentHTML("invoice", payload);
}

export function createQuoteHTML(quote: Quote) {
  const payload: DocumentPayload = {
    id: quote.id,
    numberLabel: "Quote #",
    documentNumber: quote.quoteNumber || `Q-${quote.id}`,
    date: quote.createdAt || new Date().toISOString().split("T")[0],
    billToName: quote.customerName || `Customer #${quote.customerId}`,
    billToAddress: quote.customerAddress || "",
    title: quote.title || "Quote Details",
    description: quote.description || "",
    totalAmount: Number(quote.total || 0),
    includeRequiredStatement: true,
    requiredStatement: "Quote includes all the work shown on the attached worksheet.",
    paymentTerms: quote.status ? `Status: ${quote.status}` : undefined,
    customerSignature: undefined,
    ownerSignature: OWNER_SIGNATURE,
    extraNote: "Quote includes all the work shown on the attached worksheet.",
  };

  return buildDocumentHTML("quote", payload);
}

export async function generateQuotePDF(quote: Quote, fileName: string) {
  const element = document.getElementById(
    `quote-content-${quote.id}`
  ) as HTMLElement;

  if (!element) {
    console.error("Quote HTML container not found.");
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
    scrollY: -window.scrollY,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let imgWidth = pageWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > pageHeight) {
    imgHeight = pageHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const xOffset = (pageWidth - imgWidth) / 2;

  pdf.addImage(imgData, "PNG", xOffset, 0, imgWidth, imgHeight, undefined, "FAST");
  pdf.save(`${fileName}.pdf`);
}
