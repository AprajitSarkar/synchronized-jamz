
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Clock, ListMusic } from 'lucide-react';

const Library = () => {
  // This is a placeholder implementation
  // In a full app, we would implement actual playlist/favorites storage
  
  return (
    <div className="container max-w-5xl animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Your Library</h1>
        
        <Tabs defaultValue="favorites">
          <TabsList className="mb-6">
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="history">Recently Played</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>
          
          <TabsContent value="favorites">
            <div className="glass-panel p-16 flex flex-col items-center justify-center">
              <Heart size={48} className="text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">No Favorites Yet</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Add songs to your favorites by clicking the heart icon while playing a song.
              </p>
              <Button>Explore Music</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="glass-panel p-16 flex flex-col items-center justify-center">
              <Clock size={48} className="text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">No Recently Played Songs</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Songs you play will appear here so you can easily find them again.
              </p>
              <Button>Start Listening</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="playlists">
            <div className="glass-panel p-16 flex flex-col items-center justify-center">
              <ListMusic size={48} className="text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">No Playlists Created</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create playlists to organize your favorite music and share with friends.
              </p>
              <Button>Create Playlist</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Library;
