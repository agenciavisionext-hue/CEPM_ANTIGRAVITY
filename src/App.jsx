import React, { useState, useEffect, useCallback, useRef } from 'react';
import manifest from './media-manifest.json';
import IntroScreen from './components/IntroScreen';
import Slideshow from './components/Slideshow';
import AudioPlayer from './components/AudioPlayer';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.18); // Volume inicial padrão de 18%

  const initialTrack = manifest.audioTracks && manifest.audioTracks.length > 0 ? manifest.audioTracks[0] : null;
  const [audioSrc, setAudioSrc] = useState(initialTrack ? initialTrack.path : null);
  const [audioTitle, setAudioTitle] = useState(initialTrack ? initialTrack.title : '');

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const audioPlayerRef = useRef(null);

  // Monitoramento do estado de tela cheia nativa do navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Alternar Modo Tela Cheia
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Alternância de tela cheia restrita pelo navegador:', err.message);
    }
  }, []);

  // Iniciar Apresentação: acionado dentro do clique do usuário para liberar áudio e fullscreen
  const handleStartPresentation = useCallback(() => {
    setHasStarted(true);

    // 1. Toca áudio imediatamente no contexto de clique
    if (audioPlayerRef.current && audioSrc) {
      audioPlayerRef.current.playNow();
    }

    // 2. Entra em tela cheia no contexto do clique
    toggleFullscreen().catch(() => {});

    // 3. Remove a camada de abertura após o fade-out suave de 1.2s
    setTimeout(() => {
      setShowIntro(false);
    }, 1200);
  }, [toggleFullscreen, audioSrc]);

  // Alternar Mute
  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => {
      const willBeUnmuted = prev;
      if (willBeUnmuted && volume === 0) {
        setVolume(0.18);
      }
      return !prev;
    });
  }, [volume]);

  // Alterar Volume
  const handleChangeVolume = useCallback((newVolume) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Selecionar arquivo de áudio local manualmente (+ MP3)
  const handleCustomAudioSelected = useCallback((file) => {
    try {
      const customUrl = URL.createObjectURL(file);
      setAudioSrc(customUrl);
      setAudioTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      setIsMuted(false);
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.playNow();
        }
      }, 50);
    } catch (err) {
      console.error('Falha ao carregar áudio selecionado:', err);
    }
  }, []);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Player de Áudio Ambiente em Segundo Plano */}
      <AudioPlayer
        ref={audioPlayerRef}
        audioSrc={audioSrc}
        isEnabled={hasStarted}
        volume={volume}
        isMuted={isMuted}
        isVideoPlaying={isVideoPlaying}
      />

      {/* Slideshow Principal (Já montado em segundo plano para decodificação instantânea da primeira foto) */}
      <Slideshow
        mediaList={manifest.items}
        logoSrc={manifest.logo}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isMuted={isMuted}
        volume={volume}
        hasAudioTrack={Boolean(audioSrc)}
        audioTitle={audioTitle}
        onToggleMute={handleToggleMute}
        onChangeVolume={handleChangeVolume}
        onCustomAudioSelected={handleCustomAudioSelected}
        onVideoPlaybackChange={setIsVideoPlaying}
      />

      {/* Tela de Abertura Oficial CEPM */}
      {showIntro && (
        <IntroScreen
          logoSrc={manifest.logo}
          totalMedia={manifest.totalMedia}
          onStart={handleStartPresentation}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}
    </main>
  );
}
