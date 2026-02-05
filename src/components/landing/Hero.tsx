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
  const preloaderRef = useRef<HTMLDivElement>(null);
  
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const heroContainer = containerRef.current;
    const scrollIndicator = scrollIndicatorRef.current;
    const preloader = preloaderRef.current;

    if (!video || !heroContainer || !preloader) return;

    let rafId: number | null = null;
    let currentScroll = 0;
    let scrollTarget = 0;
    const smoothFactor = 0.1;

    const onVideoLoaded = () => {
      setVideoDuration(video.duration || 7);
      preloader.classList.add('loaded');
      video.pause();
      video.currentTime = 0;
      startAnimationLoop();
    };
    
    const onVideoError = () => {
      console.error('Error loading video');
      preloader.classList.add('loaded');
    };

    const initVideo = () => {
      if (video.readyState >= 2) {
        onVideoLoaded();
      } else {
        video.addEventListener('loadeddata', onVideoLoaded);
        video.addEventListener('error', onVideoError);
      }
    };
    
    const getScrollProgress = () => {
      const rect = heroContainer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const scrollTop = -rect.top;
      const maxScroll = rect.height - windowHeight;
      if (maxScroll <= 0) return 0;
      return Math.max(0, Math.min(1, scrollTop / maxScroll));
    };

    const updateVideoFromScroll = (progress: number) => {
      if (videoDuration === 0) return;
      const targetTime = progress * videoDuration;
      if (Math.abs(video.currentTime - targetTime) > 0.05) {
        video.currentTime = targetTime;
      }
      if(scrollIndicator) {
          if (progress > 0.05) {
              scrollIndicator.classList.add('hidden');
          } else {
              scrollIndicator.classList.remove('hidden');
          }
      }
    };

    const startAnimationLoop = () => {
      const animate = () => {
        const diff = scrollTarget - currentScroll;
        currentScroll += diff * smoothFactor;
        updateVideoFromScroll(currentScroll);
        rafId = requestAnimationFrame(animate);
      };
      animate();
    };

    const onScroll = () => {
      scrollTarget = getScrollProgress();
    };

    initVideo();
    window.addEventListener('scroll', onScroll, { passive: true });
    
    video.muted = true;
    video.pause();
    onScroll();

    return () => {
      video.removeEventListener('loadeddata', onVideoLoaded);
      video.removeEventListener('error', onVideoError);
      window.removeEventListener('scroll', onScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [videoDuration]);

  return (
    <>
      <div ref={preloaderRef} className="preloader">
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
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center bg-black/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl sm:text-5xl font-bold mb-6" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                {t.rich('hero_title_html', {
                  yellow: (chunks) => <span className="text-yellow-300">{chunks}</span>
                })}
              </h1>
              <p className="text-base sm:text-xl mb-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                {t.rich('hero_subtitle_html', {
                  br: () => <br className="hidden md:block" />,
                  lightYellow: (chunks) => <span className="text-yellow-200">{chunks}</span>
                })}
              </p>
              <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6 mb-12">
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
              <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex justify-center">
                <Button asChild className="w-full md:w-auto bg-accent text-white px-6 py-2.5 text-sm md:text-base md:px-8 md:py-3 font-bold hover:bg-orange-600 transition animate-pulse h-auto">
                  <a href="#cotizacion">
                    <Calculator className="mr-2" />{t('hero_cta_quote')}
                  </a>
                </Button>
                <Button asChild className="w-full md:w-auto bg-yellow-400 text-gray-900 px-6 py-2.5 text-sm md:text-base md:px-8 md:py-3 font-bold hover:bg-yellow-300 transition h-auto">
                  <a href="#muestra">
                    <Gift className="mr-2" />{t('hero_cta_sample')}
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
