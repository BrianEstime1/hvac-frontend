import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  isSaving?: boolean;
}

export function SignaturePad({ onSave, isSaving }: SignaturePadProps) {
  const canvasRef = useRef<SignatureCanvas | null>(null);

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;

    if (!canvas || canvas.isEmpty()) return;

    const signatureDataUrl = canvas.getTrimmedCanvas().toDataURL("image/png");
    onSave(signatureDataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Capture the customer signature below to authorize the invoice.
      </div>
      <div className="rounded-lg border bg-muted/40 p-3 shadow-sm">
        <SignatureCanvas
          ref={canvasRef}
          penColor="#0f172a"
          backgroundColor="#f8fafc"
          canvasProps={{
            className:
              "h-64 w-full rounded-md border border-dashed border-muted-foreground/50 bg-background",
          }}
        />
        <Separator className="my-3" />
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={handleClear} type="button">
            Clear
          </Button>
          <Button onClick={handleSave} disabled={isSaving} type="button">
            {isSaving ? "Saving..." : "Save Signature"}
          </Button>
        </div>
      </div>
    </div>
  );
}
