
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, ListMusic, RefreshCw } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useServer } from '@/context/ServerContext';
import { formatTime } from '@/lib/utils';
import Visualizer from './Visualizer';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import TrackItem from './TrackItem';
import { toast } from 'sonner';

const MusicPlayer: React.FC = () => {
  const {
    currentSong,
    songDetails,
    queue,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    togglePlayPause,
    playNext,
    playPrevious,
    removeFromQueue,
    seek,
    playSong
  } = usePlayer();

  const { autoSelectBestInstance, selectedInstance } = useServer();
  const [isVisualizerActive, setIsVisualizerActive] = useState(true);
  const [progressHover, setProgressHover] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [isSwitchingServer, setIsSwitchingServer] = useState(false);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  // Update progress value when currentTime changes
  useEffect(() => {
    if (duration > 0) {
      setProgressValue((currentTime / duration) * 100);
    } else {
      setProgressValue(0);
    }
  }, [currentTime, duration]);

  // Format the current time and duration for display
  const formatCurrentTime = formatTime(currentTime);
  const formatDuration = formatTime(duration);

  // Handle click on the progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || duration <= 0) return;

    const rect = progressContainerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    const seekTime = percentage * duration;
    
    seek(seekTime);
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  // Handle manual server switch
  const handleSwitchServer = async () => {
    if (isSwitchingServer) return;
    
    setIsSwitchingServer(true);
    toast.info("Attempting to find best server...");
    
    try {
      const success = await autoSelectBestInstance();
      if (success && currentSong) {
        // Replay current song with new server
        await playSong(currentSong);
        toast.success("Server switched successfully");
      } else {
        toast.error("Failed to switch server");
      }
    } catch (error) {
      console.error("Server switch error:", error);
      toast.error("Server switch failed");
    } finally {
      setIsSwitchingServer(false);
    }
  };

  // If no current song, render a minimal player
  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-background/80 backdrop-blur-lg border-t z-40 flex items-center justify-center">
        <p className="text-muted-foreground">Select a song to start playing</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t z-40">
      {/* Progress Bar */}
      <div 
        ref={progressContainerRef}
        className="player-progress cursor-pointer" 
        onClick={handleProgressClick}
        onMouseEnter={() => setProgressHover(true)}
        onMouseLeave={() => setProgressHover(false)}
      >
        <div className="player-progress-bar" style={{ width: `${progressValue}%` }}></div>
      </div>
      
      {/* Audio Visualizer - Visible when playing */}
      {isPlaying && isVisualizerActive && (
        <div className="w-full h-1 absolute top-1 left-0">
          <Visualizer />
        </div>
      )}
      
      <div className="container flex items-center h-[72px] justify-between">
        {/* Song Info */}
        <div className="flex items-center space-x-3 w-1/3">
          <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0">
            <img 
              src={currentSong.thumbnail || songDetails?.thumbnailUrl} 
              alt={currentSong.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="truncate">
            <p className="font-medium truncate">{currentSong.title}</p>
            <p className="text-sm text-muted-foreground truncate">{currentSong.author}</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col items-center w-1/3">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={playPrevious}
            >
              <SkipBack size={20} />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={`h-10 w-10 rounded-full ${isLoading ? 'animate-pulse' : ''}`}
              disabled={isLoading}
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={playNext}
              disabled={queue.length === 0}
            >
              <SkipForward size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 ${isSwitchingServer ? 'animate-spin' : ''}`}
              onClick={handleSwitchServer}
              disabled={isSwitchingServer}
              title="Switch server"
            >
              <RefreshCw size={18} />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            <span>{formatCurrentTime}</span>
            <span>/</span>
            <span>{formatDuration}</span>
            {selectedInstance && (
              <span className="ml-2 text-accent/70 text-[10px]">
                Server: {selectedInstance.name.trim()}
              </span>
            )}
          </div>
        </div>
        
        {/* Volume & Queue */}
        <div className="flex items-center justify-end space-x-3 w-1/3">
          <div className="flex items-center space-x-2 w-32">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            
            <Slider
              value={[volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ListMusic size={20} />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Queue</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                {queue.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Queue is empty</p>
                ) : (
                  <ScrollArea className="h-[70vh]">
                    {queue.map((song, index) => (
                      <TrackItem 
                        key={`${song.videoId}-${index}`} 
                        song={song} 
                        isActive={false}
                        isInQueue={true}
                        queueIndex={index}
                        onRemoveFromQueue={() => removeFromQueue(index)}
                      />
                    ))}
                  </ScrollArea>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
