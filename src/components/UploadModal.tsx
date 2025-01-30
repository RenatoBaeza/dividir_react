import { useState } from "react"
import { Camera, Upload, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/hooks/use-toast"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (file: File, people: string[]) => void
}

export function UploadModal({ open, onOpenChange, onSubmit }: UploadModalProps) {
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [people, setPeople] = useState<string[]>([])
  const [newPerson, setNewPerson] = useState("")

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: "Por favor selecciona una imagen menor a 5MB"
      })
      return
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/heic'].includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Formato no soportado",
        description: "Por favor selecciona una imagen en formato JPG, PNG o HEIC"
      })
      return
    }

    setSelectedFile(file)
  }

  const openCamera = () => {
    const input = document.getElementById('camera') as HTMLInputElement
    if (input) {
      // Reset the value to ensure the change event fires even if selecting the same file
      input.value = ''
      input.click()
    }
  }

  const handleAddPerson = () => {
    if (newPerson.trim() && !people.includes(newPerson.trim())) {
      setPeople([...people, newPerson.trim()])
      setNewPerson("")
    }
  }

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile, people)
      setSelectedFile(null)
      setPeople([])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px]"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">Nueva cuenta</DialogTitle>
          <DialogDescription id="dialog-description">
            Sube una foto de tu boleta y agrega las personas que participaron
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Foto de la boleta</Label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={openCamera}>
                <Camera className="mr-2 h-4 w-4" />
                Tomar foto
                <input
                  id="camera"
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </Button>
              <Button variant="outline" onClick={() => document.getElementById('upload')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Subir imagen
                <input
                  id="upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Personas</Label>
            <div className="flex gap-2">
              <Input
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="Nombre de la persona"
                onKeyDown={(e) => e.key === "Enter" && handleAddPerson()}
              />
              <Button variant="outline" onClick={handleAddPerson}>
                <Users className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>
            {people.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {people.map((person) => (
                  <div
                    key={person}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-2"
                  >
                    {person}
                    <button
                      onClick={() => setPeople(people.filter(p => p !== person))}
                      className="text-secondary-foreground/50 hover:text-secondary-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || people.length === 0}
          >
            Crear cuenta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}