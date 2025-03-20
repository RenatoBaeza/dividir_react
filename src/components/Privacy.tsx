import { Link } from "react-router-dom";

export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto py-8 relative min-h-screen pb-20">
      <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>

      <div className="prose prose-neutral dark:prose-invert">
        <p className="text-lg mb-4">
          Última actualización: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            1. Información que Recopilamos
          </h2>
          <p>
            Recopilamos la siguiente información cuando utilizas Dividir.cl:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>
              Información de tu cuenta de Google (email, nombre y foto de
              perfil)
            </li>
            <li>Imágenes de boletas que subes a la plataforma</li>
            <li>Nombres de personas que ingresas para dividir las cuentas</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            2. Uso de la Información
          </h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Procesar y analizar las boletas</li>
            <li>Permitir la división de cuentas entre usuarios</li>
            <li>Mejorar nuestros servicios</li>
            <li>Comunicarnos contigo sobre tu cuenta</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            3. Protección de Datos
          </h2>
          <p>
            Nos comprometemos a proteger tus datos personales y tomamos medidas
            de seguridad para prevenir el acceso no autorizado o la divulgación
            de tu información.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta política de privacidad, puedes
            contactarme en:
            <br />
            <a
              href="mailto:rntbzbg@gmail.com"
              className="text-primary hover:underline"
            >
              rntbzbg@gmail.com
            </a>{" "}
            o en{" "}
            <a
              href="https://x.com/renatobaeza"
              className="text-primary hover:underline"
            >
              @renatobaeza
            </a>
          </p>
        </section>
      </div>

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
  );
}
