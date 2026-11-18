const LADO = 256;
const LIMITE = 90_000; // caracteres do data URL (o servidor aceita até ~100 KB por requisição)

function carregar(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.addEventListener('load', () => {
      URL.revokeObjectURL(url);
      resolve(img);
    });
    img.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem. Use JPG, PNG ou WebP.'));
    });
    img.src = url;
  });
}

/** Corta no quadrado central, reduz para 256px e comprime (WebP; JPEG se o navegador não gerar WebP). */
export async function prepararFoto(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.');
  if (arquivo.size > 15 * 1024 * 1024) throw new Error('Imagem grande demais (máximo 15 MB).');
  const img = await carregar(arquivo);
  const lado = Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = LADO;
  canvas.height = LADO;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.');
  ctx.fillStyle = '#fff'; // PNG transparente não fica preto no JPEG
  ctx.fillRect(0, 0, LADO, LADO);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (img.naturalWidth - lado) / 2, (img.naturalHeight - lado) / 2, lado, lado, 0, 0, LADO, LADO);
  for (const qualidade of [0.9, 0.8, 0.7, 0.55, 0.4]) {
    let dados = canvas.toDataURL('image/webp', qualidade);
    if (!dados.startsWith('data:image/webp')) dados = canvas.toDataURL('image/jpeg', qualidade);
    if (dados.length <= LIMITE) return dados;
  }
  throw new Error('Não foi possível reduzir a imagem o suficiente.');
}
