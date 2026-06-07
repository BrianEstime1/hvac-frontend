import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { SignaturePad } from "@/components/SignaturePad";

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

export default function SignQuotePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [signed, setSigned] = useState(false);

  const { data: quote, isLoading, error } = useQuery({
    queryKey: ["sign-quote", token],
    queryFn: () => publicGet(`/api/sign-quote/${token}`),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (signature: string) =>
      publicPost(`/api/sign-quote/${token}/signature`, { signature }),
    onSuccess: () => setSigned(true),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">Loading quote&hellip;</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center space-y-3">
          <div className="text-4xl">&#9888;&#65039;</div>
          <h1 className="text-xl font-bold text-gray-800">Link Not Found</h1>
          <p className="text-gray-500 text-sm">
            This signing link is invalid or has expired. Please contact FerdAir LLC for a new link.
          </p>
          <p className="text-sm text-gray-400">Phone: 561-577-5327</p>
        </div>
      </div>
    );
  }

  if (signed || quote.already_signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">&#10003;</div>
          <h1 className="text-2xl font-bold text-gray-800">Quote Accepted</h1>
          <p className="text-gray-600">
            Thank you, <strong>{quote.customer_name}</strong>! Your signature has been recorded.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            FerdAir LLC &middot; 561-577-5327 &middot; ferde.estime@yahoo.com
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
          <p className="text-sm text-gray-500">AIR CONDITIONING, HEATING &amp; COOLING</p>
        </div>

        {/* Quote summary */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Quote</p>
              <p className="font-bold text-gray-800 text-lg">#{quote.id}</p>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Prepared For</p>
            <p className="font-semibold text-gray-800">{quote.customer_name}</p>
          </div>

          {quote.title && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Service</p>
              <p className="text-gray-700 font-medium">{quote.title}</p>
            </div>
          )}

          {quote.description && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Scope of Work</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{quote.description}</p>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between items-center">
            <p className="font-bold text-gray-800">Total</p>
            <p className="font-bold text-gray-800 text-xl">${formatCurrency(quote.total || 0)}</p>
          </div>
        </div>

        {/* Signature section */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-3">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Accept This Quote</h2>
            <p className="text-sm text-gray-500 mt-1">
              By signing below, you accept this quote and authorize FerdAir LLC to proceed with the work described above.
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
          FerdAir LLC &middot; LICENSED &amp; INSURED CAC1822074 &middot; 451 Oleander Rd Lantana, FL 33462
        </p>
      </div>
    </div>
  );
}
