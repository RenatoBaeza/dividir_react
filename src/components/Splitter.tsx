import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from '../contexts/AuthContext'; // Replace Clerk with custom auth
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ItemCard,
  ItemCardHeader,
  ItemCardTitle,
  ItemCardContent,
  ItemCardPerson,
} from "@/components/ui/ItemCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/hooks/use-toast";
import "@/styles/animations.css";
import { cn, formatPrice } from "@/lib/utils";
import { Trash2, Split, Pencil, Plus } from "lucide-react";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MongoNumber {
  $numberInt?: string;
  $numberDouble?: string;
}

interface ReceiptItem {
  id: string;
  name: string;
  quantity: number | MongoNumber;
  unitPrice: number | MongoNumber;
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

interface PendingChanges {
  placeName?: string;
  items?: Array<{
    id: string;
    updates: Partial<ReceiptItem> | { deleted: boolean };
  }>;
  newItems?: ReceiptItem[];
  people?: string[];
}

const getNumberValue = (value: number | MongoNumber | undefined): number => {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (value.$numberInt) return parseInt(value.$numberInt);
  if (value.$numberDouble) return parseFloat(value.$numberDouble);
  return 0;
};

export function Splitter() {
  const { toast } = useToast();
  const { user } = useAuth(); // Replace Clerk's useUser
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlaceName, setEditingPlaceName] = useState(false);
  const [editingField, setEditingField] = useState<{
    itemId: string;
    field: "name" | "unitPrice" | "quantity";
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { receiptId } = useParams();
  const [showAddPeopleDialog, setShowAddPeopleDialog] = useState(false);
  const [editingPeople, setEditingPeople] = useState<string[]>([]);
  const [showAddItemsDialog, setShowAddItemsDialog] = useState(false);
  const [newItems, setNewItems] = useState<Array<{ name: string; quantity: number; unitPrice: number }>>([{
    name: '',
    quantity: 1,
    unitPrice: 0
  }]);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingTip, setEditingTip] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  const updateReceipt = async (updates: any) => {
    try {
      // Format the items to match the expected server structure
      const formattedUpdates = {
        ...updates,
        items: updates.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: typeof item.quantity === 'object' ? 
            parseInt(item.quantity.$numberInt || item.quantity.$numberDouble) : 
            item.quantity,
          unitPrice: typeof item.unitPrice === 'object' ? 
            parseFloat(item.unitPrice.$numberDouble || item.unitPrice.$numberInt) : 
            item.unitPrice,
          owners: item.owners
        })),
        tipPercent: typeof updates.tipPercent === 'object' ? 
          parseFloat(updates.tipPercent.$numberDouble || updates.tipPercent.$numberInt) : 
          updates.tipPercent
      };

      console.log('Sending PUT request with formatted data:', JSON.stringify(formattedUpdates, null, 2));
      
      const response = await axios.put(
        `${apiUrl}/receipts/${receiptId}`,
        formattedUpdates,
        {
          headers: {
            'user-email': user?.email || '',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setSelectedReceipt(response.data);
      }
    } catch (error) {
      console.error('Error updating receipt:', error);
      throw error;
    }
  };

  const saveItemEdit = (itemId: string, updates: Partial<ReceiptItem>) => {
    if (!selectedReceipt) return;

    const newReceipt = { ...selectedReceipt };
    const itemIndex = newReceipt.items.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) return;

    const updatedItem = {
      ...newReceipt.items[itemIndex],
      ...updates,
    };

    newReceipt.items[itemIndex] = updatedItem;
    setSelectedReceipt(newReceipt);

    setPendingChanges(prev => ({
      ...prev,
      items: [
        ...(prev.items || []).filter(item => item.id !== itemId),
        { id: itemId, updates }
      ]
    }));
  };

  const savePlaceName = (newName: string) => {
    if (!selectedReceipt) return;

    setSelectedReceipt((prev) =>
      prev ? { ...prev, placeName: newName } : null
    );

    setPendingChanges(prev => ({
      ...prev,
      placeName: newName
    }));

    setEditingPlaceName(false);
  };

  const saveTipPercent = (newTipPercent: number) => {
    if (!selectedReceipt) return;

    const validTip = Math.max(0, Math.min(100, newTipPercent)) / 100;
    
    setSelectedReceipt(prev =>
      prev ? { ...prev, tipPercent: validTip } : null
    );

    setPendingChanges(prev => ({
      ...prev,
      tipPercent: validTip
    }));

    setEditingTip(false);
  };

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!user?.email) return;

      try {
        const userEmail = user.email;
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(
          `${apiUrl}/receipts/by_user/${userEmail}`
        );

        // Find the specific receipt by ID
        const targetReceipt = response.data.find(
          (r: Receipt) => r.receiptId === receiptId || r._id === receiptId
        );

        if (targetReceipt) {
          console.log("Setting selected receipt:", targetReceipt);
          setSelectedReceipt(targetReceipt);
        } else {
          setError("Receipt not found");
        }
      } catch (err) {
        setError("Failed to fetch receipt");
        console.error("Error fetching receipt:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchReceipt();
    }
  }, [user, receiptId]);

  // Add debug logging for selectedReceipt changes
  useEffect(() => {
    console.log("Selected receipt changed:", selectedReceipt);
  }, [selectedReceipt]);

  const handleEdit = (
    itemId: string,
    field: "name" | "unitPrice" | "quantity"
  ) => {
    setEditingField({ itemId, field });
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleEditComplete = (itemId: string, field: string, value: string) => {
    if (!value.trim()) return;

    const updates: Partial<ReceiptItem> = {};
    switch (field) {
      case "name":
        updates.name = value;
        break;
      case "unitPrice":
        updates.unitPrice = parseFloat(value) || 0;
        break;
      case "quantity":
        updates.quantity = parseInt(value) || 1;
        break;
    }

    saveItemEdit(itemId, updates);
    setEditingField(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    itemId: string,
    field: string,
    value: string
  ) => {
    if (e.key === "Enter") {
      handleEditComplete(itemId, field, value);
    } else if (e.key === "Escape") {
      setEditingField(null);
    }
  };

  const handleAddItem = () => {
    setShowAddItemsDialog(true);
  };

  const handleOwnerToggle = async (itemId: string, owner: string) => {
    if (!selectedReceipt) return;

    const newReceipt = { ...selectedReceipt };
    const itemIndex = newReceipt.items.findIndex((i) => i.id === itemId);

    if (itemIndex === -1) return;

    const updatedItem = { ...newReceipt.items[itemIndex] };
    const ownerIndex = updatedItem.owners.indexOf(owner);

    if (ownerIndex === -1) {
      updatedItem.owners.push(owner);
    } else {
      updatedItem.owners.splice(ownerIndex, 1);
    }

    newReceipt.items[itemIndex] = updatedItem;
    setSelectedReceipt(newReceipt);

    // Update pendingChanges to track owner changes
    setPendingChanges(prev => ({
      ...prev,
      items: [
        ...(prev.items || []).filter(item => item.id !== itemId),
        {
          id: itemId,
          updates: {
            ...(prev.items?.find(i => i.id === itemId)?.updates || {}),
            owners: updatedItem.owners
          }
        }
      ]
    }));
  };

  const handleEditPeople = () => {
    setEditingPeople(selectedReceipt?.people || []);
    setShowAddPeopleDialog(true);
  };

  const handleSavePeople = async () => {
    if (!selectedReceipt) return;

    const validPeople = editingPeople.map(p => p.trim()).filter(p => p !== '');
    
    // Get the list of removed people
    const removedPeople = selectedReceipt.people.filter(p => !validPeople.includes(p));
    
    // Create a new receipt with updated people list and cleaned owners lists
    const updatedReceipt = {
      ...selectedReceipt,
      people: validPeople,
      items: selectedReceipt.items.map(item => ({
        ...item,
        // Remove any deleted people from owners lists
        owners: item.owners.filter(owner => !removedPeople.includes(owner))
      }))
    };
    
    try {
      await updateReceipt({
        placeName: updatedReceipt.placeName,
        items: updatedReceipt.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: {
            $numberInt: item.quantity.toString()
          },
          unitPrice: {
            $numberDouble: item.unitPrice.toString()
          },
          owners: item.owners
        })),
        people: validPeople,
        userEmail: updatedReceipt.userEmail,
        receiptId: updatedReceipt.receiptId,
        creationDateTime: updatedReceipt.creationDateTime,
        tipPercent: {
          $numberDouble: updatedReceipt.tipPercent.toString()
        }
      });

      setSelectedReceipt(updatedReceipt);
      setPendingChanges(prev => ({
        ...prev,
        people: validPeople
      }));

      setShowAddPeopleDialog(false);
    } catch (error) {
      console.error("Error updating receipt:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save changes. Please try again."
      });
    }
  };

  const handleAddPerson = () => {
    if (editingPeople.length >= 10) return;
    setEditingPeople([...editingPeople, '']);
  };

  const handlePersonNameChange = (index: number, value: string) => {
    const updated = [...editingPeople];
    updated[index] = value;
    setEditingPeople(updated);
  };

  const handleDeletePerson = (index: number) => {
    const updated = editingPeople.filter((_, i) => i !== index);
    setEditingPeople(updated);
  };

  const handleAddNewItem = () => {
    if (newItems.length >= 10) return;
    setNewItems([...newItems, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleItemChange = (index: number, field: 'name' | 'quantity' | 'unitPrice', value: string) => {
    const updated = [...newItems];
    if (field === 'name') {
      updated[index].name = value;
    } else if (field === 'quantity') {
      updated[index].quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === 'unitPrice') {
      updated[index].unitPrice = Math.max(0, parseFloat(value) || 0);
    }
    setNewItems(updated);
  };

  const handleSaveItems = () => {
    if (!selectedReceipt) return;

    const validItems = newItems.filter(item => item.name.trim() !== '');
    
    const itemsToAdd = validItems.map(item => ({
      id: crypto.randomUUID(),
      name: item.name.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      owners: []
    }));

    const updatedReceipt = {
      ...selectedReceipt,
      items: [...selectedReceipt.items, ...itemsToAdd]
    };
    
    setSelectedReceipt(updatedReceipt);
    setPendingChanges(prev => ({
      ...prev,
      newItems: [...(prev.newItems || []), ...itemsToAdd]
    }));

    setNewItems([{ name: '', quantity: 1, unitPrice: 0 }]);
    setShowAddItemsDialog(false);
  };

  const handleSaveAndNavigate = async () => {
    if (!selectedReceipt) return;

    try {
      // Only make the API call if there are pending changes
      if (Object.keys(pendingChanges).length > 0) {
        await updateReceipt({
          placeName: pendingChanges.placeName || selectedReceipt.placeName,
          items: selectedReceipt.items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: {
              $numberInt: item.quantity.toString()
            },
            unitPrice: {
              $numberDouble: item.unitPrice.toString()
            },
            owners: item.owners
          })),
          people: selectedReceipt.people,
          userEmail: selectedReceipt.userEmail,
          receiptId: selectedReceipt.receiptId,
          creationDateTime: selectedReceipt.creationDateTime,
          tipPercent: {
            $numberDouble: selectedReceipt.tipPercent.toString()
          }
        });

        setPendingChanges({});
      }
      
      // Navigate regardless of whether there were changes
      navigate(`/receipts/${receiptId}/distribution`);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save changes. Please try again."
      });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedReceipt) return;

    const updatedReceipt = {
      ...selectedReceipt,
      items: selectedReceipt.items.filter(item => item.id !== itemId)
    };

    setSelectedReceipt(updatedReceipt);
    setPendingChanges(prev => ({
      ...prev,
      items: [
        ...(prev.items || []).filter(item => item.id !== itemId),
        { id: itemId, updates: { deleted: true } }
      ]
    }));
    setItemToDelete(null);
  };

  const handleDeleteNewItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const handleSplitItem = async (itemId: string) => {
    if (!selectedReceipt) return;

    const item = selectedReceipt.items.find(i => i.id === itemId);
    if (!item) return;

    const quantity = getNumberValue(item.quantity);
    if (quantity <= 1) return;

    // Create new individual items
    const newItems = Array.from({ length: quantity }, () => ({
      id: crypto.randomUUID(),
      name: item.name,
      quantity: 1,
      unitPrice: getNumberValue(item.unitPrice),
      owners: [...item.owners]
    }));

    // Create updated receipt with the original item removed and new items added
    const updatedReceipt = {
      ...selectedReceipt,
      items: [
        ...selectedReceipt.items.filter(i => i.id !== itemId),
        ...newItems
      ]
    };

    try {
      // Update pendingChanges to track both the deletion and new items
      setPendingChanges(prev => ({
        ...prev,
        items: [
          ...(prev.items || []).filter(item => item.id !== itemId),
          { id: itemId, updates: { deleted: true } },
          ...newItems.map(newItem => ({
            id: newItem.id,
            updates: {
              name: newItem.name,
              quantity: newItem.quantity,
              unitPrice: newItem.unitPrice,
              owners: newItem.owners
            }
          }))
        ],
        newItems: [...(prev.newItems || []), ...newItems]
      }));

      // Format the update for the server
      await updateReceipt({
        ...updatedReceipt,
        items: updatedReceipt.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: {
            $numberInt: "1"
          },
          unitPrice: {
            $numberDouble: getNumberValue(item.unitPrice).toString()
          },
          owners: item.owners
        }))
      });

      setSelectedReceipt(updatedReceipt);
      toast({
        title: "Ítem dividido",
        description: `${item.name} fue dividido en ${quantity} ítems individuales.`
      });
    } catch (error) {
      console.error("Error splitting item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo dividir el ítem. Por favor intenta nuevamente."
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Cargando boleta...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 relative min-h-screen pb-20">
      {loading ? (
        <div className="text-center">Cargando boleta...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : !selectedReceipt ? (
        <div className="text-center">Boleta no encontrada</div>
      ) : (
        <>
          <div className="sticky top-0 bg-background z-10 pb-2">
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                🔙
              </Button>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold">
                  {editingPlaceName ? (
                    <Input
                      type="text"
                      defaultValue={selectedReceipt?.placeName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          savePlaceName(e.currentTarget.value);
                        }
                      }}
                      onBlur={(e) => savePlaceName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => setEditingPlaceName(true)}
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded"
                    >
                      {selectedReceipt?.placeName || "Receipt Splitter"}
                    </span>
                  )}
                </h2>
                <div className="text-sm flex items-center gap-1">
                  <span className="text-muted-foreground">Propina:</span>
                  {editingTip ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="w-20 h-6 inline-block"
                      defaultValue={(selectedReceipt?.tipPercent * 100).toFixed(0)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveTipPercent(parseFloat(e.currentTarget.value));
                        }
                      }}
                      onBlur={(e) => saveTipPercent(parseFloat(e.target.value))}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      <span
                        onClick={() => setEditingTip(true)}
                        className="cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded flex items-center gap-1"
                      >
                        {(selectedReceipt?.tipPercent * 100).toFixed(0)}% 
                        <span className="text-xs text-muted-foreground">(Editar✏️)</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>👆</span>
                <span>
                  Selecciona quién compartió cada ítem haciendo click en los nombres debajo de cada uno. 
                  Los ítems sin selección se dividirán entre todos.
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedReceipt?.items.map((item) => (
                  <ItemCard key={item.id}>
                    <ItemCardHeader>
                      <div className="flex justify-between items-start">
                        <ItemCardTitle>
                          {editingField?.itemId === item.id && editingField.field === "name" ? (
                            <Input
                              ref={inputRef}
                              type="text"
                              defaultValue={item.name}
                              onBlur={(e) =>
                                handleEditComplete(item.id, "name", e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleKeyDown(e, item.id, "name", e.currentTarget.value)
                              }
                            />
                          ) : (
                            <span
                              onClick={() => handleEdit(item.id, "name")}
                              className="cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-1 rounded block"
                            >
                              {item.name}
                            </span>
                          )}
                        </ItemCardTitle>
                      </div>
                    </ItemCardHeader>
                    <ItemCardContent className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Precio:</span>
                          {editingField?.itemId === item.id && editingField.field === "unitPrice" ? (
                            <Input
                              ref={inputRef}
                              type="number"
                              step="0.01"
                              defaultValue={getNumberValue(item.unitPrice)}
                              className="w-24"
                              onBlur={(e) =>
                                handleEditComplete(item.id, "unitPrice", e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleKeyDown(e, item.id, "unitPrice", e.currentTarget.value)
                              }
                            />
                          ) : (
                            <span
                              onClick={() => handleEdit(item.id, "unitPrice")}
                              className="cursor-pointer hover:bg-accent hover:text-accent-foreground rounded"
                            >
                              {formatPrice(getNumberValue(item.unitPrice))}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Cantidad:</span>
                          {editingField?.itemId === item.id && editingField.field === "quantity" ? (
                            <Input
                              ref={inputRef}
                              type="number"
                              defaultValue={getNumberValue(item.quantity)}
                              className="w-24"
                              onBlur={(e) =>
                                handleEditComplete(item.id, "quantity", e.target.value)
                              }
                              onKeyDown={(e) =>
                                handleKeyDown(e, item.id, "quantity", e.currentTarget.value)
                              }
                            />
                          ) : (
                            <span
                              onClick={() => handleEdit(item.id, "quantity")}
                              className="cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 rounded"
                            >
                              {getNumberValue(item.quantity)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Total:</span>
                          <span className="font-medium">
                            {formatPrice(getNumberValue(item.quantity) * getNumberValue(item.unitPrice))}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Compartido por</span>
                        </div>

                        {selectedReceipt.people && selectedReceipt.people.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {selectedReceipt.people.map((person) => (
                              <ItemCardPerson
                                key={person}
                                selected={item.owners.includes(person)}
                                onClick={() => handleOwnerToggle(item.id, person)}
                              >
                                {person}
                              </ItemCardPerson>
                            ))}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPeople();
                              }}
                              className="inline-flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                            >
                              <span className="text-sm text-secondary-foreground flex-auto">👤➕</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No hay personas agregadas
                          </span>
                        )}
                        {item.owners.length === 0 && (
                          <span className="text-xs text-muted-foreground italic mt-2">
                            ⚠️ Selecciona quiénes compartieron este ítem
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 pt-2 border-t">
                        {getNumberValue(item.quantity) > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSplitItem(item.id)}
                            className="h-7 text-xs text-muted-foreground hover:text-primary flex-1"
                            title="Dividir en ítems individuales"
                          >
                            <Split className="h-3 w-3" />
                            Separar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItemId(item.id)}
                          className="h-7 text-xs text-muted-foreground hover:text-primary flex-1"
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setItemToDelete(item.id)}
                          className="h-7 text-xs text-muted-foreground hover:text-destructive flex-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    </ItemCardContent>
                  </ItemCard>
                ))}
                
                {/* Add Item Card */}
                <ItemCard 
                  className="border-dashed bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={handleAddItem}
                >
                  <ItemCardContent className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                    <div className="h-12 w-12 rounded-full bg-muted-foreground/10 flex items-center justify-center mb-4">
                      <Plus className="h-6 w-6" />
                    </div>
                    <p className="text-lg font-medium">Agregar ítem</p>
                    <p className="text-sm">Click para agregar un nuevo ítem</p>
                  </ItemCardContent>
                </ItemCard>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg flex justify-center">
          <Button
                variant="default"
                onClick={handleSaveAndNavigate}
                size="sm"
                className="w-auto"
                disabled={selectedReceipt.items.every(item => item.owners.length === 0)}
              >
                {selectedReceipt.items.every(item => item.owners.length === 0)
                  ? "Selecciona quién compartió cada ítem ✋"
                  : "Guardar y Ver Distribución ✅"}
              </Button>
          </div>
        </>
      )}

      <Dialog open={showAddPeopleDialog} onOpenChange={setShowAddPeopleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modificar personas</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-full max-h-[60vh] mx-12 px-5">
            <ScrollArea className="flex-1">
              <div className="space-y-3 py-4 pr-4">
                {editingPeople.map((person, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Person ${index + 1}`}
                      value={person}
                      onChange={(e) => handlePersonNameChange(index, e.target.value)}
                      maxLength={30}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeletePerson(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t pt-4 mt-4 space-y-4 mx-auto">
              {editingPeople.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPerson}
                  className="w-full"
                >
                  ➕Agregar persona
                </Button>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPeopleDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSavePeople}
                  disabled={!editingPeople.some(p => p.trim() !== '')}
                >
                  Guardar cambios
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddItemsDialog} onOpenChange={setShowAddItemsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar ítems</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-full max-h-[60vh]">
            <ScrollArea className="flex-1">
              <div className="space-y-2 py-2 pr-">
                {newItems.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ej: Hamburguesa clásica"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        maxLength={30}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteNewItem(index)}
                      >
                        ×
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1.5">
                        <label htmlFor={`quantity-${index}`} className="text-xs text-muted-foreground px-1">
                          Cantidad
                        </label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', String(e.target.value))}
                          min={1}
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label htmlFor={`price-${index}`} className="text-xs text-muted-foreground px-1">
                          Precio unitario ($)
                        </label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          min={0}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      Total: {formatPrice(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t pt-4 mt-4 space-y-4">
              {newItems.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNewItem}
                  className="w-full"
                >
                  Agregar otro ítem
                </Button>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddItemsDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveItems}
                  disabled={!newItems.some(item => item.name.trim() !== '')}
                >
                  Agregar
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={itemToDelete !== null} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no puede ser revertida. Esto eliminará permanentemente el ítem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editingItemId !== null} onOpenChange={() => setEditingItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar ítem</DialogTitle>
          </DialogHeader>
          {editingItemId && selectedReceipt && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nombre
                </label>
                <Input
                  id="name"
                  defaultValue={selectedReceipt.items.find(i => i.id === editingItemId)?.name}
                  onChange={(e) => {
                    if (!editingItemId) return;
                    handleEditComplete(editingItemId, "name", e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Precio unitario
                </label>

                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  defaultValue={getNumberValue(
                    selectedReceipt.items.find(i => i.id === editingItemId)?.unitPrice
                  )}
                  onChange={(e) => {
                    if (!editingItemId) return;
                    handleEditComplete(editingItemId, "unitPrice", e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Cantidad
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  defaultValue={getNumberValue(
                    selectedReceipt.items.find(i => i.id === editingItemId)?.quantity
                  )}
                  onChange={(e) => {
                    if (!editingItemId) return;
                    handleEditComplete(editingItemId, "quantity", e.target.value);
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItemId(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
