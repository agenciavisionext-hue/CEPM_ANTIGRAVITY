import React, { useRef } from 'react';

export default function ControlsOverlay({
  isVisible,
  isPlaying,
  currentIndex,
  totalMedia,
  isShuffle,
  isFullscreen,
  isMuted,
  volume,
  hasAudioTrack,
  audioTitle,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleFullscreen,
  onToggleMute,
  onChangeVolume,
  onCustomAudioSelected,
  onUserActivity
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onCustomAudioSelected) {
      onCustomAudioSelected(file);
    }
  };

  const getAudioLabel = () => {
    if (audioTitle) {
      return `🎵 ${audioTitle}`;
    }
    if (hasAudioTrack) {
      return '🎵 Música CEPM';
    }
    return '🎵 + MP3';
  };

  return (
    <div
      className={`controls-overlay ${!isVisible ? 'hidden' : ''}`}
      onMouseMove={onUserActivity}
      onClick={onUserActivity}
      role="toolbar"
      aria-label="Controles da Apresentação"
    >
      {/* Botão Anterior */}
      <button
        className="control-btn"
        onClick={onPrev}
        title="Fotografia Anterior (Seta Esquerda)"
        aria-label="Fotografia Anterior"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="19 20 9 12 19 4 19 20"></polygon>
          <line x1="5" y1="19" x2="5" y2="5"></line>
        </svg>
      </button>

      {/* Botão Play / Pause */}
      <button
        className="control-btn primary"
        onClick={onTogglePlay}
        title={isPlaying ? "Pausar Apresentação (Espaço)" : "Continuar Apresentação (Espaço)"}
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 3 20 12 6 21 6 3"></polygon>
          </svg>
        )}
      </button>

      {/* Botão Próximo */}
      <button
        className="control-btn"
        onClick={onNext}
        title="Próxima Fotografia (Seta Direita)"
        aria-label="Próxima Fotografia"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 4 15 12 5 20 5 4"></polygon>
          <line x1="19" y1="5" x2="19" y2="19"></line>
        </svg>
      </button>

      {/* Divisor */}
      <div className="divider" />

      {/* Contador Discreto de Fotografias */}
      <div className="counter-badge" title="Fotografia atual / Total de fotos">
        <span className="current-num">{currentIndex + 1}</span> / <span>{totalMedia}</span>
      </div>

      {/* Modo de Ordem: Sequencial ou Aleatório */}
      <button
        className={`control-btn ${isShuffle ? 'active' : ''}`}
        onClick={onToggleShuffle}
        title={isShuffle ? "Modo Aleatório Ativado" : "Modo Sequencial (Ordem dos Arquivos)"}
        aria-label="Alternar Ordem Aleatória"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8"></polyline>
          <line x1="4" y1="20" x2="21" y2="3"></line>
          <polyline points="21 16 21 21 16 21"></polyline>
          <line x1="15" y1="15" x2="21" y2="21"></line>
          <line x1="4" y1="4" x2="9" y2="9"></line>
        </svg>
      </button>

      {/* Divisor */}
      <div className="divider" />

      {/* Controles de Música Ambiente */}
      <div className="volume-control-group">
        <button
          className={`control-btn ${isMuted || volume === 0 ? 'active' : ''}`}
          onClick={onToggleMute}
          title={isMuted ? "Ativar Música de Fundo (M)" : "Silenciar Música de Fundo (M)"}
          aria-label="Mudo / Som"
        >
          {isMuted || volume === 0 ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={isMuted ? 0 : volume}
          onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
          className="volume-slider"
          title={`Volume da Música: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          aria-label="Volume da música"
        />

        {/* Botão para Selecionar Áudio / MP3 Local */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="audio/*"
          onChange={handleFileChange}
        />
        <button
          className="audio-picker-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Clique para selecionar uma música local (.mp3) do computador"
        >
          {getAudioLabel()}
        </button>
      </div>

      {/* Divisor */}
      <div className="divider" />

      {/* Botão Tela Cheia */}
      <button
        className="control-btn"
        onClick={onToggleFullscreen}
        title={isFullscreen ? "Sair da Tela Cheia (F ou ESC)" : "Tela Cheia (F)"}
        aria-label="Tela Cheia"
      >
        {isFullscreen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        )}
      </button>
    </div>
  );
}
