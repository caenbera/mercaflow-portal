'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Truck, Handshake, Calculator, Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState, useEffect, useRef } from 'react';

export function Hero() {
  const t = useTranslations('LandingPageHero');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isReady = false;

    const handleVideoReady = () => {
      if (isReady) return;
      isReady = true;
      setIsLoading(false);
      video.pause();
      video.currentTime = 0;
    };

    const loadingFallback = setTimeout(() => {
      if (!isReady) handleVideoReady();
    }, 5000);

    if (video.readyState >= 2) {
      handleVideoReady();
    } else {
      video.addEventListener('loadeddata', handleVideoReady);
    }

    const handleScroll = () => {
      const videoEl = videoRef.current;
      const containerEl = containerRef.current;
      if (!videoEl || !containerEl || !videoEl.duration) return;

      const rect = containerEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      if (rect.bottom < 0 || rect.top > windowHeight) return;
      
      const scrollTop = -rect.top;
      const maxScroll = containerEl.scrollHeight - windowHeight;
      const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));
      
      videoEl.currentTime = progress * videoEl.duration;
      
      const scrollIndicator = scrollIndicatorRef.current;
      if (scrollIndicator) {
        scrollIndicator.style.opacity = progress > 0.05 ? '0' : '1';
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger inicial para establecer el frame 0
    handleScroll();

    return () => {
      clearTimeout(loadingFallback);
      if (video) {
        video.removeEventListener('loadeddata', handleVideoReady);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div className={`preloader ${!isLoading ? 'loaded' : ''}`}>
        <div className="loader-text">Cargando experiencia...</div>
      </div>

      <div ref={containerRef} className="hero-scroll-container">
        <div className="scroll-video-wrapper">
          <video
            ref={videoRef}
            className="scroll-video"
            preload="auto"
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
          >
            <source src="/hero-video.webm" type="video/webm" />
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          
          <div ref={scrollIndicatorRef} className="scroll-indicator">
            <span>Desplázate</span>
            <svg className="scroll-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
