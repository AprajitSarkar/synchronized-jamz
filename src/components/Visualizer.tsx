
import React, { useEffect, useState, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';

const Visualizer: React.FC = () => {
  const { isPlaying } = usePlayer();
  const [bars, setBars] = useState<number[]>(Array(20).fill(3));
  const frameRef = useRef<number>(0);
  
  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(20).fill(3));
      cancelAnimationFrame(frameRef.current);
      return;
    }
    
    const generateBars = () => {
      // Create a smooth, sine-wave-like animation for the bars
      const newBars = Array(20).fill(0).map((_, i) => {
        const time = Date.now() / 1000;
        const frequency = 1 + i * 0.1;
        const amplitude = Math.min(20, 5 + Math.sin(i * 0.5) * 5);
        
        // Generate height based on sine wave with frequency and phase offset
        const height = amplitude * (0.5 + Math.sin(time * frequency + i * 0.2) * 0.5);
        
        return Math.max(3, height);
      });
      
      setBars(newBars);
      frameRef.current = requestAnimationFrame(generateBars);
    };
    
    frameRef.current = requestAnimationFrame(generateBars);
    
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying]);
  
  return (
    <div className="audio-visualizer-container w-full">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`audio-bar ${isPlaying ? 'bg-accent' : 'bg-muted'}`}
          style={{ 
            height: `${height}px`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

export default Visualizer;
