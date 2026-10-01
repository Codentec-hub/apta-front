import { config } from '@/config';
import { getToken } from '@/lib/api';
import type { ContatoCliente, DocumentoEntrega, ProtocoloEntrega } from '@/types/domain';

// Upload do arquivo cru (sem multipart) — ver backend/src/routes/documentos-entrega.ts.
export async function anexarDocumento(obrigacaoId: string, arquivo: File): Promise<DocumentoEntrega> {
  const token = getToken();
  const res = await fetch(`${config.apiUrl}/obrigacoes/${obrigacaoId}/documentos`, {
    method: 'POST',
    headers: {
      'Content-Type': arquivo.type || 'application/octet-stream',
      'X-Nome-Arquivo': encodeURIComponent(arquivo.name),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: arquivo,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.erro === 'string' ? body.erro : res.status === 413 ? 'Arquivo maior que 25 MB' : `Erro ${res.status}`);
  }
  return res.json() as Promise<DocumentoEntrega>;
}

// Abre o documento numa aba nova (a rota exige o token, então baixa como blob).
export async function abrirDocumento(documentoId: string): Promise<void> {
  const token = getToken();
  const aba = globalThis.open('', '_blank');
  const res = await fetch(`${config.apiUrl}/documentos/${documentoId}/arquivo`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    aba?.close();
    throw new Error('Não foi possível abrir o documento');
  }
  const url = URL.createObjectURL(await res.blob());
  if (aba) aba.location.href = url;
  else globalThis.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Link que o cliente abre (página pública /entrega/<token>).
export function linkPublico(protocolo: Pick<ProtocoloEntrega, 'token'>): string {
  return `${globalThis.location.origin}/entrega/${protocolo.token}`;
}

export function mensagemDeEnvio(protocolo: ProtocoloEntrega, obrigacao: { nome: string; cliente: { razaoSocial: string } }): string {
  return (
    `Olá, ${protocolo.destinatarioNome.split(' ')[0]}! A Apta Contabilidade enviou ${obrigacao.nome} ` +
    `(${obrigacao.cliente.razaoSocial}). Protocolo nº ${protocolo.numero}: ${linkPublico(protocolo)}`
  );
}

// wa.me só abre a conversa com o texto pronto — o envio continua manual.
export function linkWhatsApp(protocolo: ProtocoloEntrega, texto: string): string | null {
  const numero = (protocolo.destinatarioCelular ?? '').replaceAll(/\D/g, '');
  if (!numero) return null;
  return `https://wa.me/${numero.startsWith('55') ? numero : `55${numero}`}?text=${encodeURIComponent(texto)}`;
}

export function linkEmail(protocolo: ProtocoloEntrega, assunto: string, texto: string): string | null {
  if (!protocolo.destinatarioEmail) return null;
  return `mailto:${protocolo.destinatarioEmail}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`;
}

// Contatos que recebem documentos deste departamento.
export function recebeDoSetor(contato: ContatoCliente, setorId: string): boolean {
  return contato.recebeTodos || contato.setores.some((s) => s.id === setorId);
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
