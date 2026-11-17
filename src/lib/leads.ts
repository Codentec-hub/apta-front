import dayjs from 'dayjs';

export type StatusLead =
  | 'NOVO'
  | 'NA_FILA'
  | 'EM_CONVERSA'
  | 'FORA_DO_PERFIL'
  | 'DADOS_COLETADOS'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'AGENDADO'
  | 'SEM_RESPOSTA'
  | 'DESCARTADO';

export type StatusAgendamento = 'PRE_RESERVADO' | 'CONFIRMADO' | 'CANCELADO' | 'EXPIRADO';

export interface AgendamentoResumo {
  id: string;
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  expiraEm: string | null;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  origem: string | null;
  observacoes: string | null;
  qualificacao: string | null;
  status: StatusLead;
  perfil: Record<string, string> | null;
  motivoEncerramento: string | null;
  naFilaEm: string | null;
  primeiraMensagemEm: string | null;
  lembreteEnviadoEm: string | null;
  ultimaRespostaEm: string | null;
  createdAt: string;
  cadastradoPor: { id: string; nome: string } | null;
  conversaId: string | null;
  conversa: {
    id: string;
    modo: 'HUMANO' | 'AGENTE';
    ultimaMensagemEm: string | null;
    ultimaMensagemTexto: string | null;
    naoLidas: number;
  } | null;
  agendamentos: AgendamentoResumo[];
}

export interface LeadDetalhe extends Omit<Lead, 'agendamentos'> {
  perfilCompleto: boolean;
  agendamentos: (AgendamentoResumo & {
    confirmadoPor: { id: string; nome: string } | null;
    motivoCancelamento: string | null;
    confirmadoEm: string | null;
  })[];
}

export interface Agendamento extends AgendamentoResumo {
  confirmadoEm: string | null;
  observacoes: string | null;
  lead: Pick<Lead, 'id' | 'nome' | 'telefone' | 'origem' | 'qualificacao' | 'perfil' | 'observacoes' | 'conversaId' | 'status'>;
  confirmadoPor: { id: string; nome: string } | null;
}

export interface CampoPerfil {
  chave: string;
  rotulo: string;
  obrigatorio: boolean;
}

export interface SituacaoFila {
  naFila: number;
  lembretesPendentes: number;
  enviadosHoje: number;
  tetoDiario: number;
  proximoEnvioEm: string | null;
  pausa: string | null;
}

type Cor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

export const STATUS_LEAD: Record<StatusLead, { rotulo: string; cor: Cor }> = {
  NOVO: { rotulo: 'Novo', cor: 'default' },
  NA_FILA: { rotulo: 'Na fila', cor: 'info' },
  EM_CONVERSA: { rotulo: 'Em conversa', cor: 'primary' },
  DADOS_COLETADOS: { rotulo: 'Dados coletados', cor: 'secondary' },
  AGUARDANDO_CONFIRMACAO: { rotulo: 'Aguardando confirmação', cor: 'warning' },
  AGENDADO: { rotulo: 'Agendado', cor: 'success' },
  SEM_RESPOSTA: { rotulo: 'Sem resposta', cor: 'default' },
  FORA_DO_PERFIL: { rotulo: 'Fora do perfil', cor: 'default' },
  DESCARTADO: { rotulo: 'Descartado', cor: 'default' },
};

export const STATUS_AGENDAMENTO: Record<StatusAgendamento, { rotulo: string; cor: Cor }> = {
  PRE_RESERVADO: { rotulo: 'Pré-reservado', cor: 'warning' },
  CONFIRMADO: { rotulo: 'Confirmado', cor: 'success' },
  CANCELADO: { rotulo: 'Cancelado', cor: 'default' },
  EXPIRADO: { rotulo: 'Expirado', cor: 'default' },
};

/** Grupos da lista de leads (abas). */
export const GRUPOS_LEAD: { valor: string; titulo: string; status: StatusLead[] }[] = [
  { valor: 'ativos', titulo: 'Em andamento', status: ['NOVO', 'NA_FILA', 'EM_CONVERSA', 'DADOS_COLETADOS', 'AGUARDANDO_CONFIRMACAO'] },
  { valor: 'confirmar', titulo: 'Para confirmar', status: ['AGUARDANDO_CONFIRMACAO'] },
  { valor: 'agendados', titulo: 'Agendados', status: ['AGENDADO'] },
  { valor: 'encerrados', titulo: 'Encerrados', status: ['SEM_RESPOSTA', 'FORA_DO_PERFIL', 'DESCARTADO'] },
  { valor: 'todos', titulo: 'Todos', status: [] },
];

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** "Qua, 19/11 · 09:30" */
export function horarioCurto(iso: string): string {
  const d = dayjs(iso);
  return `${DIAS_CURTOS[d.day()]}, ${d.format('DD/MM')} · ${d.format('HH:mm')}`;
}

/** "Quarta-feira, 19 de novembro, 09:30" */
export function horarioLongo(iso: string): string {
  return capitalizar(dayjs(iso).locale('pt-br').format('dddd, D [de] MMMM, HH:mm'));
}

/** "há 3 h", "em 2 h" */
export function relativo(iso: string): string {
  const min = Math.round((dayjs(iso).valueOf() - Date.now()) / 60_000);
  const abs = Math.abs(min);
  const texto = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} dias`;
  return min >= 0 ? `em ${texto}` : `há ${texto}`;
}

export function rotuloCampo(campos: CampoPerfil[], chave: string): string {
  return campos.find((c) => c.chave === chave)?.rotulo ?? chave;
}
