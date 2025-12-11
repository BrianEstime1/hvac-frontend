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
  const laborCost =
    apiInvoice.labor_cost ?? apiInvoice.subtotal ?? apiInvoice.total ?? 0;
  const subtotal = apiInvoice.subtotal ?? laborCost;
  const total = apiInvoice.total ?? subtotal;

  return {
    id: apiInvoice.id,
    customerId: apiInvoice.customer_id,
    customerName: apiInvoice.customer_name,
    invoiceNumber: apiInvoice.invoice_number,
    date: apiInvoice.date,
    technician: apiInvoice.technician,
    // Support both snake_case and camelCase fields from different backends
    workPerformed:
      apiInvoice.work_performed ||
      apiInvoice.workPerformed ||
      apiInvoice.work_description ||
      "",
    labor_cost: laborCost,
    materials_cost: apiInvoice.materials_cost,
    subtotal,
    tax: apiInvoice.tax,
    total,
    description:
      apiInvoice.description ||
      apiInvoice.work_description ||
      apiInvoice.workPerformed ||
      "",
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
  const customerId = apiQuote.customer_id ?? apiQuote.customerId ?? 0;
  const fallbackName = customerId ? `Customer #${customerId}` : "Customer #";
  return {
    id: apiQuote.id,
    customerId,
    customerName:
      apiQuote.customer_name || apiQuote.customerName || fallbackName || "",
    customerAddress: apiQuote.customer_address || apiQuote.customerAddress || "",
    title: apiQuote.title || apiQuote.quote_title || "",
    description: apiQuote.description || apiQuote.details || "",
    total: Number(apiQuote.total ?? apiQuote.total_amount ?? 0),
    status: apiQuote.status || "",
    createdAt: apiQuote.created_at || apiQuote.createdAt || "",
    quoteNumber: apiQuote.quote_number || apiQuote.quoteNumber || undefined,
  };
}
