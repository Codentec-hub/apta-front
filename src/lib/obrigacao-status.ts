import type { AjustePrazo, Obrigacao, TipoObrigacao } from '@/types/domain';

export type StatusObrigacao =
  | 'dispensada'
  | 'concluida'
  | 'concluida_com_atraso'
  | 'pendente'
  | 'atrasada'
  | 'em_plano_de_acao'
  | 'plano_vencido'
  | 'plano_cumprido';

export interface StatusInfo {
  status: StatusObrigacao;
  label: string;
  color: 'success' | 'warning' | 'error' | 'default';
}

// Rótulos seguem a Lista de Entregas do Acessórias: Pendente / Entregue /
// Em atraso / Entrega justificada / Dispensada. "Justificada" se desdobra no
// acompanhamento do plano de ação (o diferencial da Apta).
export function statusDaObrigacao(obrigacao: Obrigacao, agora: Date = new Date()): StatusInfo {
  if (obrigacao.dispensada) {
    return { status: 'dispensada', label: 'Dispensada', color: 'default' };
  }

  const prazo = new Date(obrigacao.prazo);

  if (obrigacao.concluidaEm) {
    const concluidaEm = new Date(obrigacao.concluidaEm);
    if (concluidaEm > prazo) {
      return { status: 'concluida_com_atraso', label: 'Entregue com atraso', color: 'warning' };
    }
    return { status: 'concluida', label: 'Entregue', color: 'success' };
  }

  const atraso = obrigacao.atraso;

  if (atraso) {
    if (!atraso.cumprido) {
      const prazoPrometido = new Date(atraso.prazoPrometido);
      if (agora > prazoPrometido) {
        return { status: 'plano_vencido', label: 'Justificada · plano vencido', color: 'error' };
      }
      return { status: 'em_plano_de_acao', label: 'Justificada · plano em andamento', color: 'warning' };
    }
    return { status: 'plano_cumprido', label: 'Justificada · plano cumprido', color: 'success' };
  }

  if (agora > prazo) {
    return { status: 'atrasada', label: 'Em atraso', color: 'error' };
  }

  return { status: 'pendente', label: 'Pendente', color: 'default' };
}

// Categoria de pontualidade usada nos relatórios de produtividade (Painel
// Geral e ficha do cliente), separada do statusDaObrigacao acima — que
// continua sendo a fonte da verdade para "o que precisa de ação agora".
// Espelha as colunas reais do Acessorias (Antecipadas / Prazo técnico /
// Atraso legal / Atraso justificado / Atraso sem justificativa / Dispensadas).
export type Pontualidade =
  | 'dispensada'
  | 'antecipada'
  | 'no_prazo'
  | 'atraso_legal'
  | 'atraso_justificado'
  | 'atraso_sem_justificativa'
  | 'pendente';

export function pontualidadeDaObrigacao(obrigacao: Obrigacao, agora: Date = new Date()): Pontualidade {
  if (obrigacao.dispensada) {
    return 'dispensada';
  }

  if (obrigacao.concluidaEm) {
    const concluidaEm = new Date(obrigacao.concluidaEm);
    const prazo = new Date(obrigacao.prazo);
    const prazoTecnico = obrigacao.prazoTecnico ? new Date(obrigacao.prazoTecnico) : null;

    if (concluidaEm > prazo) {
      return obrigacao.atraso ? 'atraso_justificado' : 'atraso_legal';
    }
    if (prazoTecnico && concluidaEm <= prazoTecnico) {
      return 'antecipada';
    }
    return 'no_prazo';
  }

  if (obrigacao.atraso) {
    return 'atraso_justificado';
  }

  const status = statusDaObrigacao(obrigacao, agora).status;
  if (status === 'atrasada') {
    return 'atraso_sem_justificativa';
  }
  return 'pendente';
}

