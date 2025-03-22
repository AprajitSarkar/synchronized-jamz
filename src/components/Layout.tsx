
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import MusicPlayer from './MusicPlayer';
import { useServer } from '@/context/ServerContext';
import ServerSelector from './ServerSelector';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { selectedInstance, isLoading } = useServer();
  const [showServerSelector, setShowServerSelector] = useState(false);
  const location = useLocation();
  
  // Check if we need to show server selector on first load
  useEffect(() => {
    if (!isLoading && !selectedInstance) {
      setShowServerSelector(true);
    }
  }, [isLoading, selectedInstance]);

  // Animation effect for page transitions
  const [transitioning, setTransitioning] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fade-in");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitioning(true);
      setTransitionStage("fade-out");
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === "fade-out") {
      setTransitionStage("fade-in");
      setDisplayLocation(location);
    } else if (transitionStage === "fade-in") {
      setTransitioning(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navigation */}
      <Navigation onServerSelect={() => setShowServerSelector(true)} />
      
      {/* Main Content with Transitions */}
      <main 
        className={`flex-1 px-4 py-6 md:px-8 md:py-10 animate-${transitionStage}`}
        onAnimationEnd={handleAnimationEnd}
      >
        {transitioning ? (
          <div key={displayLocation.pathname}>{children}</div>
        ) : (
          <div key={location.pathname}>{children}</div>
        )}
      </main>
      
      {/* Music Player (Fixed at bottom) */}
      <MusicPlayer />
      
      {/* Server Selector Modal */}
      {showServerSelector && (
        <ServerSelector onClose={() => setShowServerSelector(false)} />
      )}
    </div>
  );
};

export default Layout;
