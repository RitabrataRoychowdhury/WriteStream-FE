import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import PipelinePage from "./pages/PipelinePage";
import DashboardPage from "./pages/DashboardPage";
import SourcesPage from "./pages/SourcesPage";
import SinksPage from "./pages/SinksPage";
import ViewsPage from "./pages/ViewsPage";
import LogsPage from "./pages/LogsPage";
import OperationsPage from "./pages/OperationsPage";
import BenchmarksPage from "./pages/BenchmarksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<PipelinePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/sinks" element={<SinksPage />} />
            <Route path="/views" element={<ViewsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/benchmarks" element={<BenchmarksPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
