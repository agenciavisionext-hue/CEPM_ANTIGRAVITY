import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const FOTOS_DIR = path.join(ROOT_DIR, 'FOTOS CEPM');
const LOGO_DIR = path.join(ROOT_DIR, 'LOGO');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'media-manifest.json');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a']);

function getFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  } catch (err) {
    return null;
  }
}

function scanDirectoryRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDirectoryRecursively(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      let type = null;
      if (IMAGE_EXTENSIONS.has(ext)) {
        type = 'image';
      } else if (VIDEO_EXTENSIONS.has(ext)) {
        type = 'video';
      }

      if (type) {
        const relativeToRoot = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
        const stat = fs.statSync(fullPath);
        const hash = getFileHash(fullPath);
        results.push({
          filename: entry.name,
          relativePath: `/${relativeToRoot}`,
          type,
          extension: ext,
          size: stat.size,
          hash
        });
      }
    }
  }

  return results;
}

function scanAudioTracks() {
  const audioTracks = [];
  const checkedNames = new Set();
  const dirsToScan = [
    { dir: path.join(ROOT_DIR, 'public', 'audio'), urlPrefix: '/audio/' },
    { dir: path.join(ROOT_DIR, 'AUDIO'), urlPrefix: '/AUDIO/' },
    { dir: path.join(ROOT_DIR, 'audio'), urlPrefix: '/audio/' }
  ];

  for (const item of dirsToScan) {
    if (fs.existsSync(item.dir)) {
      const files = fs.readdirSync(item.dir, { withFileTypes: true, recursive: true });
      for (const file of files) {
        if (file.isFile()) {
          const ext = path.extname(file.name).toLowerCase();
          if (AUDIO_EXTENSIONS.has(ext) && !checkedNames.has(file.name.toLowerCase())) {
            checkedNames.add(file.name.toLowerCase());
            const fullFilePath = path.join(file.parentPath || item.dir, file.name);
            const relativeToDir = path.relative(item.dir, fullFilePath).replace(/\\/g, '/');
            const webUrl = `${item.urlPrefix}${relativeToDir}`;
            audioTracks.push({
              name: file.name,
              path: webUrl,
              title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
            });
          }
        }
      }
    }
  }

  // Ordenação alfabética natural padrão das faixas
  audioTracks.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  return audioTracks;
}

function verifyLogo() {
  const defaultLogoPath = path.join(LOGO_DIR, 'logo_CEPM_transparente.png');
  if (fs.existsSync(defaultLogoPath)) {
    return '/LOGO/logo_CEPM_transparente.png';
  }
  const rootLogoPath = path.join(ROOT_DIR, 'logo_CEPM_transparente.png');
  if (fs.existsSync(rootLogoPath)) {
    return '/logo_CEPM_transparente.png';
  }
  if (fs.existsSync(LOGO_DIR)) {
    const logoFiles = fs.readdirSync(LOGO_DIR).filter(f => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
    if (logoFiles.length > 0) {
      return `/LOGO/${logoFiles[0]}`;
    }
  }
  return null;
}

export function generateManifest() {
  console.log('🔍 Escaneando mídias do CEPM e gerando manifesto consolidado...');

  if (!fs.existsSync(FOTOS_DIR)) {
    console.error('❌ Diretório "FOTOS CEPM" não encontrado!');
    process.exit(1);
  }

  // 1. Escanear mídias de FOTOS CEPM/
  const fotosItems = scanDirectoryRecursively(FOTOS_DIR);

  // Ordenação natural
  fotosItems.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }));

  // 2. Validação de duplicidade real por Hash MD5
  const seenHashes = new Set();
  const allMedia = [];
  const duplicates = [];

  for (const item of fotosItems) {
    if (item.hash && seenHashes.has(item.hash)) {
      duplicates.push(item);
      console.log(`⚠️ Arquivo ignorado por duplicata idêntica (MD5 idêntico): ${item.filename}`);
    } else {
      if (item.hash) {
        seenHashes.add(item.hash);
      }
      allMedia.push({
        ...item,
        folder: 'FOTOS CEPM'
      });
    }
  }

  // 3. Atribui IDs sequenciais de 1 a N
  const itemsWithIds = allMedia.map((item, index) => ({
    id: index + 1,
    filename: item.filename,
    relativePath: item.relativePath,
    type: item.type,
    extension: item.extension,
    folder: item.folder
  }));

  const logoPath = verifyLogo();
  const audioTracks = scanAudioTracks();

  const imageCount = itemsWithIds.filter(i => i.type === 'image').length;
  const videoCount = itemsWithIds.filter(i => i.type === 'video').length;

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalMedia: itemsWithIds.length,
    imagesCount: imageCount,
    videosCount: videoCount,
    duplicatesCount: duplicates.length,
    logo: logoPath,
    audioTracks: audioTracks,
    items: itemsWithIds
  };

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('==============================================');
  console.log('✅ MANIFESTO DO CEPM GERADO COM SUCESSO!');
  console.log(`📸 Fotografias encontradas: ${fotosItems.length}`);
  console.log(`⚠️ Duplicatas idênticas ignoradas: ${duplicates.length}`);
  console.log(`🖼️ Fotografias válidas utilizadas: ${imageCount}`);
  console.log(`🎬 Total de vídeos: ${videoCount}`);
  console.log(`🏷️ Total consolidado de mídias: ${itemsWithIds.length}`);
  console.log(`🛡️ Logo identificada: ${logoPath || 'Nenhuma'}`);
  console.log(`🎵 Músicas detectadas: ${audioTracks.length} (${audioTracks.map(t => t.name).join(', ') || 'Nenhuma música no momento - aguardando MP3'})`);
  console.log(`💾 Salvo em: ${path.relative(ROOT_DIR, OUTPUT_FILE)}`);
  console.log('==============================================');

  return manifest;
}

// Execução direta via node
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))) {
  generateManifest();
} else {
  generateManifest();
}
