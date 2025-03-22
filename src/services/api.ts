
import { toast } from "sonner";

// Base Interfaces
export interface PipedInstance {
  name: string;
  api_url: string;
  locations: string[];
  health: number;
  latency: number;
  last_check: string;
}

export interface Song {
  title: string;
  videoId: string;
  author: string;
  authorId: string;
  duration: string;
  thumbnail: string;
  uploaded: string;
  views: number;
}

export interface AudioStream {
  url: string;
  format: string;
  quality: string;
  bitrate: number;
}

export interface PipedSongResponse {
  title: string;
  description: string;
  duration: number;
  audioStreams: AudioStream[];
  thumbnailUrl: string;
  artist: string;
  category: string;
  relatedStreams: Song[];
}

export interface PlaylistInfo {
  name: string;
  thumbnailUrl: string;
  description: string;
  videos: Song[];
}

export interface SearchResults {
  items: Song[];
  nextpage?: string;
}

// API Client for VibeYou Jam Session
class ApiClient {
  private baseUrl: string = "";
  private instances: PipedInstance[] = [];
  private selectedInstance: PipedInstance | null = null;

  // Cache search results for better performance
  private cache: Record<string, { data: any; timestamp: number }> = {};
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.loadInstances();
  }

  // Load available Piped instances
  async loadInstances(): Promise<PipedInstance[]> {
    try {
      const response = await fetch("https://piped-instances.kavin.rocks");
      const data = await response.json();
      this.instances = data.instances.filter((instance: PipedInstance) => instance.health >= 80);
      
      // Sort by health and latency for best performance
      this.instances.sort((a, b) => {
        if (b.health !== a.health) return b.health - a.health;
        return a.latency - b.latency;
      });
      
      if (this.instances.length > 0) {
        await this.setInstance(this.instances[0]);
      }
      
      return this.instances;
    } catch (error) {
      toast.error("Failed to load server instances");
      console.error("Failed to load instances:", error);
      return [];
    }
  }

  // Set the current active instance
  async setInstance(instance: PipedInstance): Promise<boolean> {
    try {
      // Verify the instance is healthy
      const healthCheck = await fetch(`${instance.api_url}/healthcheck`).then(res => res.json());
      
      if (healthCheck.status === "healthy") {
        this.selectedInstance = instance;
        this.baseUrl = instance.api_url;
        localStorage.setItem("selectedInstance", JSON.stringify(instance));
        return true;
      }
      
      toast.error(`Instance ${instance.name} is unhealthy`);
      return false;
    } catch (error) {
      toast.error(`Failed to connect to ${instance.name}`);
      console.error("Instance health check failed:", error);
      return false;
    }
  }

  // Get selected instance
  getSelectedInstance(): PipedInstance | null {
    return this.selectedInstance;
  }

  // Get all available instances
  getInstances(): PipedInstance[] {
    return this.instances;
  }

  // Search for music
  async searchMusic(query: string, filter: string = "music_songs"): Promise<SearchResults> {
    if (!this.baseUrl) {
      throw new Error("No instance selected");
    }

    const cacheKey = `search:${query}:${filter}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}&filter=${filter}`);
      const data = await response.json();
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Search failed:", error);
      throw new Error("Failed to search for music");
    }
  }

  // Get stream details for a song
  async getStreamDetails(videoId: string): Promise<PipedSongResponse> {
    if (!this.baseUrl) {
      throw new Error("No instance selected");
    }

    const cacheKey = `stream:${videoId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/streams/${videoId}`);
      const data = await response.json();
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to get stream details:", error);
      throw new Error("Failed to get song details");
    }
  }

  // Get playlist details
  async getPlaylist(playlistId: string): Promise<PlaylistInfo> {
    if (!this.baseUrl) {
      throw new Error("No instance selected");
    }

    const cacheKey = `playlist:${playlistId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/playlists/${playlistId}`);
      const data = await response.json();
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Failed to get playlist:", error);
      throw new Error("Failed to load playlist");
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!this.baseUrl) {
      throw new Error("No instance selected");
    }

    try {
      const response = await fetch(`${this.baseUrl}/suggestions?query=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to get suggestions:", error);
      return [];
    }
  }

  // Cache helpers
  private saveToCache(key: string, data: any): void {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache[key];
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      delete this.cache[key];
      return null;
    }
    
    return cached.data;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
