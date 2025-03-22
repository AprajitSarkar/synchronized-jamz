
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
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instances, setInstances] = useState<PipedInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<PipedInstance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load instances on mount
  useEffect(() => {
    loadInstances();
  }, []);

  // Try to restore selected instance from localStorage
  useEffect(() => {
    const savedInstance = localStorage.getItem("selectedInstance");
    if (savedInstance) {
      try {
        const instance = JSON.parse(savedInstance);
        selectInstance(instance);
      } catch (err) {
        console.error("Failed to parse saved instance", err);
        localStorage.removeItem("selectedInstance");
      }
    }
  }, []);

  const loadInstances = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedInstances = await apiClient.loadInstances();
      console.log("Loaded instances in context:", loadedInstances);
      setInstances(loadedInstances);
      
      // If no instance is selected, select the first one
      if (!selectedInstance && loadedInstances.length > 0) {
        const selected = apiClient.getSelectedInstance();
        if (selected) {
          setSelectedInstance(selected);
        }
      }
    } catch (err) {
      console.error("Failed to load instances", err);
      setError("Failed to load server instances. Please try again later.");
      toast.error("Failed to load server instances");
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
