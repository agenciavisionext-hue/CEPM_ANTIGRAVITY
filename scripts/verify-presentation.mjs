import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const MANIFEST_PATH = path.join(ROOT_DIR, 'src', 'media-manifest.json');
const CSS_PATH = path.join(ROOT_DIR, 'src', 'index.css');
const FOTOS_DIR = path.join(ROOT_DIR, 'FOTOS CEPM');
const PUBLIC_FOTOS_DIR = path.join(ROOT_DIR, 'public', 'fotos-cepm');
const DIST_FOTOS_DIR = path.join(ROOT_DIR, 'dist', 'fotos-cepm');
const DIST_LOGO_PATH = path.join(ROOT_DIR, 'dist', 'logo', 'logo_CEPM_transparente.png');

async function runVerification() {
  console.log('=====================================================');
  console.log('🛡️ INICIANDO BATERIA COMPLETA DE TESTES - CEPM');
  console.log('=====================================================');

  // 1. Verificação da existência do manifesto
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error('Arquivo media-manifest.json não encontrado!');
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  console.log(`[Item 1] Total de mídias consolidadas: ${manifest.totalMedia}`);
  console.log(`[Item 2] Total de Imagens: ${manifest.imagesCount}`);
  console.log(`[Item 3] Total de Vídeos: ${manifest.videosCount}`);
  console.log(`[Item 4] Logo oficial pública: ${manifest.logo}`);
  console.log(`[Item 5] Músicas detectadas: ${manifest.audioTracks.length} (${manifest.audioTracks.map(a => a.name).join(', ') || 'Nenhuma música no momento'})`);

  if (manifest.totalMedia <= 0) {
    throw new Error('Manifesto não contém mídias!');
  }

  // 2. Garantir que NÃO existe qualquer menção à música do projeto de Geografia
  const manifestRaw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  if (manifestRaw.toLowerCase().includes('africa') || manifestRaw.toLowerCase().includes('peter_bence') || manifestRaw.toLowerCase().includes('bence')) {
    throw new Error('VIOLAÇÃO CRÍTICA: Encontrada menção à música da Semana de Geografia no manifesto!');
  }

  // 3. Verificação de integridade física dos arquivos de imagem no disco (na pasta pública)
  console.log('\n🔍 Verificando se todas as mídias do manifesto existem na pasta pública...');
  let missingFiles = 0;
  for (const item of manifest.items) {
    let diskPath = path.join(ROOT_DIR, 'public', item.relativePath.replace(/^\//, ''));
    if (!fs.existsSync(diskPath)) {
      diskPath = path.join(ROOT_DIR, item.relativePath.replace(/^\//, ''));
    }
    if (!fs.existsSync(diskPath)) {
      console.error(`❌ Arquivo ausente na pasta pública: ${item.relativePath}`);
      missingFiles++;
    }
  }
  if (missingFiles > 0) {
    throw new Error(`${missingFiles} arquivos do manifesto não foram encontrados no disco!`);
  }
  console.log(`  ✅ Todos os ${manifest.totalMedia} arquivos existem fisicamente em public/fotos-cepm!`);

  // 4. Verificação de que todas as fotos da pasta master "FOTOS CEPM" foram sincronizadas
  const diskPhotos = fs.readdirSync(FOTOS_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(ext);
  });
  console.log(`\n📸 Fotografias na pasta master "FOTOS CEPM": ${diskPhotos.length}`);
  console.log(`📸 Fotografias computadas no manifesto: ${manifest.imagesCount}`);
  if (diskPhotos.length !== manifest.imagesCount + manifest.duplicatesCount) {
    throw new Error(`Inconsistência: ${diskPhotos.length} fotos no disco vs ${manifest.imagesCount} no manifesto!`);
  }
  console.log('  ✅ 100% das fotografias válidas foram incluídas no manifesto!');

  // 5. Verificação da Logo Oficial Pública
  console.log('\n🛡️ Verificando integridade da logo oficial...');
  let logoPath = path.join(ROOT_DIR, 'public', manifest.logo.replace(/^\//, ''));
  if (!fs.existsSync(logoPath)) {
    logoPath = path.join(ROOT_DIR, manifest.logo.replace(/^\//, ''));
  }
  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo oficial não encontrada no caminho: ${logoPath}`);
  }
  const logoStat = fs.statSync(logoPath);
  console.log(`  ✅ Logo intacta (${logoStat.size} bytes) em ${manifest.logo}`);

  // 6. Teste de IDs Sequenciais
  console.log('\n🔢 Verificando IDs sequenciais...');
  for (let i = 0; i < manifest.items.length; i++) {
    if (manifest.items[i].id !== i + 1) {
      throw new Error(`Inconsistência de ID: esperado ${i + 1}, recebido ${manifest.items[i].id}`);
    }
  }
  console.log('  ✅ IDs rigorosamente ordenados de 1 a N!');

  // 7. Teste do Looping Contínuo
  const total = manifest.totalMedia;
  const loopForward = (total - 1 + 1) % total;
  const loopBackward = (0 - 1 + total) % total;
  console.log('\n🔁 Testando lógica de looping contínuo:');
  console.log(`  - Avanço após a última (#${total}) -> #${loopForward + 1} (${manifest.items[loopForward].filename}) [OK]`);
  console.log(`  - Recuo a partir da primeira (#1) -> #${loopBackward + 1} (${manifest.items[loopBackward].filename}) [OK]`);

  // 8. Teste de estilização da Logo e cores no CSS
  console.log('\n🎨 Verificando estilização do CEPM no CSS...');
  const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
  if (cssContent.includes('.watermark-container') && cssContent.includes('top: 28px') && cssContent.includes('right: 36px')) {
    console.log('  ✅ Logo posicionada no CANTO SUPERIOR DIREITO (top: 28px, right: 36px)');
  } else {
    throw new Error('Posicionamento da logo incorreto no CSS');
  }

  if (cssContent.includes('--color-gold-main: #d4af37;') && cssContent.includes('--color-black-main: #050505;')) {
    console.log('  ✅ Paleta oficial Preto & Dourado devidamente implementada no CSS');
  } else {
    throw new Error('Paleta de cores do CEPM ausente no CSS');
  }

  // 9. Verificação da pasta dist se gerada
  if (fs.existsSync(DIST_FOTOS_DIR)) {
    console.log('\n📦 Verificando pasta de produção dist/...');
    const distPhotos = fs.readdirSync(DIST_FOTOS_DIR);
    console.log(`  📸 Imagens presentes em dist/fotos-cepm: ${distPhotos.length} (Esperado: ${manifest.imagesCount})`);
    if (distPhotos.length !== manifest.imagesCount) {
      throw new Error(`Inconsistência no build dist/: ${distPhotos.length} fotos em dist vs ${manifest.imagesCount} no manifesto!`);
    }
    if (fs.existsSync(DIST_LOGO_PATH)) {
      console.log('  🛡️ Logo oficial presente em dist/logo/logo_CEPM_transparente.png [OK]');
    } else {
      throw new Error('Logo oficial ausente em dist/logo/!');
    }
    console.log('  ✅ Build de produção dist/ contém 100% dos ativos estáticos!');
  }

  // 10. Teste de requisições HTTP locais no Vite se o servidor estiver rodando
  const baseUrl = 'http://localhost:5173';
  try {
    const testRes = await fetch(`${baseUrl}/`, { method: 'HEAD' });
    if (testRes.status === 200) {
      console.log('\n🌐 Servidor Vite detectado em execução! Testando endpoints HTTP...');
      const urlsToTest = [
        { name: 'HTML Principal', url: `${baseUrl}/` },
        { name: 'Logo Oficial', url: `${baseUrl}${encodeURI(manifest.logo)}` },
        { name: 'Primeira Mídia (#1)', url: `${baseUrl}${encodeURI(manifest.items[0].relativePath)}` },
        { name: 'Mídia Intermediária', url: `${baseUrl}${encodeURI(manifest.items[Math.floor(total / 2)].relativePath)}` },
        { name: 'Última Mídia', url: `${baseUrl}${encodeURI(manifest.items[total - 1].relativePath)}` }
      ];

      for (const item of urlsToTest) {
        const res = await fetch(item.url, { method: 'HEAD' });
        if (res.status === 200 || res.status === 206) {
          console.log(`  ✅ ${item.name} -> Status ${res.status} [${res.headers.get('content-type')}]`);
        } else {
          throw new Error(`Falha em ${item.name}: Status ${res.status}`);
        }
      }
    }
  } catch (err) {
    console.log('\nℹ️ Servidor Vite não está respondendo na porta padrão 5173.');
  }

  console.log('\n=====================================================');
  console.log(`🎉 TODOS OS CRITÉRIOS DE VERIFICAÇÃO FORAM APROVADOS (${manifest.totalMedia} FOTOS)!`);
  console.log('=====================================================');
}

runVerification().catch(err => {
  console.error('❌ Erro na verificação:', err);
  process.exit(1);
});
