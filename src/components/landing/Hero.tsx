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
    // Trigger inicial
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
          
          {/* Contenido - relative para que respete el flujo del sticky container */}
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-4 text-center text-white">
            <div className="mx-auto max-w-7xl">
              <h1 className="mb-6 text-3xl font-bold sm:text-5xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {t.rich('hero_title_html', {
                  yellow: (chunks) => <span className="text-yellow-300">{chunks}</span>
                })}
              </h1>
              
              <p className="mb-8 text-base sm:text-xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {t.rich('hero_subtitle_html', {
                  br: () => <br className="hidden md:block" />,
                  lightYellow: (chunks) => <span className="text-yellow-200">{chunks}</span>
                })}
              </p>
              
              <div className="mb-12 flex flex-col items-center justify-center space-y-4 md:flex-row md:space-x-6 md:space-y-0" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-yellow-300" />
                  <span>{t('hero_feature1')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="text-yellow-300" />
                  <span>{t('hero_feature2')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Handshake className="text-yellow-300" />
                  <span>{t('hero_feature3')}</span>
                </div>
              </div>
              
              <div className="flex flex-col justify-center space-y-4 md:flex-row md:space-x-4 md:space-y-0">
                <Button asChild className="h-auto w-full bg-accent px-6 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 animate-pulse md:w-auto md:px-8 md:py-3 md:text-base">
                  <a href="#cotizacion">
                    <Calculator className="mr-2" />
                    {t('hero_cta_quote')}
                  </a>
                </Button>
                <Button asChild className="h-auto w-full bg-yellow-400 px-6 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-yellow-300 md:w-auto md:px-8 md:py-3 md:text-base">
                  <a href="#muestra">
                    <Gift className="mr-2" />
                    {t('hero_cta_sample')}
                  </a>
                </Button>
              </div>
            </div>
          </div>
          
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
