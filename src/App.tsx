
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Shtaketnik from "./pages/services/Shtaketnik";
import Profnastil from "./pages/services/Profnastil";
import Otkatnye from "./pages/services/Otkatnye";
import Navesy from "./pages/services/Navesy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services/shtaketnik" element={<Shtaketnik />} />
          <Route path="/services/profnastil" element={<Profnastil />} />
          <Route path="/services/otkatnye-vorota" element={<Otkatnye />} />
          <Route path="/services/navesy" element={<Navesy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;