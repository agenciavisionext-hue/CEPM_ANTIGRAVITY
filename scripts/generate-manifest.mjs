import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const FOTOS_DIR = path.join(ROOT_DIR, 'FOTOS CEPM');
const LOGO_SOURCE = path.join(ROOT_DIR, 'logo_CEPM_transparente.png');
const LOGO_DIR_SOURCE = path.join(ROOT_DIR, 'LOGO', 'logo_CEPM_transparente.png');
const AUDIO_DIR = path.join(ROOT_DIR, 'AUDIO');

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PUBLIC_FOTOS_DIR = path.join(PUBLIC_DIR, 'fotos-cepm');
const PUBLIC_LOGO_DIR = path.join(PUBLIC_DIR, 'logo');
const PUBLIC_AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');

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

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
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
        const stat = fs.statSync(fullPath);
        const hash = getFileHash(fullPath);
        results.push({
          filename: entry.name,
          sourcePath: fullPath,
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

function syncLogoToPublic() {
  ensureDir(PUBLIC_LOGO_DIR);

  let sourceLogo = null;
  if (fs.existsSync(LOGO_SOURCE)) {
    sourceLogo = LOGO_SOURCE;
  } else if (fs.existsSync(LOGO_DIR_SOURCE)) {
    sourceLogo = LOGO_DIR_SOURCE;
  }

  if (sourceLogo) {
    const targetPath = path.join(PUBLIC_LOGO_DIR, 'logo_CEPM_transparente.png');
    let shouldCopy = true;
    if (fs.existsSync(targetPath)) {
      const sourceStat = fs.statSync(sourceLogo);
      const targetStat = fs.statSync(targetPath);
      if (sourceStat.size === targetStat.size) {
        shouldCopy = false;
      }
    }
    if (shouldCopy) {
      fs.copyFileSync(sourceLogo, targetPath);
    }
    return '/logo/logo_CEPM_transparente.png';
  }

  return null;
}

function syncAudioToPublic() {
  ensureDir(PUBLIC_AUDIO_DIR);
  const audioTracks = [];
  const checkedNames = new Set();

  const dirsToScan = [
    { dir: PUBLIC_AUDIO_DIR, urlPrefix: '/audio/' },
    { dir: AUDIO_DIR, urlPrefix: '/audio/' }
  ];

  for (const item of dirsToScan) {
    if (fs.existsSync(item.dir)) {
      const files = fs.readdirSync(item.dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile()) {
          const ext = path.extname(file.name).toLowerCase();
          if (AUDIO_EXTENSIONS.has(ext) && !checkedNames.has(file.name.toLowerCase())) {
            checkedNames.add(file.name.toLowerCase());

            // Se o arquivo estiver em AUDIO/, sincroniza com public/audio/
            if (item.dir === AUDIO_DIR) {
              const targetPath = path.join(PUBLIC_AUDIO_DIR, file.name);
              if (!fs.existsSync(targetPath)) {
                fs.copyFileSync(path.join(AUDIO_DIR, file.name), targetPath);
              }
            }

            audioTracks.push({
              name: file.name,
              path: `/audio/${file.name}`,
              title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
            });
          }
        }
      }
    }
  }

  audioTracks.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  return audioTracks;
}

function syncFotosToPublic(mediaItems) {
  ensureDir(PUBLIC_FOTOS_DIR);

  const validFilenames = new Set();
  let copiedCount = 0;
  let alreadyUpToDate = 0;

  for (const item of mediaItems) {
    validFilenames.add(item.filename);
    const targetPath = path.join(PUBLIC_FOTOS_DIR, item.filename);

    let needsCopy = true;
    if (fs.existsSync(targetPath)) {
      const targetStat = fs.statSync(targetPath);
      if (targetStat.size === item.size) {
        needsCopy = false;
        alreadyUpToDate++;
      }
    }

    if (needsCopy) {
      fs.copyFileSync(item.sourcePath, targetPath);
      copiedCount++;
    }
  }

  // Remoção de arquivos órfãos em public/fotos-cepm que deixaram de existir na pasta de origem
  let removedCount = 0;
  const existingPublicFiles = fs.readdirSync(PUBLIC_FOTOS_DIR);
  for (const file of existingPublicFiles) {
    if (!validFilenames.has(file)) {
      const orphanPath = path.join(PUBLIC_FOTOS_DIR, file);
      if (fs.statSync(orphanPath).isFile()) {
        fs.unlinkSync(orphanPath);
        removedCount++;
        console.log(`🗑️ Removido arquivo órfão da pasta pública: ${file}`);
      }
    }
  }

  return { copiedCount, alreadyUpToDate, removedCount, totalInPublic: validFilenames.size };
}

export function generateManifest() {
  console.log('🔍 Escaneando mídias do CEPM e sincronizando para pasta pública do Vite...');

  if (!fs.existsSync(FOTOS_DIR)) {
    console.error('❌ Diretório "FOTOS CEPM" não encontrado!');
    process.exit(1);
  }

  // 1. Escanear mídias originais de FOTOS CEPM/
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

  // 3. Sincronização automática para public/fotos-cepm (essencial para Vercel e Vite build)
  const syncStats = syncFotosToPublic(allMedia);

  // 4. Sincronização da Logo oficial para public/logo/
  const logoPath = syncLogoToPublic();

  // 5. Sincronização de faixas de áudio
  const audioTracks = syncAudioToPublic();

  // 6. Atribui IDs sequenciais e caminhos públicos /fotos-cepm/...
  const itemsWithIds = allMedia.map((item, index) => ({
    id: index + 1,
    filename: item.filename,
    relativePath: `/fotos-cepm/${item.filename}`,
    type: item.type,
    extension: item.extension,
    folder: item.folder
  }));

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

  ensureDir(OUTPUT_DIR);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('==============================================');
  console.log('✅ MANIFESTO DO CEPM E ARQUIVOS PÚBLICOS SINCRONIZADOS!');
  console.log(`📸 Fotografias na pasta master (FOTOS CEPM): ${fotosItems.length}`);
  console.log(`⚠️ Duplicatas idênticas ignoradas: ${duplicates.length}`);
  console.log(`🖼️ Fotografias válidas no manifesto: ${imageCount}`);
  console.log(`📁 Sincronizadas em public/fotos-cepm: ${syncStats.totalInPublic} (Copiadas: ${syncStats.copiedCount}, Já atualizadas: ${syncStats.alreadyUpToDate})`);
  if (syncStats.removedCount > 0) {
    console.log(`🗑️ Arquivos órfãos excluídos de public/fotos-cepm: ${syncStats.removedCount}`);
  }
  console.log(`🎬 Total de vídeos: ${videoCount}`);
  console.log(`🏷️ Total consolidado de mídias: ${itemsWithIds.length}`);
  console.log(`🛡️ Logo pública identificada: ${logoPath || 'Nenhuma'}`);
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
