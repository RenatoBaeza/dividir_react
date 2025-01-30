import './App.css'
import { useAuth } from './contexts/AuthContext'
import { Link, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster"
import { Splitter } from './components/Splitter'
import { MyReceipts } from './components/MyReceipts';
import { LandingPage } from './components/LandingPage'
import { Distribution } from './components/Distribution'
import { Privacy } from './components/Privacy'
import { Terms } from './components/Terms'
import { ScrollToTop } from './components/ScrollToTop'
import { UserMenu } from './components/UserMenu'
import { Analytics } from "@vercel/analytics/react"

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full px-2">
      <header className="sticky top-0 z-50 mb-5 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto p-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-black">➗DIVIDIR</Link>
          <div className="flex items-center gap-4">
            {user ? <UserMenu /> : null}
          </div>
        </div>
      </header>

      <main className="container mx-auto pb-10">
        <ScrollToTop />
        <Routes>
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/tos" element={<Terms />} />
          {user ? (
            <>
              <Route path="/receipts/:receiptId" element={<Splitter />} />
              <Route path="/receipts/:receiptId/distribution" element={<Distribution />} />
              <Route path="/" element={<MyReceipts />} />
            </>
          ) : (
            <Route path="/" element={<LandingPage />} />
          )}
        </Routes>
      </main>

      <Toaster/>
      <Analytics />
    </div>
  )
}


export default App
