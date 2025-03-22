
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Song, PipedSongResponse, apiClient } from "@/services/api";
import { toast } from "sonner";
import { useServer } from "./ServerContext";

interface PlayerContextType {
  currentSong: Song | null;
  songDetails: PipedSongResponse | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  togglePlayPause: () => void;
  playSong: (song: Song) => Promise<void>;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  seek: (time: number) => void;
  updateQueue: (songs: Song[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [songDetails, setSongDetails] = useState<PipedSongResponse | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { instances, selectInstance, autoSelectBestInstance } = useServer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevVolumeRef = useRef(volume);
  const currentSongRef = useRef<Song | null>(null);
  const loadAttemptRef = useRef(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    const savedVolume = localStorage.getItem("playerVolume");
    if (savedVolume) {
      const parsedVolume = parseFloat(savedVolume);
      setVolumeState(parsedVolume);
      audio.volume = parsedVolume;
    } else {
      audio.volume = volume;
    }
    
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleMetadataLoaded);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("waiting", handleWaiting);
    
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleMetadataLoaded);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("waiting", handleWaiting);
    };
  }, []);

  // Load playback state from localStorage on mount
  useEffect(() => {
    const lastSong = localStorage.getItem("lastSong");
    if (lastSong) {
      try {
        const songData = JSON.parse(lastSong) as Song;
        setCurrentSong(songData);
        playSong(songData, false); // Load but don't auto-play
      } catch (err) {
        console.error("Failed to load last song:", err);
      }
    }
    
    const savedQueue = localStorage.getItem("queue");
    if (savedQueue) {
      try {
        const queueData = JSON.parse(savedQueue) as Song[];
        setQueue(queueData);
      } catch (err) {
        console.error("Failed to load queue:", err);
      }
    }
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("queue", JSON.stringify(queue));
  }, [queue]);

  // Save current song to localStorage when it changes
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem("lastSong", JSON.stringify(currentSong));
    }
    currentSongRef.current = currentSong;
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem("playerVolume", volume.toString());
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setRetryCount(0);
      loadAttemptRef.current = 0;
    }
  };
  
  const handleCanPlay = () => {
    setIsLoading(false);
  };
  
  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handleEnded = () => {
    playNext();
  };

  const handleError = async (e: Event) => {
    console.error("Audio playback error:", e);
    
    if (retryCount >= 2) {
      await tryAnotherServer();
      return;
    }
    
    setRetryCount(prevCount => prevCount + 1);
    
    if (currentSongRef.current) {
      toast.error("Playback error. Retrying...");
      await playSong(currentSongRef.current);
    } else {
      playNext();
    }
  };

  const tryAnotherServer = async () => {
    setIsLoading(true);
    
    if (instances.length <= 1) {
      toast.error("No alternative servers available");
      setIsLoading(false);
      return;
    }
    
    // Try to automatically select a better server
    const success = await autoSelectBestInstance();
    
    if (success) {
      setRetryCount(0);
      
      if (currentSongRef.current) {
        await playSong(currentSongRef.current);
        toast.success("Switched to a better server");
      }
    } else {
      toast.error("Failed to find a working server");
      setIsLoading(false);
    }
  };

  const setVolume = (newVolume: number) => {
    if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
    setVolumeState(newVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolumeState(prevVolumeRef.current);
    } else {
      prevVolumeRef.current = volume;
      setIsMuted(true);
      setVolumeState(0);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Play failed:", err);
        toast.error("Failed to play this track");
      });
    }
    
    setIsPlaying(!isPlaying);
  };

  const playSong = async (song: Song, autoPlay = true) => {
    if (!song?.videoId) {
      toast.error("Invalid song");
      return;
    }
    
    setIsLoading(true);
    setCurrentSong(song);
    loadAttemptRef.current = 0;
    
    try {
      const details = await apiClient.getStreamDetails(song.videoId);
      setSongDetails(details);
      
      if (!details.audioStreams || details.audioStreams.length === 0) {
        throw new Error("No audio streams available");
      }
      
      const sortedStreams = [...details.audioStreams].sort((a, b) => b.bitrate - a.bitrate);
      const bestStream = sortedStreams[0];
      
      if (audioRef.current) {
        audioRef.current.src = bestStream.url;
        audioRef.current.load();
        
        if (autoPlay) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.error("Play failed:", err);
            toast.error("Failed to play this track");
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to play song:", error);
      
      // Increment load attempt counter
      loadAttemptRef.current += 1;
      
      // If we've tried 3 times and failed, try another server
      if (loadAttemptRef.current >= 3) {
        toast.error("Failed to load track. Trying another server...");
        await tryAnotherServer();
      } else {
        setIsLoading(false);
        toast.error("Failed to load this track");
      }
    }
  };

  const playNext = () => {
    if (queue.length === 0) {
      setIsPlaying(false);
      return;
    }
    
    const nextSong = queue[0];
    const newQueue = queue.slice(1);
    setQueue(newQueue);
    playSong(nextSong);
  };

  const playPrevious = () => {
    if (!currentSong || !audioRef.current) return;
    
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    
    audioRef.current.currentTime = 0;
  };

  const addToQueue = (song: Song) => {
    setQueue(prevQueue => [...prevQueue, song]);
    toast.success("Added to queue");
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const removeFromQueue = (index: number) => {
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    setQueue(newQueue);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const updateQueue = (songs: Song[]) => {
    setQueue(songs);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        songDetails,
        queue,
        isPlaying,
        currentTime,
        duration,
        volume,
        isLoading,
        isMuted,
        setVolume,
        toggleMute,
        togglePlayPause,
        playSong,
        playNext,
        playPrevious,
        addToQueue,
        clearQueue,
        removeFromQueue,
        seek,
        updateQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
