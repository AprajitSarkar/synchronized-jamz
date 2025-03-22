import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Search, Library, Server } from 'lucide-react';
import { useServer } from '@/context/ServerContext';
import { cn } from '@/lib/utils';

interface NavigationProps {
  onServerSelect: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onServerSelect }) => {
  const location = useLocation();
  const { selectedInstance } = useServer();
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-lg shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-accent w-8 h-8 rounded-lg flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              className="w-5 h-5 text-accent-foreground"
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="font-bold text-xl">VibeSync</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          <Link to="/">
            <Button 
              variant={isActive("/") ? "default" : "ghost"} 
              size="sm" 
              className="gap-2"
            >
              <Home size={18} />
              <span>Home</span>
            </Button>
          </Link>
          <Link to="/search">
            <Button 
              variant={isActive("/search") ? "default" : "ghost"} 
              size="sm" 
              className="gap-2"
            >
              <Search size={18} />
              <span>Search</span>
            </Button>
          </Link>
          <Link to="/library">
            <Button 
              variant={isActive("/library") ? "default" : "ghost"} 
              size="sm" 
              className="gap-2"
            >
              <Library size={18} />
              <span>Library</span>
            </Button>
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-sm"
            onClick={onServerSelect}
          >
            <Server size={16} />
            <span className="truncate max-w-[100px]">
              {selectedInstance ? selectedInstance.name : "Select Server"}
            </span>
          </Button>
        </div>
      </div>

      <nav className="md:hidden fixed bottom-[72px] left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t">
        <div className="flex justify-around items-center h-14">
          <Link to="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(isActive("/") && "text-accent")}
            >
              <Home size={24} />
            </Button>
          </Link>
          <Link to="/search">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(isActive("/search") && "text-accent")}
            >
              <Search size={24} />
            </Button>
          </Link>
          <Link to="/library">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(isActive("/library") && "text-accent")}
            >
              <Library size={24} />
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
