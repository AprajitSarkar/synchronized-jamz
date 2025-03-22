
import React from 'react';
import { Song } from '@/services/api';
import TrackItem from './TrackItem';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface MusicGridProps {
  title: string;
  songs: Song[];
  isLoading: boolean;
  errorMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const MusicGrid: React.FC<MusicGridProps> = ({
  title,
  songs,
  isLoading,
  errorMessage,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="grid grid-cols-1 gap-2 animate-pulse">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-muted rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (errorMessage) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (songs.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No results found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="space-y-2 animate-in fade-in">
        {songs.map((song, index) => (
          <TrackItem key={`${song.videoId}-${index}`} song={song} isActive={false} />
        ))}
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={onLoadMore} 
            disabled={isLoadingMore}
            className="w-full sm:w-auto"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MusicGrid;
