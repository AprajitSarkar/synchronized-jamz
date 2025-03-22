import React, { useEffect, useState } from 'react';
import { useServer } from '@/context/ServerContext';
import { apiClient, Song } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import MusicGrid from '@/components/MusicGrid';
import SearchBar from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { Server, Headphones, Loader2 } from 'lucide-react';

const featuredPlaylists = [
  "PLgzTt0k8mXzEk586ze4BjvDXR7c-TUSnx", // Top Hits
  "PLgzTt0k8mXzEpH7-dOCHqRZOsakqXmzmG", // Chill Vibes
  "PLw-VjHDlEOgtmvSFbVmxaqOJRB6QnQNQl", // Indie Playlist
];

const Index = () => {
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { selectedInstance, isLoading: isServerLoading } = useServer();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedInstance) {
      loadFeaturedMusic();
    }
  }, [selectedInstance]);

  const loadFeaturedMusic = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Pick a random featured playlist
      const randomPlaylistId = featuredPlaylists[Math.floor(Math.random() * featuredPlaylists.length)];
      
      const playlistData = await apiClient.getPlaylist(randomPlaylistId);
      const songs = playlistData.videos.slice(0, 10);
      
      setFeaturedSongs(songs);
    } catch (err) {
      console.error("Failed to load featured music:", err);
      setError('Failed to load music. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToSearch = () => {
    navigate('/search');
  };

  return (
    <div className="container max-w-5xl animate-in fade-in slide-up">
      {!selectedInstance && !isServerLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <Server size={64} className="text-accent mb-6" />
          <h1 className="text-4xl font-bold mb-3">Welcome to VibeSync</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-lg">
            Synchronized music playback across multiple devices. Select a server to get started.
          </p>
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => navigate('/')}
          >
            <Server size={20} />
            Select Server
          </Button>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl mb-12 glass-panel">
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-accent/10 to-primary/10" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center p-8 lg:p-12">
              <div className="flex-1 lg:pr-8 mb-8 lg:mb-0">
                <h1 className="text-4xl font-bold mb-4">Discover & Share Music</h1>
                <p className="text-xl text-muted-foreground mb-6">
                  Find your favorite tracks and sync playback with friends in real-time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={goToSearch} className="gap-2">
                    <Headphones size={18} />
                    Discover Music
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/library')}>
                    My Library
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 w-full lg:w-1/3">
                <div className="relative">
                  <div className="device-float">
                    <div className="glass-panel p-4 rounded-2xl overflow-hidden bg-accent/5">
                      <div className="rounded-lg overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80" 
                          alt="Music visualization" 
                          className="w-full h-auto object-cover" 
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-center space-x-2">
                        <div className="w-1 h-8 rounded-full bg-accent animate-wave-1"></div>
                        <div className="w-1 h-12 rounded-full bg-accent animate-wave-2"></div>
                        <div className="w-1 h-8 rounded-full bg-accent animate-wave-3"></div>
                        <div className="w-1 h-10 rounded-full bg-accent animate-wave-1"></div>
                        <div className="w-1 h-6 rounded-full bg-accent animate-wave-2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-12">
            <SearchBar 
              onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)}
              className="max-w-3xl mx-auto"
            />
          </div>
          
          {/* Featured Music */}
          <div className="mb-12">
            <MusicGrid
              title="Featured Music"
              songs={featuredSongs}
              isLoading={isLoading}
              errorMessage={error}
              onLoadMore={() => navigate('/search')}
              hasMore={true}
            />
          </div>
          
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Server size={24} className="text-accent" />
              </div>
              <h3 className="text-lg font-medium mb-2">Dynamic Servers</h3>
              <p className="text-muted-foreground">
                Connect to the fastest server for optimal playback performance.
              </p>
            </div>
            
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-accent"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">High Quality Audio</h3>
              <p className="text-muted-foreground">
                Enjoy your music in the highest audio quality available.
              </p>
            </div>
            
            <div className="glass-panel p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-accent"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Synchronized Sessions</h3>
              <p className="text-muted-foreground">
                Listen together with friends in perfect sync across devices.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
