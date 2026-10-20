import dayjs from 'dayjs';

import type { AbaConversa, CanalManual, Conversa } from '@/types/domain';

export const ABAS: { valor: AbaConversa; titulo: string }[] = [
  { valor: 'triagem', titulo: 'Triagem' },
  { valor: 'aguardando', titulo: 'Fila' },
  { valor: 'em_atendimento', titulo: 'Atendendo' },
  { valor: 'agente', titulo: 'Agente' },
  { valor: 'finalizadas', titulo: 'Finalizadas' },
];

// Mesma regra do backend (routes/conversas.ts).
export function abaDa(conversa: Pick<Conversa, 'modo' | 'atendimento'>): AbaConversa {
  const atual = conversa.atendimento;
  if (!atual || atual.status === 'FINALIZADO') return 'finalizadas';
  if (conversa.modo === 'AGENTE') return 'agente';
  if (atual.status === 'TRIAGEM') return 'triagem';
  if (atual.status === 'AGUARDANDO') return 'aguardando';
  return 'em_atendimento';
}

export const CANAIS_MANUAIS: { valor: CanalManual; titulo: string }[] = [
  { valor: 'telefone', titulo: 'Telefone' },
  { valor: 'presencial', titulo: 'Presencial' },
  { valor: 'whatsapp_externo', titulo: 'WhatsApp (fora do sistema)' },
  { valor: 'email', titulo: 'E-mail' },
  { valor: 'outro', titulo: 'Outro' },
];

// Conversa de WhatsApp pelo sistema (dá para enviar mensagem ao cliente).
export function ehWhatsApp(conversa: Pick<Conversa, 'canal'>): boolean {
  return conversa.canal === 'whatsapp';
}

export function nomeCanal(canal: string): string {
  return canal === 'whatsapp' ? 'WhatsApp' : (CANAIS_MANUAIS.find((c) => c.valor === canal)?.titulo ?? canal);
}

// 5585912345678 → (85) 91234-5678
export function formatarTelefone(telefone: string | null): string {
  if (!telefone) return '';
  const local = telefone.startsWith('55') && telefone.length >= 12 ? telefone.slice(2) : telefone;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return `+${telefone}`;
}

export function nomeEmpresa(cliente: NonNullable<Conversa['cliente']>): string {
  return cliente.apelido || cliente.nomeFantasia || cliente.razaoSocial;
}

export function tituloConversa(conversa: Conversa): string {
  if (conversa.cliente) return nomeEmpresa(conversa.cliente);
  return conversa.nomeExibicao || formatarTelefone(conversa.telefone) || 'Sem identificação';
}

export function iniciais(texto: string): string {
  const partes = texto
    .replaceAll(/[^\p{L}\s]/gu, '')
    .trim()
    .split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '#';
}

export function formatarDuracao(minutos: number): string {
  if (minutos < 1) return '< 1 min';
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const horas = Math.floor(minutos / 60);
  if (horas >= 24) return `${Math.floor(horas / 24)}d ${horas % 24}h`;
  const resto = Math.round(minutos % 60);
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
}

// "14:32" hoje, "ontem", "12/10" no resto.
export function horaCurta(data: string): string {
  const d = dayjs(data);
  if (d.isSame(dayjs(), 'day')) return d.format('HH:mm');
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'ontem';
  return d.format('DD/MM');
}