// "Set/2026" (ou só "2025" em obrigação de competência anual).
export function formatarCompetencia(competencia: string | null, anual = false): string {
  if (!competencia) return 'Avulsa';
  const [ano, mes] = competencia.slice(0, 7).split('-');
  return anual ? ano : `${MESES_CURTOS[Number(mes) - 1]}/${ano}`;
}

export const PODE_ALTERAR_PRAZOS: ReadonlySet<string> = new Set(['ADMIN', 'GESTOR']);

// Agrupamento da Lista de Entregas do Acessórias (contadores do topo e
// filtro principal). "Justificada" = venceu e tem justificativa registrada.
export type CategoriaEntrega = 'pendente' | 'em_atraso' | 'justificada' | 'entregue' | 'dispensada';

export const CATEGORIAS_ENTREGA: { value: CategoriaEntrega; label: string; color: StatusInfo['color'] }[] = [
  { value: 'pendente', label: 'Pendentes', color: 'default' },
  { value: 'em_atraso', label: 'Em atraso', color: 'error' },
  { value: 'justificada', label: 'Justificadas', color: 'warning' },
  { value: 'entregue', label: 'Entregues', color: 'success' },
  { value: 'dispensada', label: 'Dispensadas', color: 'default' },
];

export function categoriaDaEntrega(obrigacao: Obrigacao, agora: Date = new Date()): CategoriaEntrega {
  if (obrigacao.dispensada) return 'dispensada';
  if (obrigacao.concluidaEm) return 'entregue';
  if (obrigacao.atraso) return 'justificada';
  return agora > new Date(obrigacao.prazo) ? 'em_atraso' : 'pendente';
}

export const AJUSTE_LABEL: Record<AjustePrazo, string> = {
  ANTECIPAR: 'Antecipar para o dia útil anterior',
  POSTERGAR: 'Postergar para o próximo dia útil',
  MANTER: 'Manter o dia exato',
};

export const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Opções do select "Entrega <mês>" do Acessórias, na mesma ordem.
export const OPCOES_DATA_ENTREGA: { value: number; label: string }[] = [
  { value: 0, label: 'Não tem' },
  ...Array.from({ length: 20 }, (_, i) => ({ value: 51 + i, label: `${i + 1}° dia útil` })),
  { value: 90, label: 'Último dia útil' },
  ...Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `Todo dia ${String(i + 1).padStart(2, '0')}` })),
];

export const OPCOES_COMPETENCIA: { value: number; label: string; curto: string }[] = [
  { value: -1, label: 'Mês anterior', curto: 'Mês anterior' },
  { value: -2, label: '2 meses antes', curto: '2 meses antes' },
  { value: -3, label: '3 meses antes', curto: '3 meses antes' },
  { value: -12, label: 'Ano anterior', curto: 'Ano anterior' },
  { value: 12, label: 'Ano atual', curto: 'Ano atual' },
  { value: 0, label: 'Mês atual', curto: 'Mesmo mês' },
  { value: 1, label: 'Mês seguinte', curto: 'Mês seguinte' },
];

// "15", "5°DU", "ÚltDU" — como aparece na coluna "Datas para entrega".
export function codigoCurto(codigo: number): string {
  if (codigo === 90) return 'ÚltDU';
  if (codigo > 50) return `${codigo - 50}°DU`;
  return String(codigo).padStart(2, '0');
}

// Coluna "Datas para entrega (DU = Dia Útil)" da Relação das Obrigações.
export function datasDeEntrega(entregasPorMes: number[]): string[] {
  const itens: string[] = [];
  for (const [i, codigo] of entregasPorMes.entries()) {
    if (codigo) itens.push(`${codigoCurto(codigo)}/${MESES_CURTOS[i]}`);
  }
  return itens;
}

export function competenciaAnual(tipo: Pick<TipoObrigacao, 'competenciaReferente'> | null | undefined): boolean {
  return Math.abs(tipo?.competenciaReferente ?? 0) === 12;
}
