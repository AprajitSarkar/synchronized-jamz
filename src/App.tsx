
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { ServerProvider } from "./context/ServerContext";
import { PlayerProvider } from "./context/PlayerContext";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Library from "./pages/Library";
import NotFound from "./pages/NotFound";
import Playlists from "./pages/Playlists";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ServerProvider>
          <Toaster />
          <Sonner position="top-center" theme="dark" />
          <BrowserRouter>
            <PlayerProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/playlists/:id" element={<Playlists />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </PlayerProvider>
          </BrowserRouter>
        </ServerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
