import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";

const DEFAULT_API_BASE_URL = "https://hvac-management-api.onrender.com";
const apiBase = import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

function publicGet(path: string) {
  return axios.get(`${apiBase}${path}`).then((r) => r.data);
}

function publicPost(path: string, body: unknown) {
  return axios.post(`${apiBase}${path}`, body).then((r) => r.data);
}

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [signed, setSigned] = useState(false);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["sign", token],
    queryFn: () => publicGet(`/api/sign/${token}`),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (signature: string) =>
      publicPost(`/api/sign/${token}/signature`, { signature }),
    onSuccess: () => setSigned(true),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">Loading invoice…</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800">Link Not Found</h1>
          <p className="text-gray-500 text-sm">
            This signing link is invalid or has expired. Please contact FerdAir LLC for a new link.
          </p>
          <p className="text-sm text-gray-400">Phone: 561-577-5327</p>
        </div>
      </div>
    );
  }

  if (signed || invoice.already_signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-gray-800">Invoice Signed</h1>
          <p className="text-gray-600">
            Thank you, <strong>{invoice.customer_name}</strong>! Your signature has been recorded for
            Invoice #{invoice.invoice_number}.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            FerdAir LLC · 561-577-5327 · ferde.estime@yahoo.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <img
            src="/ferdair-logo.png"
            alt="FerdAir LLC"
            className="h-16 mx-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <h1 className="text-2xl font-bold text-gray-800">FERDAIR LLC</h1>
          <p className="text-sm text-gray-500">AIR CONDITIONING, HEATING & COOLING</p>
        </div>

        {/* Invoice summary */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Invoice</p>
              <p className="font-bold text-gray-800 text-lg">#{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
              <p className="font-medium text-gray-700">{invoice.date}</p>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
            <p className="font-semibold text-gray-800">{invoice.customer_name}</p>
          </div>

          {invoice.work_performed && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Work Performed</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{invoice.work_performed}</p>
            </div>
          )}

          {invoice.description && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{invoice.description}</p>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between items-center">
            <p className="font-bold text-gray-800">Total</p>
            <p className="font-bold text-gray-800 text-xl">${formatCurrency(invoice.labor_cost || invoice.total || 0)}</p>
          </div>
        </div>

        {/* Signature section */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-3">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Authorization to Begin Work</h2>
            <p className="text-sm text-gray-500 mt-1">
              By signing below, you authorize FerdAir LLC to perform the work described above.
            </p>
          </div>

          <SignaturePad
            onSave={(sig) => submitMutation.mutate(sig)}
            isSaving={submitMutation.isPending}
          />

          {submitMutation.isError && (
            <p className="text-sm text-red-500">
              {(submitMutation.error as Error)?.message || "Failed to save signature. Please try again."}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          FerdAir LLC · LICENSED & INSURED CAC1822074 · 451 Oleander Rd Lantana, FL 33462
        </p>
      </div>
    </div>
  );
}
