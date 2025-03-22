
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useServer } from '@/context/ServerContext';
import { PipedInstance } from '@/services/api';
import { RefreshCw, CheckCircle, Server } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ServerSelectorProps {
  onClose: () => void;
}

const ServerSelector: React.FC<ServerSelectorProps> = ({ onClose }) => {
  const { instances, selectedInstance, isLoading, selectInstance, refreshInstances } = useServer();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const handleSelectServer = async (instance: PipedInstance) => {
    const success = await selectInstance(instance);
    if (success) {
      handleClose();
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'bg-green-500';
    if (health >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLatencyLabel = (latency: number) => {
    if (latency < 200) return 'Low';
    if (latency < 500) return 'Medium';
    return 'High';
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return 'bg-green-500';
    if (latency < 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Select Server</DialogTitle>
          <DialogDescription className="text-center">
            Choose a server to connect to for better performance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshInstances()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
        
        <ScrollArea className="h-[300px] pr-4">
          {instances.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10">
              {isLoading ? (
                <p className="text-muted-foreground">Loading servers...</p>
              ) : (
                <>
                  <Server size={40} className="text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No servers available</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <div
                  key={instance.api_url}
                  className={`p-4 rounded-lg border transition-all ${
                    selectedInstance?.api_url === instance.api_url
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedInstance?.api_url === instance.api_url && (
                        <CheckCircle size={18} className="text-accent" />
                      )}
                      <h3 className="font-medium text-base">{instance.name}</h3>
                    </div>
                    <Button
                      size="sm"
                      disabled={isLoading || selectedInstance?.api_url === instance.api_url}
                      onClick={() => handleSelectServer(instance)}
                    >
                      {selectedInstance?.api_url === instance.api_url ? 'Connected' : 'Connect'}
                    </Button>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getHealthColor(instance.health)}`} />
                      <span className="text-sm text-muted-foreground">{instance.health}% Health</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getLatencyColor(instance.latency)}`} />
                      <span className="text-sm text-muted-foreground">{getLatencyLabel(instance.latency)} Latency</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    {instance.locations.map((location) => (
                      <Badge key={location} variant="outline" className="text-xs">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ServerSelector;
