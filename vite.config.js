import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Plugin para servir pastas de mídias, logo e áudio do CEPM com suporte a Range requests (HTTP 206)
function serveLocalFolders() {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4'
  };

  return {
    name: 'serve-local-folders',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
        const allowedPrefixes = ['/fotos-cepm/', '/logo/', '/audio/', '/AUDIO/', '/FOTOS CEPM/', '/LOGO/'];
        const isAllowed = allowedPrefixes.some(prefix => decodedUrl.startsWith(prefix));

        if (isAllowed) {
          const relativePath = decodedUrl.startsWith('/') ? decodedUrl.slice(1) : decodedUrl;
          let filePath = path.join(process.cwd(), 'public', relativePath);
          if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            filePath = path.join(process.cwd(), relativePath);
          }

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const stat = fs.statSync(filePath);
            const total = stat.size;

            // Suporte a HTTP 206 Partial Content para vídeos e áudio
            const range = req.headers.range;
            if (range && (ext === '.mp4' || ext === '.webm' || ext === '.mov' || ext === '.mp3' || ext === '.wav' || ext === '.ogg' || ext === '.m4a')) {
              const parts = range.replace(/bytes=/, '').split('-');
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
              const chunkSize = (end - start) + 1;

              res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
              });
              return fs.createReadStream(filePath, { start, end }).pipe(res);
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', total);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return fs.createReadStream(filePath).pipe(res);
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serveLocalFolders()],
  server: {
    port: 5173,
    host: true,
    open: false,
    watch: {
      ignored: [
        '**/FOTOS CEPM/**',
        '**/LOGO/**',
        '**/AUDIO/**',
        '**/public/**',
        '**/*.zip',
        '**/*.mp3',
        '**/*.wav',
        '**/*.ogg',
        '**/*.m4a',
        '**/*.mp4',
        '**/*.webm',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.png',
        '**/*.tmp',
        '**/.*',
        '**/node_modules/**',
        '**/dist/**'
      ]
    }
  }
});
