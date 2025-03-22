
import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient, PipedInstance } from "@/services/api";
import { toast } from "sonner";

interface ServerContextType {
  instances: PipedInstance[];
  selectedInstance: PipedInstance | null;
  isLoading: boolean;
  error: string | null;
  selectInstance: (instance: PipedInstance) => Promise<boolean>;
  refreshInstances: () => Promise<void>;
  autoSelectBestInstance: () => Promise<boolean>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instances, setInstances] = useState<PipedInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<PipedInstance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load instances on mount
  useEffect(() => {
    loadInstances().then(() => {
      autoSelectBestInstance();
    });
  }, []);

  const loadInstances = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedInstances = await apiClient.loadInstances();
      console.log("Loaded instances in context:", loadedInstances);
      setInstances(loadedInstances);
      return loadedInstances;
    } catch (err) {
      console.error("Failed to load instances", err);
      setError("Failed to load server instances. Please try again later.");
      toast.error("Failed to load server instances");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const selectInstance = async (instance: PipedInstance): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const success = await apiClient.setInstance(instance);
      if (success) {
        setSelectedInstance(instance);
        toast.success(`Connected to ${instance.name}`);
        return true;
      } else {
        toast.error(`Failed to connect to ${instance.name}`);
        return false;
      }
    } catch (err) {
      console.error("Failed to select instance", err);
      toast.error(`Failed to connect to ${instance.name}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const autoSelectBestInstance = async (): Promise<boolean> => {
    // If there are no instances, try to load them
    let availableInstances = instances;
    if (availableInstances.length === 0) {
      availableInstances = await loadInstances();
    }
    
    if (availableInstances.length === 0) {
      toast.error("No server instances available");
      return false;
    }
    
    // Sort instances by health (uptime) and latency
    const sortedInstances = [...availableInstances].sort((a, b) => {
      // First, prioritize by 24h uptime
      if (b.uptime_24h !== a.uptime_24h) return b.uptime_24h - a.uptime_24h;
      
      // Then by 7d uptime
      if (b.uptime_7d !== a.uptime_7d) return b.uptime_7d - a.uptime_7d;
      
      // Finally by latency if available
      if (a.latency && b.latency) return a.latency - b.latency;
      
      return 0;
    });
    
    // Try to connect to the best instance
    for (const instance of sortedInstances) {
      const success = await selectInstance(instance);
      if (success) {
        return true;
      }
      // If this instance failed, try the next one
    }
    
    toast.error("Failed to connect to any server");
    return false;
  };

  const refreshInstances = async () => {
    setIsLoading(true);
    try {
      await loadInstances();
      toast.success("Server list refreshed");
    } catch (err) {
      toast.error("Failed to refresh server list");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ServerContext.Provider
      value={{
        instances,
        selectedInstance,
        isLoading,
        error,
        selectInstance,
        refreshInstances,
        autoSelectBestInstance,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = (): ServerContextType => {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error("useServer must be used within a ServerProvider");
  }
  return context;
};
