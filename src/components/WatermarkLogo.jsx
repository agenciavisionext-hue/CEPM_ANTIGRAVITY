import React from 'react';

export default function WatermarkLogo({ logoSrc }) {
  if (!logoSrc) return null;

  return (
    <div className="watermark-container" aria-hidden="true">
      <img
        src={logoSrc}
        alt="Centro Educacional Pré-Militar - CEPM Porto Velho"
        className="watermark-img"
        loading="eager"
        fetchpriority="high"
      />
    </div>
  );
}
