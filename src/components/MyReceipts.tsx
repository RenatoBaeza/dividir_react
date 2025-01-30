import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UploadButton } from './UploadButton';
import { Trash2, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface ReceiptSummary {
  receiptId: string;
  placeName: string;
  creationDateTime: string;
  people: string[];
  items: any[];
  tipPercent: number;
}

const calculateReceiptTotals = (receipt: ReceiptSummary & { items: any[], tipPercent: number }) => {
  const subtotal = receipt.items.reduce((sum, item) => 
    sum + (getNumberValue(item.quantity) * getNumberValue(item.unitPrice)), 0
  );
  const tipAmount = subtotal * receipt.tipPercent;
  return subtotal + tipAmount;
};

const getNumberValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (value?.$numberInt) return parseInt(value.$numberInt);
  if (value?.$numberDouble) return parseFloat(value.$numberDouble);
  return 0;
};

export function MyReceipts() {
  const [receipts, setReceipts] = useState<ReceiptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  const { user } = useAuth();
  const userEmail = user?.email;
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDelete = async (receiptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReceiptToDelete(receiptId);
  };

  const confirmDelete = async () => {
    if (!userEmail || !receiptToDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/receipts/${receiptToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'user-email': userEmail
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete receipt');
      }

      setReceipts(receipts.filter(receipt => receipt.receiptId !== receiptToDelete));
      toast({
        title: "Success",
        description: "Receipt deleted successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete receipt',
      });
    } finally {
      setReceiptToDelete(null);
    }
  };
  useEffect(() => {
    const fetchReceipts = async () => {
      if (!userEmail) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/receipts/by_user/${encodeURIComponent(userEmail)}`,
          {
            headers: {
              'user-email': userEmail
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch receipts');
        }

        const data = await response.json();
        setReceipts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="space-y-3">
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
          <Skeleton className="h-[125px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6 relative min-h-screen pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">📄 Mis cuentas</h1>
        <div className="hidden md:block">
          <UploadButton />
        </div>
      </div>

      {receipts.length === 0 ? (
        <Card className="flex flex-col items-center text-center p-8 space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <CardContent className="space-y-2">
            <h3 className="text-xl font-semibold">No tienes cuentas</h3>
            <p className="text-muted-foreground">
              Comienza subiendo una foto de tu primera cuenta para dividirla con tus amigos.
            </p>
            <div className="pt-4">
              <UploadButton />
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receipts.map((receipt) => (
              <Card 
                key={receipt.receiptId}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(`/receipts/${receipt.receiptId}`)}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{receipt.placeName}</CardTitle>
                  <button
                    onClick={(e) => handleDelete(receipt.receiptId, e)}
                    className="h-8 w-8 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground rounded-full"
                    aria-label="Delete receipt"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Fecha:</span>
                      <span>{new Date(receipt.creationDateTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Personas:</span>
                      <span>{receipt.people.length}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total con propina:</span>
                      <span>${formatCurrency(calculateReceiptTotals(receipt))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Fixed Mobile Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="container mx-auto">
          <UploadButton />
        </div>
      </div>

      <AlertDialog open={receiptToDelete !== null} onOpenChange={() => setReceiptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no puede ser revertida. Esto eliminará permanentemente la cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}