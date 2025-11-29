// Utility to transform snake_case API responses to camelCase for frontend

export function transformAppointmentFromAPI(apiAppointment: any): any {
  return {
    id: apiAppointment.id,
    customerId: apiAppointment.customer_id,
    customerName: apiAppointment.customer_name,
    date: apiAppointment.appointment_date,
    time: apiAppointment.appointment_time,
    description: apiAppointment.notes || apiAppointment.service_type,
    status: apiAppointment.status,
  };
}

export function transformInvoiceFromAPI(apiInvoice: any): any {
  return {
    id: apiInvoice.id,
    customerId: apiInvoice.customer_id,
    customerName: apiInvoice.customer_name,
    invoiceNumber: apiInvoice.invoice_number,
    date: apiInvoice.date,
    technician: apiInvoice.technician,
    workPerformed: apiInvoice.work_performed,
    labor_cost: apiInvoice.labor_cost ?? apiInvoice.total ?? 0,
    materials_cost: apiInvoice.materials_cost,
    subtotal: apiInvoice.subtotal,
    tax: apiInvoice.tax,
    total: apiInvoice.total,
    description: apiInvoice.description,
    status: apiInvoice.status,
  };
}

export function transformCustomerFromAPI(apiCustomer: any): any {
  return {
    id: apiCustomer.id,
    name: apiCustomer.name,
    email: apiCustomer.email || "",
    phone: apiCustomer.phone,
    address: apiCustomer.address || "",
  };
}

export function transformInventoryFromAPI(apiItem: any): any {
  return {
    id: apiItem.id,
    name: apiItem.name,
    quantity: apiItem.quantity,
    category: apiItem.category,
    price: apiItem.cost_per_unit ?? apiItem.price,
  };
}

export function transformQuoteFromAPI(apiQuote: any): any {
  return {
    id: apiQuote.id,
    quoteNumber: apiQuote.quote_number || apiQuote.quoteNumber,
    date: apiQuote.date,
    billToName: apiQuote.bill_to_name || apiQuote.billToName,
    billToAddress: apiQuote.bill_to_address || apiQuote.billToAddress,
    workDescription: apiQuote.work_description || apiQuote.workDescription,
    totalAmount: apiQuote.total_amount ?? apiQuote.totalAmount,
    paymentTerms: apiQuote.payment_terms || apiQuote.paymentTerms,
    requiredStatement: apiQuote.required_statement || apiQuote.requiredStatement,
    includeRequiredStatement:
      apiQuote.include_required_statement ?? apiQuote.includeRequiredStatement,
    signatureImage: apiQuote.signature_image || apiQuote.signatureImage,
    convertedInvoiceId: apiQuote.converted_invoice_id || apiQuote.convertedInvoiceId,
  };
}
