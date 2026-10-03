import React, { useState, useEffect, useRef, useCallback } from 'react';
import SlideLayer from './SlideLayer';
import ControlsOverlay from './ControlsOverlay';
import WatermarkLogo from './WatermarkLogo';
import { usePreloadQueue } from '../hooks/usePreloadQueue';

const PHOTO_DURATION_MS = 6000;
const PROGRESS_TICK_MS = 100;
const IDLE_TIMEOUT_MS = 3000;

export default function Slideshow({
  mediaList,
  logoSrc,
  isFullscreen,
  onToggleFullscreen,
  isMuted,
  volume,
  hasAudioTrack,
  audioTitle,
  onToggleMute,
  onChangeVolume,
  onCustomAudioSelected,
  onVideoPlaybackChange
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  // Buffer duplo para crossfade contínuo sem tela preta (Slot A e Slot B)
  const [activeSlot, setActiveSlot] = useState('A');
  const [slotA, setSlotA] = useState({ media: mediaList[0] || null, kenBurnsVariant: 0 });
  const [slotB, setSlotB] = useState({ media: null, kenBurnsVariant: 1 });

  const progressRef = useRef(0);
  const idleTimerRef = useRef(null);
  const isVideoPlayingRef = useRef(false);
  const kenBurnsCounterRef = useRef(0);

  // Fila de pré-carregamento inteligente na GPU e memória
  usePreloadQueue(mediaList, currentIndex);

  const total = mediaList.length;

  // Função para transição para um índice com crossfade suave de 1.2s
  const goToIndex = useCallback((newIndex) => {
    if (total === 0) return;
    const normalizedIndex = (newIndex + total) % total;
    const nextMedia = mediaList[normalizedIndex];
    kenBurnsCounterRef.current += 1;
    const nextVariant = kenBurnsCounterRef.current;

    setActiveSlot(prevSlot => {
      if (prevSlot === 'A') {
        setSlotB({ media: nextMedia, kenBurnsVariant: nextVariant });
        return 'B';
      } else {
        setSlotA({ media: nextMedia, kenBurnsVariant: nextVariant });
        return 'A';
      }
    });

    if (isVideoPlayingRef.current) {
      isVideoPlayingRef.current = false;
      onVideoPlaybackChange(false);
    }

    setCurrentIndex(normalizedIndex);
    progressRef.current = 0;
    setProgressPercent(0);
  }, [mediaList, total, onVideoPlaybackChange]);

  // Próxima fotografia
  const nextMedia = useCallback(() => {
    if (isShuffle && total > 1) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * total);
      } while (randomIndex === currentIndex);
      goToIndex(randomIndex);
    } else {
      goToIndex(currentIndex + 1);
    }
  }, [isShuffle, total, currentIndex, goToIndex]);

  // Fotografia anterior
  const prevMedia = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  // Alternar play / pause
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Alternar aleatório
  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  // Auto-hide dos controles após 3 segundos de inatividade
  const handleUserActivity = useCallback(() => {
    setIsControlsVisible(true);
    setIsIdle(false);

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      setIsControlsVisible(false);
      setIsIdle(true);
    }, IDLE_TIMEOUT_MS);
  }, []);

  // Inicializa o temporizador de atividade/inatividade
  useEffect(() => {
    handleUserActivity();
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [handleUserActivity]);

  // Atalhos de teclado globais da apresentação
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
        if (e.code === 'Space') {
          e.preventDefault();
        }
      }

      handleUserActivity();

      switch (e.code) {
        case 'ArrowRight':
          e.preventDefault();
          nextMedia();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevMedia();
          break;
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyF':
          e.preventDefault();
          onToggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          onToggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextMedia, prevMedia, togglePlay, onToggleFullscreen, onToggleMute, handleUserActivity]);

  // Loop de avanço automático das fotografias (exatamente 6 segundos por foto)
  const currentMedia = mediaList[currentIndex];
  const isCurrentVideo = currentMedia?.type === 'video';

  useEffect(() => {
    if (!isPlaying || isCurrentVideo) {
      return;
    }

    const interval = setInterval(() => {
      progressRef.current += PROGRESS_TICK_MS;
      const pct = Math.min(100, (progressRef.current / PHOTO_DURATION_MS) * 100);
      setProgressPercent(pct);

      if (progressRef.current >= PHOTO_DURATION_MS) {
        progressRef.current = 0;
        nextMedia();
      }
    }, PROGRESS_TICK_MS);

    return () => clearInterval(interval);
  }, [isPlaying, isCurrentVideo, nextMedia]);

  // Tratamento de Vídeos
  const handleVideoEnded = useCallback(() => {
    isVideoPlayingRef.current = false;
    onVideoPlaybackChange(false);
    nextMedia();
  }, [nextMedia, onVideoPlaybackChange]);

  const handleVideoPlay = useCallback(() => {
    isVideoPlayingRef.current = true;
    onVideoPlaybackChange(true);
  }, [onVideoPlaybackChange]);

  return (
    <div className={`slideshow-viewport ${isIdle ? 'theater-idle' : ''}`}>
      {/* Barra de Progresso Fina Dourada no Topo */}
      <div className="slide-progress-bar-container" aria-hidden="true">
        <div
          className="slide-progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Camada do Slot A */}
      <SlideLayer
        media={slotA.media}
        isActive={activeSlot === 'A'}
        isIncoming={activeSlot !== 'A'}
        kenBurnsVariant={slotA.kenBurnsVariant}
        isPlaying={isPlaying}
        onVideoEnded={handleVideoEnded}
        onVideoPlay={handleVideoPlay}
      />

      {/* Camada do Slot B */}
      <SlideLayer
        media={slotB.media}
        isActive={activeSlot === 'B'}
        isIncoming={activeSlot !== 'B'}
        kenBurnsVariant={slotB.kenBurnsVariant}
        isPlaying={isPlaying}
        onVideoEnded={handleVideoEnded}
        onVideoPlay={handleVideoPlay}
      />

      {/* Logo Oficial Permanente no Canto Superior Direito */}
      <WatermarkLogo logoSrc={logoSrc} />

      {/* Controles OSD Flutuantes */}
      <ControlsOverlay
        isVisible={isControlsVisible}
        isPlaying={isPlaying}
        currentIndex={currentIndex}
        totalMedia={total}
        isShuffle={isShuffle}
        isFullscreen={isFullscreen}
        isMuted={isMuted}
        volume={volume}
        hasAudioTrack={hasAudioTrack}
        audioTitle={audioTitle}
        onTogglePlay={togglePlay}
        onPrev={prevMedia}
        onNext={nextMedia}
        onToggleShuffle={toggleShuffle}
        onToggleFullscreen={onToggleFullscreen}
        onToggleMute={onToggleMute}
        onChangeVolume={onChangeVolume}
        onCustomAudioSelected={onCustomAudioSelected}
        onUserActivity={handleUserActivity}
      />
    </div>
  );
}
