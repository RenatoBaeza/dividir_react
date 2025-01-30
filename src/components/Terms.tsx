import { Link } from 'react-router-dom';

export function Terms() {
    return (
      <div className="max-w-3xl mx-auto py-8 relative min-h-screen pb-20">
        <h1 className="text-3xl font-bold mb-6">Términos de Servicio</h1>
        
        <div className="prose prose-neutral dark:prose-invert">
          <p className="text-lg mb-4">
            Última actualización: {new Date().toLocaleDateString()}
          </p>
  
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar Dividir.cl, aceptas estos términos de servicio en su totalidad.
              Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestro servicio.
            </p>
          </section>
  
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Descripción del Servicio</h2>
            <p>
              Dividir.cl es una plataforma que permite a los usuarios:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Subir imágenes de boletas de restaurantes</li>
              <li>Procesar y extraer información de las boletas</li>
              <li>Dividir los gastos entre múltiples personas</li>
              <li>Compartir los resultados vía WhatsApp</li>
            </ul>
          </section>
  
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Uso Aceptable</h2>
            <p>
              Te comprometes a no:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Usar el servicio para propósitos ilegales</li>
              <li>Subir contenido malicioso o inapropiado</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
              <li>Interferir con el funcionamiento normal del servicio</li>
            </ul>
          </section>
  
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Limitación de Responsabilidad</h2>
            <p>
              Dividir.cl se proporciona "tal cual" y no garantizamos su precisión o disponibilidad continua.
              No nos hacemos responsables por errores en el procesamiento de las boletas o cálculos.
            </p>
          </section>
  
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Contacto</h2>
            <p>
              Para preguntas sobre estos términos, contáctanos en:
              <br />
              <a href="mailto:rntbzbg@gmail.com" className="text-primary hover:underline">
                rntbzbg@gmail.com
              </a> o en <a href="https://x.com/renatobaeza" className="text-primary hover:underline">
                @renatobaeza
              </a>
            </p>
          </section>
        </div>

        {/* Fixed Footer Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t">
          <div className="container mx-auto flex justify-center">
            <Link 
              to="/"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              🔙 Volver
            </Link>
          </div>
        </div>
      </div>
    )
  }