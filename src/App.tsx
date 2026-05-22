
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Reviews from "./pages/Reviews";
import Admin from "./pages/Admin";
import AdminLeads from "./pages/AdminLeads";
import AdminContent from "./pages/AdminContent";
import AdminMedia from "./pages/AdminMedia";
import ErpLogin from "./pages/ErpLogin";
import ErpDashboard from "./pages/ErpDashboard";
import ErpEmployees from "./pages/ErpEmployees";
import ErpCalculator from "./pages/ErpCalculator";
import ErpDealCard from "./pages/ErpDealCard";
import ErpDeals from "./pages/ErpDeals";
import DynamicFavicon from "./components/DynamicFavicon";
import AdminEditBar from "./components/AdminEditBar";
import AnalyticsCounters from "./components/AnalyticsCounters";
import MaxSetup from "./pages/MaxSetup";
import Privacy from "./pages/Privacy";
import Shtaketnik from "./pages/services/Shtaketnik";
import Profnastil from "./pages/services/Profnastil";
import Otkatnye from "./pages/services/Otkatnye";
import Raspashnye from "./pages/services/Raspashnye";
import Navesy from "./pages/services/Navesy";
import Mesh3D from "./pages/services/Mesh3D";
import Kovka from "./pages/services/Kovka";
import Rabitsa from "./pages/services/Rabitsa";
import Kalitki from "./pages/services/Kalitki";
import Besedki from "./pages/services/Besedki";
import Foundations from "./pages/services/Foundations";
import Ploshadki from "./pages/services/Ploshadki";
import Zaezd from "./pages/services/Zaezd";
import Stolby from "./pages/services/Stolby";
import SchematicsCatalog from "./pages/services/SchematicsCatalog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DynamicFavicon />
        <AnalyticsCounters />
        <AdminEditBar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/leads" element={<AdminLeads />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/media" element={<AdminMedia />} />
          <Route path="/erp/login" element={<ErpLogin />} />
          <Route path="/erp" element={<ErpDashboard />} />
          <Route path="/erp/employees" element={<ErpEmployees />} />
          <Route path="/erp/calc" element={<ErpCalculator />} />
          <Route path="/erp/deals" element={<ErpDeals />} />
          <Route path="/erp/deals/:id" element={<ErpDealCard />} />
          <Route path="/max-setup" element={<MaxSetup />} />
          <Route path="/help/max" element={<MaxSetup />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Услуги — отдельные страницы */}
          <Route path="/services/profnastil"     element={<Profnastil />} />
          <Route path="/services/shtaketnik"     element={<Shtaketnik />} />
          <Route path="/services/otkatnye-vorota" element={<Otkatnye />} />
          <Route path="/services/raspashnye-vorota" element={<Raspashnye />} />
          <Route path="/services/navesy"         element={<Navesy />} />
          <Route path="/services/3d-setka"       element={<Mesh3D />} />
          <Route path="/services/kovka"          element={<Kovka />} />
          <Route path="/services/setka-rabitsa"  element={<Rabitsa />} />
          <Route path="/services/kalitki"        element={<Kalitki />} />
          <Route path="/services/besedki"        element={<Besedki />} />
          <Route path="/services/fundamenty"     element={<Foundations />} />
          <Route path="/services/betonnye-ploschadki" element={<Ploshadki />} />
          <Route path="/services/zaezd-na-uchastok"   element={<Zaezd />} />

          {/* Объединённые услуги (категории с типами на табах) */}
          <Route path="/uslugi/fundamenty"          element={<Foundations />} />
          <Route path="/uslugi/stolby"              element={<Stolby />} />

          {/* Старые маршруты — теперь редиректы на категории с якорями к нужному табу */}
          <Route path="/zabory/na-rostverke"        element={<Navigate to="/uslugi/fundamenty#tab-rostverk" replace />} />
          <Route path="/zabory/kirpichnye-stolby"   element={<Navigate to="/uslugi/stolby#tab-kirpich" replace />} />
          <Route path="/zabory/bloki-stolby"        element={<Navigate to="/uslugi/stolby#tab-bloki" replace />} />

          {/* Каталог схем */}
          <Route path="/shemy-chertezi"             element={<SchematicsCatalog />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;