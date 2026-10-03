import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const AudioPlayer = forwardRef(function AudioPlayer(
  {
    audioSrc,
    isEnabled,
    volume,
    isMuted,
    isVideoPlaying
  },
  ref
) {
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);

  // Expõe métodos imperativos para tocar imediatamente no clique do usuário
  useImperativeHandle(ref, () => ({
    playNow: () => {
      if (audioRef.current && !isMuted && audioSrc) {
        audioRef.current.play().catch(err => {
          console.warn('Interação necessária para reprodução do áudio:', err.message);
        });
      }
    },
    pauseNow: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    },
    getAudioElement: () => audioRef.current
  }));

  // Gerenciamento de Volume e Audio Ducking Suave durante reprodução de vídeos
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    if (isMuted) {
      audio.muted = true;
      audio.volume = 0;
      return;
    }

    audio.muted = false;

    // Quando vídeo com áudio estiver ativo: reduzir volume para ~4% ou proporcional
    // Ao terminar o vídeo: restaurar suavemente para o volume original
    const targetVolume = isVideoPlaying ? Math.min(volume * 0.22, 0.04) : volume;
    const clampedTarget = Math.max(0, Math.min(1, targetVolume));

    // Rampa suave de transição de volume (fade gradual)
    const step = (clampedTarget - audio.volume) / 10;
    let iterations = 0;

    fadeIntervalRef.current = setInterval(() => {
      iterations++;
      if (iterations >= 10 || Math.abs(audio.volume - clampedTarget) < 0.01) {
        audio.volume = clampedTarget;
        clearInterval(fadeIntervalRef.current);
      } else {
        const nextVol = Math.max(0, Math.min(1, audio.volume + step));
        audio.volume = nextVol;
      }
    }, 40);

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [volume, isMuted, isVideoPlaying]);

  // Controle de Play / Pause da música ambiente
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) return;

    if (isEnabled && !isMuted) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log('Autoplay aguardando interação do usuário:', err.message);
        });
      }
    } else if (isMuted) {
      audio.muted = true;
    }
  }, [isEnabled, audioSrc, isMuted]);

  if (!audioSrc) return null;

  return (
    <audio
      ref={audioRef}
      src={audioSrc}
      loop
      preload="auto"
      style={{ display: 'none' }}
    />
  );
});

export default AudioPlayer;
