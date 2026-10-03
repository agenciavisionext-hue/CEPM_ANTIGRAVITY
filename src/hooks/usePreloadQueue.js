import { useEffect, useRef } from 'react';

export function usePreloadQueue(mediaList, currentIndex) {
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!mediaList || mediaList.length === 0) return;

    const total = mediaList.length;

    // Índices a manter em cache: anterior (-1), atual (0), próxima (+1), segunda próxima (+2)
    const indicesToKeep = [
      (currentIndex - 1 + total) % total,
      currentIndex,
      (currentIndex + 1) % total,
      (currentIndex + 2) % total
    ];

    const currentCache = cacheRef.current;

    // Pré-carrega as mídias do intervalo de proximidade
    indicesToKeep.forEach((idx) => {
      const item = mediaList[idx];
      if (!item) return;

      if (!currentCache.has(item.relativePath)) {
        if (item.type === 'image') {
          const img = new Image();
          img.src = item.relativePath;
          // Decodificação assíncrona na GPU para transição instantânea sem engasgos
          if ('decode' in img) {
            img.decode().catch(() => {
              // Decodificação cancelada se o usuário avançar rápido, seguro ignorar
            });
          }
          currentCache.set(item.relativePath, img);
        } else if (item.type === 'video') {
          const video = document.createElement('video');
          video.src = item.relativePath;
          video.preload = 'metadata';
          currentCache.set(item.relativePath, video);
        }
      }
    });

    // Limpeza de itens distantes fora da janela de proximidade para poupar memória RAM
    for (const [key, obj] of currentCache.entries()) {
      const isNeeded = indicesToKeep.some(idx => mediaList[idx]?.relativePath === key);
      if (!isNeeded) {
        if (obj instanceof HTMLVideoElement) {
          obj.src = '';
          obj.load();
        } else if (obj instanceof Image) {
          obj.src = '';
        }
        currentCache.delete(key);
      }
    }
  }, [mediaList, currentIndex]);
}
