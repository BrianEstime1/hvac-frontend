import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Invoice, Customer, Quote } from "@shared/schema";

const BRAND_INFO = {
  name: "FERDAIR LLC",
  services: "AIR CONDITIONING, HEATING & COOLING",
  tagline: "RESIDENTIAL & COMMERCIAL SERVICES",
  license: "LICENSED & INSURED — CAC1822074",
  phone: "Phone: 561-577-5327",
  email: "Email: ferde.estime@yahoo.com",
};

/** Format number as currency */
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
  workDescription: string;
  totalAmount: number;
  includeRequiredStatement?: boolean;
  requiredStatement?: string;
  paymentTerms?: string;
  signatureImage?: string;
}

const buildHeader = () => `
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="/ferdair-logo.png" alt="FerdAir" style="height: 72px; object-fit: contain; margin-bottom: 12px;" />
    <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.02em;">${BRAND_INFO.name}</div>
    <div style="font-size: 16px; font-weight: 600;">${BRAND_INFO.services}</div>
    <div style="font-size: 15px; font-weight: 600;">${BRAND_INFO.tagline}</div>
    <div style="font-size: 14px; margin-top: 4px;">${BRAND_INFO.license}</div>
    <div style="font-size: 14px;">${BRAND_INFO.phone}</div>
    <div style="font-size: 14px;">${BRAND_INFO.email}</div>
  </div>
`;

function buildDocumentHTML(type: DocumentType, payload: DocumentPayload) {
  const title = type === "invoice" ? "INVOICE" : "QUOTE";
  const requiredStatementBlock =
    type === "quote" && payload.includeRequiredStatement
      ? `<div style="margin-bottom: 18px;">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">Required Statement</div>
          <div style="font-size: 15px; line-height: 1.7;">${
            payload.requiredStatement ||
            "Quote includes all the work shown on the worksheet attached with this quote."
          }</div>
        </div>`
      : "";

  const paymentTermsBlock =
    type === "quote" && payload.paymentTerms
      ? `<div style="margin-bottom: 18px;">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">Payment Terms</div>
          <div style="font-size: 15px; line-height: 1.7;">${payload.paymentTerms}</div>
        </div>`
      : "";

  const signatureBlock = `
    <div style="margin-top: 24px;">
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">Signature</div>
      <div style="height: 72px; display: flex; align-items: center;">
        ${payload.signatureImage ? `<img src="${payload.signatureImage}" style="height: 64px; object-fit: contain;" />` : ""}
      </div>
      <div style="border-top: 1px solid #0f172a; width: 280px; margin-top: 8px; padding-top: 6px; font-size: 15px;">Ferde Estime<br/>FerdAir LLC</div>
    </div>
  `;

  return `
    <div style="padding: 48px; background: #fff; color: #0f172a; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 15px; line-height: 1.7; max-width: 850px; margin: 0 auto;">
      ${buildHeader()}

      <div style="text-align: center; margin-bottom: 18px;">
        <div style="font-size: 24px; font-weight: 800; letter-spacing: 0.08em;">${title}</div>
        <div style="display: flex; justify-content: center; gap: 24px; font-size: 15px; margin-top: 8px;">
          <span><strong>${payload.numberLabel}:</strong> ${payload.documentNumber}</span>
          <span><strong>Date:</strong> ${payload.date}</span>
        </div>
      </div>

      <div style="margin-bottom: 18px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Bill To</div>
        <div style="font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${payload.billToName}<br/>${payload.billToAddress || ""}</div>
      </div>

      <div style="margin-bottom: 18px;">
        <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Scope of Work / Description</div>
        <div style="font-size: 15px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; white-space: pre-wrap;">${payload.workDescription}</div>
      </div>

      <div style="margin-bottom: 18px; text-align: center; padding: 18px; border-radius: 14px; background: #e0f2fe; color: #0ea5e9;">
        <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.04em;">TOTAL: $${formatCurrency(payload.totalAmount)}</div>
      </div>

      ${requiredStatementBlock}
      ${paymentTermsBlock}
      ${signatureBlock}

      <div style="margin-top: 24px; padding: 16px; border-radius: 12px; background: #f8fafc;">
        <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Payment Methods</div>
        <div style="font-size: 15px; line-height: 1.6;">
          <div><strong>Cash:</strong> Payment at time of service</div>
          <div><strong>Zelle:</strong> ferde.estime@yahoo.com</div>
          <div><strong>Check:</strong> Payable to FERDAIR LLC</div>
        </div>
      </div>
    </div>
  `;
}

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
    scale: 3,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const imgWidth = 210; // PDF width
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
  pdf.save(`${fileName}.pdf`);
}

export function createInvoiceHTML(
  invoice: Invoice,
  customer: Customer | undefined
) {
  const payload: DocumentPayload = {
    id: invoice.id,
    numberLabel: "Invoice #",
    documentNumber: invoice.invoiceNumber || `INV-${invoice.id}`,
    date: invoice.date,
    billToName: customer?.name || "",
    billToAddress: customer?.address || "",
    workDescription:
      invoice.workPerformed || (invoice as any).work_performed || invoice.description || "",
    totalAmount: invoice.total ?? invoice.subtotal ?? invoice.labor_cost ?? 0,
    includeRequiredStatement: false,
    requiredStatement: "",
    paymentTerms: undefined,
  };

  return buildDocumentHTML("invoice", payload);
}

export function createQuoteHTML(quote: Quote) {
  const payload: DocumentPayload = {
    id: quote.id,
    numberLabel: "Quote #",
    documentNumber: quote.quoteNumber,
    date: quote.date,
    billToName: quote.billToName,
    billToAddress: quote.billToAddress,
    workDescription: quote.workDescription,
    totalAmount: quote.totalAmount,
    includeRequiredStatement: quote.includeRequiredStatement,
    requiredStatement: quote.requiredStatement,
    paymentTerms: quote.paymentTerms,
    signatureImage: quote.signatureImage,
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
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
  pdf.save(`${fileName}.pdf`);
}
