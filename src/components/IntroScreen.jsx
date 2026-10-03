import React, { useState } from 'react';

export default function IntroScreen({
  logoSrc,
  totalMedia,
  onStart,
  onToggleFullscreen,
  isFullscreen
}) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleStart = () => {
    // 1. Invoca onStart imediatamente no evento de clique para autorizar áudio e Fullscreen nativo
    onStart();
    // 2. Dispara animação de dissolução suave da tela inicial
    setIsFadingOut(true);
  };

  return (
    <div className={`intro-screen ${isFadingOut ? 'fade-out' : ''}`}>
      {/* Caixa da Logo com Brilho Dourado */}
      <div className="intro-logo-box">
        <div className="intro-logo-glow" />
        <img
          src={logoSrc}
          alt="Centro Educacional Pré-Militar - CEPM Porto Velho"
          className="intro-logo"
        />
      </div>

      {/* Título Oficial e Valores Institucionais */}
      <div className="intro-title-box">
        <h1 className="intro-main-title">Centro Educacional Pré-Militar</h1>
        <h2 className="intro-location">Porto Velho</h2>
        <p className="intro-pillars">
          DISCIPLINA <span className="separator">•</span> RESPEITO <span className="separator">•</span> SUPERAÇÃO
        </p>
        <p className="intro-motto">Formação para a Vida</p>
      </div>

      {/* Ações Principais */}
      <div className="intro-actions">
        <button
          className="btn-start-presentation"
          onClick={handleStart}
          autoFocus
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Iniciar Apresentação ({totalMedia} Fotos)
        </button>

        <button
          className="btn-fullscreen-toggle"
          onClick={onToggleFullscreen}
          title="Alternar Tela Cheia (F)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isFullscreen ? (
              <>
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </>
            ) : (
              <>
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </>
            )}
          </svg>
          {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
        </button>
      </div>

      {/* Atalhos de Teclado Discretos */}
      <div className="intro-shortcuts">
        <span className="shortcut-pill"><span className="kbd-badge">Espaço</span> Pausar/Play</span>
        <span className="shortcut-pill"><span className="kbd-badge">→</span> Próxima</span>
        <span className="shortcut-pill"><span className="kbd-badge">←</span> Anterior</span>
        <span className="shortcut-pill"><span className="kbd-badge">F</span> Tela Cheia</span>
        <span className="shortcut-pill"><span className="kbd-badge">M</span> Música</span>
      </div>
    </div>
  );
}
