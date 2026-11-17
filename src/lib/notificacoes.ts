import dayjs from 'dayjs';

export type SeveridadeNotificacao = 'info' | 'sucesso' | 'aviso' | 'erro';

export interface Notificacao {
  id: string;
  tipo: string;
  categoria: string;
  severidade: SeveridadeNotificacao;
  titulo: string;
  mensagem: string;
  href: string | null;
  lidaEm: string | null;
  arquivadaEm: string | null;
  emailEnviadoEm: string | null;
  criadoEm: string;
}

export interface PaginaNotificacoes {
  total: number;
  pagina: number;
  porPagina: number;
  naoLidas: number;
  itens: Notificacao[];
}

export interface PreferenciaTipo {
  tipo: string;
  rotulo: string;
  descricao: string;
  categoria: string;
  app: boolean;
  email: boolean;
}

export const COR_SEVERIDADE: Record<SeveridadeNotificacao, string> = {
  info: 'var(--mui-palette-info-main)',
  sucesso: 'var(--mui-palette-success-main)',
  aviso: 'var(--mui-palette-warning-main)',
  erro: 'var(--mui-palette-error-main)',
};

/** "agora", "há 5 min", "há 3 h", "ontem 14:20", "12/11 09:30". */
export function quando(data: string): string {
  const d = dayjs(data);
  const min = dayjs().diff(d, 'minute');
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = dayjs().diff(d, 'hour');
  if (h < 12 && d.isSame(dayjs(), 'day')) return `há ${h} h`;
  if (d.isSame(dayjs(), 'day')) return `hoje ${d.format('HH:mm')}`;
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return `ontem ${d.format('HH:mm')}`;
  return d.format(d.isSame(dayjs(), 'year') ? 'DD/MM HH:mm' : 'DD/MM/YYYY');
}
