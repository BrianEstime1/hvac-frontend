import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type InvoicePhoto = {
  id: number;
  photo_data: string;
  caption?: string | null;
};

type PhotoGalleryProps = {
  photos: InvoicePhoto[];
  onDelete?: (photo: InvoicePhoto) => void;
  deletingPhotoId?: number | null;
};

export function PhotoGallery({
  photos,
  onDelete,
  deletingPhotoId,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<InvoicePhoto | null>(null);

  if (!photos.length) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        No photos yet. Upload a photo to document the job.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="overflow-hidden rounded-lg border bg-card shadow-sm"
          >
            <button
              type="button"
              className="block w-full"
              onClick={() => setSelectedPhoto(photo)}
              aria-label={photo.caption ? `View ${photo.caption}` : "View photo"}
            >
              <img
                src={photo.photo_data}
                alt={photo.caption || "Invoice photo"}
                className="h-28 w-full object-cover sm:h-32"
                loading="lazy"
              />
            </button>
            <div className="space-y-2 p-2">
              {photo.caption ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {photo.caption}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No caption</p>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-destructive"
                  onClick={() => onDelete(photo)}
                  disabled={deletingPhotoId === photo.id}
                >
                  {deletingPhotoId === photo.id ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedPhoto}
        onOpenChange={(open) => {
          if (!open) setSelectedPhoto(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.caption || "Invoice photo"}</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="flex justify-center">
              <img
                src={selectedPhoto.photo_data}
                alt={selectedPhoto.caption || "Invoice photo"}
                className="max-h-[70vh] w-full rounded-md object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
