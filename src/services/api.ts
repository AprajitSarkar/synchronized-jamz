
import { toast } from "sonner";

// Base Interfaces
export interface PipedInstance {
  name: string;
  api_url: string;
  locations: string;
  health?: number;
  uptime_24h: number;
  uptime_7d: number;
  uptime_30d: number;
  latency?: number;
  last_checked?: string;
  version?: string;
  registered?: number;
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
      console.log("Fetching instances from API...");
      const response = await fetch("https://piped-instances.kavin.rocks");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch instances: ${response.status} ${response.statusText}`);
      }
      
      const instances = await response.json();
      console.log("Instances response:", instances);
      
      if (!Array.isArray(instances)) {
        console.error("Instances response is not an array:", instances);
        toast.error("Invalid server list format");
        return [];
      }
      
      // Filter instances by health (using uptime as a proxy if health is not available)
      this.instances = instances.filter((instance: PipedInstance) => {
        return instance.uptime_24h >= 98;
      });
      
      console.log("Filtered instances:", this.instances);
      
      // Sort by uptime and latency for best performance
      this.instances.sort((a: PipedInstance, b: PipedInstance) => {
        if (b.uptime_7d !== a.uptime_7d) return b.uptime_7d - a.uptime_7d;
        // If latency is available, use it as a secondary sort
        if (a.latency && b.latency) return a.latency - b.latency;
        return 0;
      });
      
      if (this.instances.length > 0) {
        await this.setInstance(this.instances[0]);
      } else {
        toast.error("No healthy server instances found");
      }
      
      return this.instances;
    } catch (error) {
      console.error("Failed to load instances:", error);
      toast.error("Failed to load server instances");
      return [];
    }
  }

  // Set the current active instance
  async setInstance(instance: PipedInstance): Promise<boolean> {
    try {
      // Basic connectivity check
      const healthCheck = await fetch(`${instance.api_url}/healthcheck`)
        .then(res => res.ok ? { status: "healthy" } : { status: "unhealthy" })
        .catch(() => ({ status: "unhealthy" }));
      
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
