
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiClient, Song } from '@/services/api';
import SearchBar from '@/components/SearchBar';
import MusicGrid from '@/components/MusicGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Search = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('songs');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Update query when URL changes
  useEffect(() => {
    const newQuery = queryParams.get('q') || '';
    setQuery(newQuery);
    
    if (newQuery) {
      performSearch(newQuery);
    } else {
      setSongs([]);
      setNextPageToken(null);
    }
  }, [location.search]);
  
  const performSearch = async (searchQuery: string, filter = activeTab, nextPage = null) => {
    if (!searchQuery.trim()) return;
    
    const isLoadingMoreResults = !!nextPage;
    
    if (isLoadingMoreResults) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setSongs([]);
    }
    
    setError('');
    
    try {
      let filterType = 'music_songs';
      
      switch (filter) {
        case 'songs':
          filterType = 'music_songs';
          break;
        case 'videos':
          filterType = 'music_videos';
          break;
        case 'albums':
          filterType = 'music_albums';
          break;
        case 'playlists':
          filterType = 'music_playlists';
          break;
        default:
          filterType = 'music_songs';
      }
      
      const results = await apiClient.searchMusic(searchQuery, filterType);
      
      if (isLoadingMoreResults && nextPage) {
        // Append results for pagination
        setSongs(prevSongs => [...prevSongs, ...results.items]);
      } else {
        setSongs(results.items);
      }
      
      setNextPageToken(results.nextpage || null);
    } catch (err) {
      console.error("Search failed:", err);
      setError('Search failed. Please try again.');
    } finally {
      if (isLoadingMoreResults) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };
  
  const handleSearch = (searchQuery: string) => {
    if (searchQuery === query) {
      // If same query, just refresh
      performSearch(searchQuery);
    } else {
      // Update URL to reflect the new search
      const newUrl = searchQuery ? `/search?q=${encodeURIComponent(searchQuery)}` : '/search';
      window.history.pushState({}, '', newUrl);
      
      // The useEffect will handle the actual search when location changes
      setQuery(searchQuery);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (query) {
      performSearch(query, value);
    }
  };
  
  const loadMore = () => {
    if (nextPageToken && query) {
      performSearch(query, activeTab, nextPageToken);
    }
  };
  
  return (
    <div className="container max-w-5xl animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Search</h1>
        
        <SearchBar 
          onSearch={handleSearch} 
          initialQuery={query} 
          className="mb-6"
        />
        
        {query && (
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="songs">Songs</TabsTrigger>
              <TabsTrigger value="videos">Music Videos</TabsTrigger>
              <TabsTrigger value="albums">Albums</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
            </TabsList>
            
            <TabsContent value="songs">
              <MusicGrid
                title={`Results for "${query}"`}
                songs={songs}
                isLoading={isLoading}
                errorMessage={error}
                onLoadMore={loadMore}
                hasMore={!!nextPageToken}
                isLoadingMore={isLoadingMore}
              />
            </TabsContent>
            
            <TabsContent value="videos">
              <MusicGrid
                title={`Music Videos for "${query}"`}
                songs={songs}
                isLoading={isLoading}
                errorMessage={error}
                onLoadMore={loadMore}
                hasMore={!!nextPageToken}
                isLoadingMore={isLoadingMore}
              />
            </TabsContent>
            
            <TabsContent value="albums">
              <MusicGrid
                title={`Albums for "${query}"`}
                songs={songs}
                isLoading={isLoading}
                errorMessage={error}
                onLoadMore={loadMore}
                hasMore={!!nextPageToken}
                isLoadingMore={isLoadingMore}
              />
            </TabsContent>
            
            <TabsContent value="playlists">
              <MusicGrid
                title={`Playlists for "${query}"`}
                songs={songs}
                isLoading={isLoading}
                errorMessage={error}
                onLoadMore={loadMore}
                hasMore={!!nextPageToken}
                isLoadingMore={isLoadingMore}
              />
            </TabsContent>
          </Tabs>
        )}
        
        {!query && !isLoading && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-lg">
              Enter a search term to find music
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
