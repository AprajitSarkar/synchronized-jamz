
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Play, Trash2, Edit, Music } from 'lucide-react';
import { Song } from '@/services/api';
import { usePlayer } from '@/context/PlayerContext';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import TrackItem from '@/components/TrackItem';
import { formatTime } from '@/lib/utils';

interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  createdAt: number;
}

// Local storage helpers
const getPlaylists = (): Playlist[] => {
  const stored = localStorage.getItem('playlists');
  return stored ? JSON.parse(stored) : [];
};

const savePlaylists = (playlists: Playlist[]) => {
  localStorage.setItem('playlists', JSON.stringify(playlists));
};

const generatePlaylistId = () => {
  return 'pl_' + Math.random().toString(36).substring(2, 11);
};

const Playlists: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSong, queue, addToQueue, playSong } = usePlayer();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Load playlists from localStorage
  useEffect(() => {
    const storedPlaylists = getPlaylists();
    setPlaylists(storedPlaylists);
    
    // If URL has a playlist ID, select that playlist
    if (id) {
      const playlist = storedPlaylists.find(p => p.id === id);
      if (playlist) {
        setSelectedPlaylist(playlist);
      } else {
        navigate('/playlists');
      }
    }
  }, [id, navigate]);
  
  // Create a new playlist
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }
    
    const newPlaylist: Playlist = {
      id: generatePlaylistId(),
      name: newPlaylistName,
      description: newPlaylistDescription,
      songs: [],
      createdAt: Date.now()
    };
    
    const updatedPlaylists = [...playlists, newPlaylist];
    setPlaylists(updatedPlaylists);
    savePlaylists(updatedPlaylists);
    
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setIsCreating(false);
    
    toast.success('Playlist created!');
    navigate(`/playlists/${newPlaylist.id}`);
  };
  
  // Add current song to playlist
  const addCurrentSongToPlaylist = () => {
    if (!currentSong || !selectedPlaylist) return;
    
    // Check if song already exists in playlist
    if (selectedPlaylist.songs.some(song => song.videoId === currentSong.videoId)) {
      toast.info('Song is already in playlist');
      return;
    }
    
    // Add song to the playlist
    const updatedPlaylist = {
      ...selectedPlaylist,
      songs: [...selectedPlaylist.songs, currentSong]
    };
    
    // Update playlists in state and localStorage
    const updatedPlaylists = playlists.map(p => 
      p.id === selectedPlaylist.id ? updatedPlaylist : p
    );
    
    setPlaylists(updatedPlaylists);
    setSelectedPlaylist(updatedPlaylist);
    savePlaylists(updatedPlaylists);
    
    toast.success('Added to playlist');
  };
  
  // Remove song from playlist
  const removeSongFromPlaylist = (songIndex: number) => {
    if (!selectedPlaylist) return;
    
    const updatedSongs = [...selectedPlaylist.songs];
    updatedSongs.splice(songIndex, 1);
    
    const updatedPlaylist = {
      ...selectedPlaylist,
      songs: updatedSongs
    };
    
    const updatedPlaylists = playlists.map(p => 
      p.id === selectedPlaylist.id ? updatedPlaylist : p
    );
    
    setPlaylists(updatedPlaylists);
    setSelectedPlaylist(updatedPlaylist);
    savePlaylists(updatedPlaylists);
    
    toast.success('Song removed from playlist');
  };
  
  // Delete a playlist
  const handleDeletePlaylist = () => {
    if (!selectedPlaylist) return;
    
    const updatedPlaylists = playlists.filter(p => p.id !== selectedPlaylist.id);
    setPlaylists(updatedPlaylists);
    savePlaylists(updatedPlaylists);
    
    toast.success('Playlist deleted');
    setSelectedPlaylist(null);
    navigate('/playlists');
  };
  
  // Play all songs in the playlist
  const playPlaylist = () => {
    if (!selectedPlaylist || selectedPlaylist.songs.length === 0) return;
    
    // Play the first song
    playSong(selectedPlaylist.songs[0]);
    
    // Add the rest to the queue
    if (selectedPlaylist.songs.length > 1) {
      selectedPlaylist.songs.slice(1).forEach(song => {
        addToQueue(song);
      });
    }
    
    toast.success('Playing playlist');
  };
  
  // Calculate total playlist duration
  const getTotalDuration = () => {
    if (!selectedPlaylist) return '0:00';
    
    const totalSeconds = selectedPlaylist.songs.reduce((total, song) => {
      // Extract seconds from duration string (mm:ss)
      const parts = song.duration.split(':');
      const minutes = parseInt(parts[0], 10);
      const seconds = parts.length > 1 ? parseInt(parts[1], 10) : 0;
      return total + (minutes * 60 + seconds);
    }, 0);
    
    return formatTime(totalSeconds);
  };
  
  // Render playlist listing view
  const renderPlaylistListing = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Playlists</h1>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <PlusCircle size={18} />
          <span>New Playlist</span>
        </Button>
      </div>
      
      {isCreating && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create New Playlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="playlist-name" className="text-sm font-medium">Name</label>
              <Input
                id="playlist-name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="My Awesome Playlist"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="playlist-description" className="text-sm font-medium">Description (optional)</label>
              <Input
                id="playlist-description"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder="Describe your playlist"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button onClick={handleCreatePlaylist}>Create Playlist</Button>
          </CardFooter>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.length === 0 ? (
          <div className="col-span-full glass-panel p-12 flex flex-col items-center justify-center">
            <Music size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium mb-2">No Playlists Yet</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first playlist to organize your favorite songs.
            </p>
            <Button onClick={() => setIsCreating(true)}>Create Playlist</Button>
          </div>
        ) : (
          playlists.map(playlist => (
            <Card 
              key={playlist.id}
              className="hover:bg-secondary/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/playlists/${playlist.id}`)}
            >
              <CardHeader>
                <CardTitle className="truncate">{playlist.name}</CardTitle>
                <CardDescription>{playlist.songs.length} songs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {playlist.songs.slice(0, 4).map((song, index) => (
                    <div 
                      key={`${song.videoId}-${index}`} 
                      className="h-16 w-16 rounded-md overflow-hidden"
                    >
                      <img 
                        src={song.thumbnail} 
                        alt="" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                  {playlist.songs.length === 0 && (
                    <div className="h-16 w-16 rounded-md bg-secondary flex items-center justify-center">
                      <Music size={24} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
  
  // Render playlist detail view
  const renderPlaylistDetail = () => {
    if (!selectedPlaylist) return null;
    
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate('/playlists')}
        >
          ← Back to Playlists
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{selectedPlaylist.name}</h1>
            {selectedPlaylist.description && (
              <p className="text-muted-foreground mt-1">{selectedPlaylist.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>{selectedPlaylist.songs.length} songs</span>
              <span>•</span>
              <span>{getTotalDuration()} total</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              className="flex items-center gap-2" 
              onClick={playPlaylist}
              disabled={selectedPlaylist.songs.length === 0}
            >
              <Play size={18} />
              <span>Play All</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit size={18} />
              <span>Edit</span>
            </Button>
            
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={handleDeletePlaylist}
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </Button>
          </div>
        </div>
        
        {isEditing && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Edit Playlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
                <Input
                  id="edit-name"
                  value={selectedPlaylist.name}
                  onChange={(e) => setSelectedPlaylist({...selectedPlaylist, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                <Input
                  id="edit-description"
                  value={selectedPlaylist.description}
                  onChange={(e) => setSelectedPlaylist({...selectedPlaylist, description: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={() => {
                const updatedPlaylists = playlists.map(p => 
                  p.id === selectedPlaylist.id ? selectedPlaylist : p
                );
                setPlaylists(updatedPlaylists);
                savePlaylists(updatedPlaylists);
                setIsEditing(false);
                toast.success('Playlist updated');
              }}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        )}
        
        <div className="space-y-4">
          {currentSong && (
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full md:w-auto"
              onClick={addCurrentSongToPlaylist}
            >
              <PlusCircle size={18} />
              <span>Add Current Song to Playlist</span>
            </Button>
          )}
          
          <ScrollArea className="h-[50vh]">
            {selectedPlaylist.songs.length === 0 ? (
              <div className="glass-panel p-8 flex flex-col items-center justify-center">
                <Music size={36} className="text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">
                  This playlist is empty. Add songs while listening to music.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPlaylist.songs.map((song, index) => (
                  <div key={`${song.videoId}-${index}`} className="relative group">
                    <TrackItem
                      song={song}
                      isActive={currentSong?.videoId === song.videoId}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSongFromPlaylist(index);
                      }}
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container max-w-5xl animate-in fade-in">
      {selectedPlaylist ? renderPlaylistDetail() : renderPlaylistListing()}
    </div>
  );
};

export default Playlists;
