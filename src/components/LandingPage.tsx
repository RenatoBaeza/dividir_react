import { Upload, Users, Calculator } from "lucide-react"
import { useAuth } from '../contexts/AuthContext'
import { SignIn } from './SignIn'
import { Link } from 'react-router-dom'

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Divide tus cuentas de restaurante sin esfuerzo
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Sube tu boleta, distribuye los pagos y comparte en Whatsapp 
              <br /><br />
              Olvídate del Excel ¡Distribución de cuentas justa y sencilla!
            </p>

            {!user && (
              <div className="flex flex-col items-center gap-4">
                <span className="text-2xl font-bold text-primary animate-bounce">
                  Comienza aquí ↓
                </span>
                <div className="flex justify-center">
                  <SignIn />
                </div>
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="w-full max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Cómo funciona</h2>
            <div className="grid md:grid-cols-3 gap-4 px-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sube tu boleta</h3>
                <p className="text-muted-foreground">
                  Sube una imagen de tu boleta
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Agrega personas</h3>
                <p className="text-muted-foreground">
                  Agrega los nombres de todos los involucrados y asigna los items a sus respectivos pagadores.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Comparte en Whatsapp</h3>
                <p className="text-muted-foreground">
                  ¡Comparte en Whatsapp la boleta con los pagos calculados de cada uno!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="py-2 text-center text-sm text-muted-foreground bg-background/80 backdrop-blur-sm border-t">
        <div className="container mx-auto flex justify-center items-center gap-4">
          <span>Hecho con ❤️ por <a href="https://x.com/renatobaeza" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">@renatobaeza</a></span>
          <span>•</span>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
          <span>•</span>
          <Link to="/tos" className="hover:text-primary transition-colors">Términos</Link>
        </div>
      </footer>
    </div>
  )
}