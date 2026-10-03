# Apresentação Audiovisual Oficial do CEPM – Porto Velho

**Centro Educacional Pré-Militar (CEPM) – Porto Velho**  
*Disciplina • Respeito • Superação — Formação para a Vida*

Aplicação web de apresentação audiovisual contínua em tela cheia, desenvolvida com React e Vite para exibição em notebooks, projetores, televisões e monitores em eventos e recepções institucionais.

---

## 📌 Principais Características

- **Apresentação em Tela Cheia**: Desenvolvida especialmente para exibição cinematográfica sem distrações, barras de rolagem ou menus institucionais.
- **Transição Crossfade com Buffer Duplo (Slot A / Slot B)**: Transições suaves de 1.2 segundos sem telas pretas ou piscadas entre imagens.
- **Fundo Desfocado (Ambiance Backdrop)**: Preserva a imagem original nítida e inteira no centro (`object-fit: contain`) sem cortar cabeças ou rostos, preenchendo as laterais com a própria foto ampliada e desfocada.
- **Efeito Ken Burns Suave**: Movimentos quase imperceptíveis (3 variações alternadas) que dão vida e dinâmica a cada imagem.
- **Tempo por Imagem**: 6 segundos por fotografia com barra de progresso dourada no topo.
- **Logo Permanente do CEPM**: Marca d'água no canto superior direito com proporções ideais e sombra suave.
- **Controles OSD Flutuantes (Auto-Hide)**: Painel discreto preto e dourado em Glassmorphism que desaparece automaticamente após 3 segundos de inatividade do mouse.
- **Áudio Ambiente & Ducking**: Suporte a trilha sonora contínua em loop, seletor de arquivos de áudio local (+ MP3) e atenuação suave em eventuais vídeos.
- **Loop Infinito**: Ao terminar a última foto, a apresentação retorna imediatamente à primeira sem interrupções.

---

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Gerar Manifesto de Mídias
```bash
npm run manifest
```

### 3. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Abra o navegador em `http://localhost:5173`.

### 4. Gerar Build de Produção
```bash
npm run build
```

### 5. Pré-visualizar Build de Produção
```bash
npm run preview
```

### 6. Executar Bateria de Testes
```bash
npm run verify
```

---

## 📁 Estrutura de Pastas e Mídias

| Diretório / Arquivo | Descrição |
|---|---|
| `FOTOS CEPM/` | Pasta onde ficam armazenadas todas as fotografias originais do CEPM (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`). |
| `LOGO/` | Contém a logo oficial circular transparente `logo_CEPM_transparente.png`. |
| `AUDIO/` ou `public/audio/` | Onde colocar arquivos de áudio padrão (ex: `trilha_cepm.mp3`, `.wav`, `.ogg`, `.m4a`). |
| `scripts/generate-manifest.mjs` | Script automatizado que escaneia as fotos, calcula hash MD5 para evitar duplicatas idênticas e gera `src/media-manifest.json`. |
| `scripts/verify-presentation.mjs` | Bateria de testes que valida arquivos, logo, loop e integridade. |

---

## 🎵 Como Adicionar ou Trocar a Trilha Sonora

1. **Adicionar trilha definitiva no projeto**:
   - Coloque um arquivo de áudio com formato `.mp3`, `.wav`, `.ogg` ou `.m4a` dentro da pasta `AUDIO/` ou `public/audio/`.
   - Execute `npm run manifest`. O áudio será detectado e reproduzido automaticamente como trilha padrão.
2. **Trocar música diretamente pelo navegador (+ MP3)**:
   - Durante a apresentação, mova o mouse para revelar os controles.
   - Clique no botão `+ MP3` (ou no nome da faixa atual).
   - Selecione qualquer arquivo de áudio do seu computador para reproduzi-lo imediatamente durante a sessão.

---

## ⌨️ Atalhos de Teclado Globais

| Tecla | Ação |
|---|---|
| `Espaço` | Pausar / Continuar a apresentação |
| `→` (Seta Direita) | Avançar para a próxima fotografia |
| `←` (Seta Esquerda) | Voltar para a fotografia anterior |
| `F` | Entrar / Sair do modo Tela Cheia |
| `M` | Ativar / Silenciar o áudio ambiente |
| `ESC` | Sair da tela cheia (padrão do navegador) |

---

## 📊 Estatísticas das Mídias do CEPM

- **Fotografias encontradas:** 256
- **Fotografias válidas utilizadas:** 256 (100%)
- **Duplicatas idênticas identificadas:** 0
- **Arquivos inválidos / corrompidos:** 0
- **Logo oficial utilizada:** `/LOGO/logo_CEPM_transparente.png`
- **Áudio:** Preparado e aguardando arquivo MP3 / Selecionável via botão `+ MP3` no painel.

---

## 🔄 Como Adicionar Novas Fotos no Futuro

1. Copie as novas fotos diretamente para dentro da pasta `FOTOS CEPM/`.
2. Execute `npm run dev` (ou `npm run manifest`).
3. O manifesto será atualizado automaticamente com as novas fotos em ordem numérica/alfabética natural.
