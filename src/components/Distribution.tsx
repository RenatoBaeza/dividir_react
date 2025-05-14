import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from '../contexts/AuthContext';
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { List, ListItem } from "@/components/ui/list"

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  owners: string[];
}

interface Receipt {
  _id: string;
  userEmail: string;
  receiptId: string;
  creationDateTime: string;
  placeName: string;
  tipPercent: number;
  items: ReceiptItem[];
  people: string[];
}

interface PersonTotal {
  individual: { [key: string]: number };
  shared: number;
}

interface ValidationResult {
  hasDiscrepancy: boolean;
  receiptTotal?: number;
  personTotalsSum?: number;
  difference?: number;
}

export function Distribution() {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<{ [key: string]: PersonTotal }>({});
  const [validation, setValidation] = useState<ValidationResult>({ hasDiscrepancy: false });
  const { toast } = useToast();

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!user?.email) return;

      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(
          `${apiUrl}/receipts/by_receipt/${receiptId}`,
          {
            headers: {
              'user-email': user.email
            }
          }
        );
        
        if (!response.data) {
          throw new Error('No data received from API');
        }
        
        setReceipt(response.data);
        calculateTotals(response.data);
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError(err instanceof Error ? err.message : "Failed to fetch receipt");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchReceipt();
    }
  }, [receiptId, user]);

  const calculateTotals = (receipt: Receipt) => {
    const newTotals: { [key: string]: PersonTotal } = {};
    
    // Initialize totals for each person with proper structure
    receipt.people.forEach(person => {
      if (!newTotals[person]) {
        newTotals[person] = {
          individual: {},  // Initialize empty object for individual items
          shared: 0
        };
      }
    });
    
    // Calculate totals for each item
    receipt.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTip = itemTotal * receipt.tipPercent;
      const itemTotalWithTip = itemTotal + itemTip;
      
      if (!item.owners || item.owners.length === 0) {
        // If no specific owners, split among all people
        const splitAmount = itemTotalWithTip / receipt.people.length;
        receipt.people.forEach(person => {
          if (!newTotals[person]) {
            newTotals[person] = { individual: {}, shared: 0 };
          }
          newTotals[person].shared += splitAmount;
        });
      } else {
        // Split among specific owners
        const splitAmount = itemTotalWithTip / item.owners.length;
        item.owners.forEach(owner => {
          if (!newTotals[owner]) {
            newTotals[owner] = { individual: {}, shared: 0 };
          }
          if (!newTotals[owner].individual[item.name]) {
            newTotals[owner].individual[item.name] = 0;
          }
          newTotals[owner].individual[item.name] += splitAmount;
        });
      }
    });

    setValidation(validateTotals(receipt, newTotals));
    setTotals(newTotals);
  };

  const calculateReceiptTotals = (receipt: Receipt) => {
    const subtotal = receipt.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    const tipAmount = subtotal * receipt.tipPercent;
    const total = subtotal + tipAmount;
    
    return {
      subtotal,
      tipAmount,
      total
    };
  };

  const validateTotals = (receipt: Receipt, personTotals: { [key: string]: PersonTotal }) => {
    const { total: receiptTotal } = calculateReceiptTotals(receipt);
    
    const personTotalsSum = Object.values(personTotals).reduce((sum, personTotal) => {
      const individualSum = Object.values(personTotal.individual).reduce((a, b) => a + b, 0);
      return sum + individualSum + personTotal.shared;
    }, 0);
    
    const epsilon = 0.01; // 1 cent difference tolerance
    const difference = Math.abs(receiptTotal - personTotalsSum);
    
    if (difference > epsilon) {
      return {
        hasDiscrepancy: true,
        receiptTotal,
        personTotalsSum,
        difference
      };
    }
    
    return { hasDiscrepancy: false };
  };

  const formatDistributionText = () => {
    if (!receipt) return '';

    const { subtotal, tipAmount, total } = calculateReceiptTotals(receipt);
    
    let text = `*${receipt.placeName}*\n\n`;
    text += `Subtotal: ${formatPrice(subtotal)}\n`;
    text += `Propina (${(receipt.tipPercent * 100).toFixed(0)}%): ${formatPrice(tipAmount)}\n`;
    text += `Total: ${formatPrice(total)}\n\n`;
    text += `*Distribución:*\n`;
    
    Object.entries(totals).forEach(([person, total]) => {
      const personTotal = Object.values(total.individual).reduce((a, b) => a + b, 0) + total.shared;
      const personBaseAmount = personTotal / (1 + receipt.tipPercent);
      const personTipAmount = personTotal - personBaseAmount;
      
      text += `\n${person}: ${formatPrice(personBaseAmount)} (+${formatPrice(personTipAmount)}): ${formatPrice(personTotal)}`;
      
      if (Object.keys(total.individual).length > 0) {
        Object.entries(total.individual).forEach(([itemName]) => {
          const personItems = receipt.items.filter(i => 
            i.name === itemName && 
            i.owners.includes(person)
          );
          
          personItems.forEach(item => {
            const itemAmount = (item.quantity * item.unitPrice * (1 + receipt.tipPercent)) / item.owners.length;
            const itemBaseAmount = itemAmount / (1 + receipt.tipPercent);
            const itemTipAmount = itemAmount - itemBaseAmount;
            
            text += `\n${item.name} ${formatPrice(itemBaseAmount)} (+${formatPrice(itemTipAmount)}): ${formatPrice(itemAmount)}`;
          });
        });
      }
      
      if (total.shared > 0) {
        const sharedBase = total.shared / (1 + receipt.tipPercent);
        const sharedTip = total.shared - sharedBase;
        text += `\nItems compartidos: ${formatPrice(sharedBase)} + ${formatPrice(sharedTip)} propina = ${formatPrice(total.shared)}`;
      }
      text += '\n';
    });
    text += '\n_Creado en dividir.cl_';
    
    return text;
  };

  const shareViaWhatsApp = () => {
    try {
      const text = formatDistributionText();
      const encodedText = encodeURIComponent(text);
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      
      // Open in new window with proper attributes
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      // Fallback if window.open is blocked
      if (!newWindow) {
        window.location.href = whatsappUrl;
      }
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast({
        variant: "destructive",
        title: "Error al compartir",
        description: "No se pudo abrir WhatsApp. Intenta copiar al portapapeles.",
      });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">Cargando distribución...</p>
    </div>
  );
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!receipt) return <div className="text-center">Boleta no encontrada</div>;

  return (
    <div className="container mx-auto py-6 pb-24">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/receipts/${receiptId}`)}
            className="flex items-center gap-2"
          >
            🔙
          </Button>
          <h1 className="text-2xl font-bold">
            {receipt.placeName}
          </h1>
          <span className="text-md text-gray-800">
            {receipt.tipPercent * 100}% de propina
          </span>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          {(() => {
            const { subtotal, tipAmount, total } = calculateReceiptTotals(receipt);
            return (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Propina:</span>
                  <span>{formatPrice(tipAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total con propina:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </>
            );
          })()}
        </div>

        {validation.hasDiscrepancy && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex items-center">
              <span className="text-yellow-700">⚠️ Advertencia: Discrepancia en los totales</span>
            </div>
            <p className="text-sm text-yellow-700">
              Total de la cuenta: {formatPrice(validation.receiptTotal || 0)}<br />
              Suma de distribución: {formatPrice(validation.personTotalsSum || 0)}<br />
              Diferencia: {formatPrice(validation.difference || 0)}
            </p>
            <p className="text-xs text-yellow-600 mt-2">
              Esta discrepancia podría deberse a redondeos o errores de cálculo.
              Por favor, revisa la distribución de los items.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(totals).map(([person, total]) => (
          <Card key={person}>
            <CardHeader>
              <CardTitle>{person}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <List className="space-y-4">
                  {Object.entries(total.individual).map(([itemName]) => {
                    const personItems = receipt.items.filter(i => 
                      i.name === itemName && 
                      i.owners.includes(person)
                    );
                    
                    return personItems.map((item) => {
                      const itemAmount = (item.quantity * item.unitPrice * (1 + receipt.tipPercent)) / item.owners.length;
                      const itemBaseAmount = itemAmount / (1 + receipt.tipPercent);
                      const itemTipAmount = itemAmount - itemBaseAmount;
                      
                      const sharedParts = item.owners.length > 1 
                        ? `(${1}/${item.owners.length} partes)` 
                        : '';
                      
                      return (
                        <ListItem key={item.id}>
                          <div className="flex justify-between font-medium">
                            <span className="flex-1 flex items-center gap-2">
                              {item.name} 
                              <span className="text-sm text-muted-foreground">{sharedParts}</span>
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Base {formatPrice(itemBaseAmount)}
                              {receipt.tipPercent > 0 && (
                                <span> (propina {formatPrice(itemTipAmount)})</span>
                              )}
                            </span>
                            <span className="font-medium">{formatPrice(itemAmount)}</span>
                          </div>
                        </ListItem>
                      );
                    });
                  })}
                </List>

                {total.shared > 0 && (
                  <div className="space-y-2">
                    <h3>Monto Compartido {receipt.people.length > 1 && 
                      <span className="text-sm text-muted-foreground">(1/{receipt.people.length} partes)</span>
                    }</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Base {formatPrice(total.shared / (1 + receipt.tipPercent))}
                          {receipt.tipPercent > 0 && (
                            <span> (propina {formatPrice(total.shared - (total.shared / (1 + receipt.tipPercent)))})</span>
                          )}
                        </span>
                        <span className="font-medium">{formatPrice(total.shared)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total con propina</span>
                    <span>
                      {formatPrice(Object.values(total.individual).reduce((a, b) => a + b, 0) + total.shared)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
        <div className="container mx-auto flex flex-col sm:flex-row justify-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              try {
                const text = formatDistributionText();
                await navigator.clipboard.writeText(text);
                toast({
                  title: "Copiado al portapapeles",
                  description: "El detalle de la distribución ha sido copiado",
                });
              } catch (error) {
                toast({
                  variant: "destructive",
                  title: "Error al copiar",
                  description: "No se pudo copiar al portapapeles",
                });
              }
            }}
            className="w-full sm:w-[200px] bg-black text-white hover:shadow-glow"
          >
            📋 Copiar al Portapapeles
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={shareViaWhatsApp}
            className="w-full sm:w-[200px] bg-black text-white hover:shadow-glow"
          >
            📱 Enviar por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
} 