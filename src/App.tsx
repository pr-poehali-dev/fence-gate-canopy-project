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
import AdminMenu from "./pages/AdminMenu";
import AdminPrices from "./pages/AdminPrices";
import AdminBuilder from "./pages/AdminBuilder";
import AdminOnec from "./pages/AdminOnec";
import AdminChats from "./pages/AdminChats";
import AdminCrm from "./pages/AdminCrm";
import AdminBoard from "./pages/AdminBoard";
import UserPage from "./pages/UserPage";
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
import Pokraska from "./pages/services/Pokraska";
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
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/prices" element={<AdminPrices />} />
          <Route path="/admin/builder" element={<AdminBuilder />} />
          <Route path="/admin/onec" element={<AdminOnec />} />
          <Route path="/admin/chats" element={<AdminChats />} />
          <Route path="/admin/crm" element={<AdminCrm />} />
          <Route path="/admin/board" element={<AdminBoard />} />
          <Route path="/p/:slug" element={<UserPage />} />
          <Route path="/max-setup" element={<MaxSetup />} />
          <Route path="/help/max" element={<MaxSetup />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Услуги */}
          <Route path="/services/profnastil"          element={<Profnastil />} />
          <Route path="/services/shtaketnik"          element={<Shtaketnik />} />
          <Route path="/services/otkatnye-vorota"     element={<Otkatnye />} />
          <Route path="/services/raspashnye-vorota"   element={<Raspashnye />} />
          <Route path="/services/navesy"              element={<Navesy />} />
          <Route path="/services/3d-setka"            element={<Mesh3D />} />
          <Route path="/services/kovka"               element={<Kovka />} />
          <Route path="/services/setka-rabitsa"       element={<Rabitsa />} />
          <Route path="/services/kalitki"             element={<Kalitki />} />
          <Route path="/services/besedki"             element={<Besedki />} />
          <Route path="/services/fundamenty"          element={<Foundations />} />
          <Route path="/services/pokraska"            element={<Pokraska />} />
          <Route path="/uslugi/pokraska"              element={<Pokraska />} />
          <Route path="/services/betonnye-ploschadki" element={<Ploshadki />} />
          <Route path="/services/zaezd-na-uchastok"   element={<Zaezd />} />
          <Route path="/uslugi/fundamenty"            element={<Foundations />} />
          <Route path="/uslugi/stolby"                element={<Stolby />} />

          {/* Редиректы старых маршрутов */}
          <Route path="/zabory/na-rostverke"       element={<Navigate to="/uslugi/fundamenty#tab-rostverk" replace />} />
          <Route path="/zabory/kirpichnye-stolby"  element={<Navigate to="/uslugi/stolby#tab-kirpich" replace />} />
          <Route path="/zabory/bloki-stolby"       element={<Navigate to="/uslugi/stolby#tab-bloki" replace />} />
          <Route path="/erp/*"                     element={<Navigate to="/admin" replace />} />

          <Route path="/shemy-chertezi" element={<SchematicsCatalog />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;