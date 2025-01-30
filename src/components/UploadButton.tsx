import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useAuth } from '../contexts/AuthContext'
import { useToast } from "@/components/hooks/use-toast"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LoadingModal } from "@/components/ui/loading-modal"
import axios, { AxiosError } from "axios"
import { UploadModal } from "./UploadModal"

export function UploadButton() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleUpload = async (file: File, people: string[]) => {
    const apiUrl = import.meta.env.VITE_API_URL
    
    if (!apiUrl) {
      console.error("API URL is not defined in environment variables")
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Server configuration is missing. Please contact support.",
      })
      return
    }

    if (!user?.email) {
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('people', JSON.stringify(people))

    // Log the FormData contents
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      const response = await axios.post(`${apiUrl}/receipts/upload`, formData, {
        params: {
          user_email: user.email
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      })

      // Log FormData contents for debugging
      for (const pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }

      navigate(`/receipts/${response.data.receiptId}`)
      
      toast({
        title: "Boleta subida",
        description: "Tu boleta ha sido procesada y está lista para dividir.",
      })

    } catch (error) {
      // Enhanced error logging
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server error details:', error.response.data);
      }
      
      const axiosError = error as AxiosError
      let errorMessage = "Hubo un error al subir tu boleta. "
      
      if (axiosError.code === "ECONNABORTED") {
        errorMessage += "La conexión se perdió. Por favor, verifica tu conexión a internet e intenta más tarde."
      } else if (axiosError.code === "ERR_NETWORK") {
        errorMessage += "Hubo un error de red. Por favor, verifica tu conexión a internet e intenta más tarde."
      } else if (axiosError.code === "ERR_BAD_REQUEST") {
        errorMessage += "Hubo un error al enviar la solicitud. Por favor, verifica que los datos ingresados sean correctos e intenta más tarde."
      } else if (axiosError.code === "ERR_BAD_RESPONSE") {
        errorMessage += "Hubo un error al recibir la respuesta del servidor. Por favor, verifica que el servidor esté funcionando correctamente e intenta más tarde."
      } else if (axiosError.code === "ERR_NOT_FOUND") {
        errorMessage += "No se encontró el recurso solicitado. Por favor, verifica que la URL ingresada sea correcta e intenta más tarde."
      } else if (axiosError.code === "ERR_NOT_IMPLEMENTED") {
        errorMessage += "El servidor no implementó la funcionalidad solicitada. Por favor, verifica que el servidor soporte la funcionalidad e intenta más tarde."
      } else if (axiosError.code === "ERR_UNEXPECTED") {
        errorMessage += "Hubo un error inesperado. Por favor, verifica que el servidor esté funcionando correctamente e intenta más tarde."
      }
      
      toast({
        variant: "destructive",
        title: "Error al subir boleta",
        description: errorMessage,
      })

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="default" onClick={() => setIsModalOpen(true)} className="w-full md:w-auto">
        <Upload className="mr-2 h-4 w-4" />
        Dividir cuenta nueva
      </Button>
      
      <UploadModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleUpload}
      />
      
      <LoadingModal open={isLoading} />
    </>
  )
}