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


const OWNER_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAADICAYAAADGFbfiAAAQAElEQVR4AeydT+i9T1XHrxWlEZTRInCRgtBSWxQtAn8tJDdRkptwoS1aSIEKoe7MVe5UsEW4UCFoo2SbtEVYoBC5sAhC0NA25aIyqEiisHnd3+d8vudzPmeef3fm+XOf95fnfGbmzJkzZ94zc848z3Pv/X7fRf+EgBAQAkJACCxAQAFkAWhqIgSEgBAQApeLAohWgRDYCgH1KwQOjoACyMEnUOYLASEgBLZCQAFkK+TVrxAQAkLg4AgcOIAcHHmZLwSEgBA4OAIKIAefQJkvBISAENgKAQWQrZBXv0LgwAjIdCEAAgogoCASAkJACAgBBZCtkFe/QuAMCGiMd42AAshdT68GJwSEgBDoh4ACSD9spVkICAEhcNcIKIDsenplnBAQAkJgvwgogOx3bmSZEBACQmDXCCiA7Hp6ZJwQEAJbIaB+xxFQABnHSBJCQAgIASGQIKAAkoAilhAQAkJgQwQ+Vfr+i0K7vxRAdj9FBzVQZgsBIbAEgW+WRu8o9KZCXy2060sBZNfTI+OEgBA4EQIvlbG+tpBdbywZeCXZ56UAss95kVVCQAgIgT8AfALAfGqq1TYAAAAASUVORK5CYII=";

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
  paymentMethod?: string;
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

  const isCreditCard = payload.paymentMethod === "Credit Card";
  const creditCardFee = isCreditCard ? payload.totalAmount * 0.03 : 0;
  const grandTotal = payload.totalAmount + creditCardFee;

  const creditCardFeeBlock = isCreditCard
    ? `<div style="display: flex; justify-content: space-between; font-size: 16px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #ef4444;">
        <span style="font-weight: 700;">Credit Card Processing Fee (3%)</span>
        <span>$${formatCurrency(creditCardFee)}</span>
      </div>`
    : "";

  const totalsBlock = `
    <div style="margin-bottom: 18px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
      ${laborAmountBlock}
      ${creditCardFeeBlock}
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 800; padding-top: 12px;">
        <span>TOTAL</span>
        <span>$${formatCurrency(grandTotal)}</span>
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

  const signatureBlock = `
    <div style="margin-top: 22px;">
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">Signatures</div>
      <div style="display: flex; justify-content: space-between; gap: 40px;">
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
          <div><strong>Credit Card:</strong> Pay securely with any major credit card (3% processing fee applies)</div>
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
    ownerSignature: OWNER_SIGNATURE,
    paymentMethod: invoice.payment_method || undefined,
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
