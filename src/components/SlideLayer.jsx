import React, { useEffect, useRef } from 'react';

export default function SlideLayer({
  media,
  isActive,
  isIncoming,
  kenBurnsVariant = 0,
  isPlaying = true,
  onVideoEnded,
  onVideoPlay
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (media?.type === 'video' && video) {
      if (isActive) {
        if (isPlaying) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.warn('Autoplay do vídeo prevenido pelo navegador:', err);
            });
          }
        } else {
          video.pause();
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }
  }, [isActive, isPlaying, media]);

  if (!media) return null;

  const kenBurnsClasses = ['ken-burns-in', 'ken-burns-out', 'ken-burns-center'];
  const kenBurnsClass = isActive ? kenBurnsClasses[kenBurnsVariant % kenBurnsClasses.length] : '';

  return (
    <div className={`slide-layer ${isActive ? 'active' : ''} ${isIncoming ? 'incoming' : ''}`}>
      {/* Camada 1: Fundo ampliado e desfocado da própria fotografia */}
      {media.type === 'image' ? (
        <img
          src={media.relativePath}
          alt=""
          className="slide-backdrop"
          aria-hidden="true"
        />
      ) : (
        <video
          src={media.relativePath}
          className="slide-backdrop"
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      )}

      {/* Camada 2: Vinheta radial suave para realçar o conteúdo central */}
      <div className="slide-vignette" />

      {/* Camada 3: Fotografia principal inteira e nítida (sem cortes) */}
      <div className="slide-foreground">
        {media.type === 'image' ? (
          <img
            src={media.relativePath}
            alt={media.filename}
            className={`slide-media-main ${kenBurnsClass}`}
            fetchpriority={isActive ? 'high' : 'low'}
          />
        ) : (
          <video
            ref={videoRef}
            src={media.relativePath}
            className="slide-video-main"
            playsInline
            controls={false}
            onEnded={onVideoEnded}
            onPlay={onVideoPlay}
          />
        )}
      </div>
    </div>
  );
}
