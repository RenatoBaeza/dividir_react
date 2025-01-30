// src/components/ui/loading-modal.tsx
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

interface LoadingModalProps {
  open: boolean;
  message?: string;
}

export function LoadingModal({ open, message = "Subiendo boleta..." }: LoadingModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Loading Status</DialogTitle>
          </VisuallyHidden>
          <DialogDescription>
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-center text-sm text-muted-foreground">
                {message}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}