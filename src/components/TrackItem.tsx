
import React from 'react';
import { Song } from '@/services/api';
import { Play, PauseCircle, Clock, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';

interface TrackItemProps {
  song: Song;
  isActive: boolean;
  isInQueue?: boolean;
  queueIndex?: number;
  onRemoveFromQueue?: () => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ 
  song, 
  isActive,
  isInQueue = false,
  queueIndex,
  onRemoveFromQueue
}) => {
  const { playSong, addToQueue, currentSong, isPlaying, togglePlayPause } = usePlayer();
  
  const isCurrentlyPlaying = isActive || (currentSong?.videoId === song.videoId && isPlaying);
  
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (currentSong?.videoId === song.videoId) {
      togglePlayPause();
    } else {
      playSong(song);
    }
  };
  
  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
  };
  
  const handleRemoveFromQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromQueue) {
      onRemoveFromQueue();
    }
  };
  
  return (
    <div 
      className={cn(
        "flex items-center p-2 rounded-md transition-all",
        isCurrentlyPlaying ? "bg-accent/10 hover:bg-accent/20" : "hover:bg-secondary/80"
      )}
      onClick={handlePlay}
    >
      <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded overflow-hidden relative group">
        <img 
          src={song.thumbnail} 
          alt={song.title} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-white" 
            onClick={handlePlay}
          >
            {isCurrentlyPlaying ? <PauseCircle size={24} /> : <Play size={24} />}
          </Button>
        </div>
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <p className={cn(
          "font-medium truncate text-sm md:text-base",
          isCurrentlyPlaying && "text-accent"
        )}>
          {song.title}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground truncate">{song.author}</p>
      </div>
      
      <div className="flex items-center space-x-2 ml-2">
        {isInQueue && queueIndex !== undefined && (
          <div className="text-xs md:text-sm text-muted-foreground px-2">
            {queueIndex + 1}
          </div>
        )}
        
        <div className="text-xs md:text-sm text-muted-foreground flex items-center space-x-1">
          <Clock size={14} />
          <span>{song.duration}</span>
        </div>
        
        {isInQueue ? (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground hover:text-destructive" 
            onClick={handleRemoveFromQueue}
          >
            <X size={18} />
          </Button>
        ) : (
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-7 w-7 md:h-8 md:w-8" 
            onClick={handleAddToQueue}
          >
            <Plus size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TrackItem;
