import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Dashboard as AxizDashboard } from "./pages/axiz/Dashboard.tsx";
import { NewProject as AxizNewProject } from "./pages/axiz/NewProject.tsx";
import { ProposalDetails as AxizProposalDetails } from "./pages/axiz/ProposalDetails.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/axiz/dashboard" element={<AxizDashboard />} />
          <Route path="/axiz/new" element={<AxizNewProject />} />
          <Route path="/axiz/proposal/:id" element={<AxizProposalDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
