
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { useServer } from '@/context/ServerContext';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  initialQuery?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  initialQuery = '', 
  className = '' 
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const { selectedInstance } = useServer();
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Handle click outside of suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch suggestions as the user types
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 2 && selectedInstance) {
        try {
          const fetchedSuggestions = await apiClient.getSearchSuggestions(query);
          setSuggestions(fetchedSuggestions.slice(0, 8));
          setShowSuggestions(true);
        } catch (error) {
          console.error("Failed to get suggestions:", error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedInstance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for songs, artists, or albums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim().length > 2) {
              setShowSuggestions(true);
            }
          }}
          className={`pr-20 pl-10 py-6 rounded-full bg-secondary/50 focus:bg-secondary border-none ${
            isFocused ? 'ring-2 ring-accent/20' : ''
          }`}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-[56px] top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={clearSearch}
          >
            <X size={18} />
          </Button>
        )}
        
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9"
        >
          <Search size={18} />
        </Button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg bg-popover shadow-lg border animate-in fade-in slide-down"
        >
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
