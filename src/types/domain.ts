export interface Setor {
  id: string;
  nome: string;
  createdAt: string;
  responsavelId?: string | null;
  responsavel?: { id: string; nome: string } | null;
}

export type Perfil = 'ADMIN' | 'GESTOR' | 'OPERACIONAL';

export interface UsuarioResumo {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  setorId: string | null;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  setorId: string | null;
  setor: Setor | null;
  createdAt: string;
}

export interface ClienteResponsavel {
  id: string;
  setorId: string;
  usuarioId: string;
  setor: Setor;
  usuario: UsuarioResumo;
}

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string;
  regimeTributario: string | null;
  ativo: boolean;
  createdAt: string;
  // "ID Empresa" do Acessórias.
  codigo: number;
  apelido: string | null;
  cidade: string | null;
  uf: string | null;
  grupoEmpresas: string | null;
  honorario: number | null;
  responsaveis: ClienteResponsavel[];
  contatos?: ContatoCliente[];
}

// "Contatos na empresa": quem recebe os documentos de cada departamento.
export interface ContatoCliente {
  id: string;
  nome: string;
  cargo: string | null;
  celular: string | null;
  email: string | null;
  recebeTodos: boolean;
  ativo: boolean;
  clienteId: string;
  setores: { id: string; nome: string }[];
}

export interface Feriado {
  id: string;
  data: string; // "2000-03-19T00:00:00.000Z"
  descricao: string;
  recorrente: boolean;
  uf: string | null;
  cidade: string | null;
}

export interface DocumentoEntrega {
  id: string;
  nomeArquivo: string;
  mimeType: string;
  tamanho: number;
  createdAt: string;
  usuario: { id: string; nome: string } | null;
}

export type StatusEnvio = 'AGUARDANDO_ENVIO' | 'ENVIADO' | 'FALHA';

export interface ProtocoloEntrega {
  id: string;
  numero: number;
  token: string;
  destinatarioNome: string;
  destinatarioEmail: string | null;
  destinatarioCelular: string | null;
  status: StatusEnvio;
  canal: string | null;
  erroEnvio: string | null;
  enviadoEm: string | null;
  lidoEm: string | null;
  acessos: number;
  createdAt: string;
  contatoId: string | null;
  usuario: { id: string; nome: string } | null;
}

// Resumo que vem em cada linha da Lista de Entregas.
export type ProtocoloResumo = Pick<ProtocoloEntrega, 'id' | 'numero' | 'destinatarioNome' | 'status' | 'enviadoEm' | 'lidoEm'>;

// Painel de Indicadores (tela inicial do Acessórias).
export interface Indicadores {
  periodo: 'semana' | 'mes';
  inicio: string;
  fim: string;
  entregas: {
    total: number;
    antecipadas: number;
    prazoTecnico: number;
    atrasadas: number;
    atrasadasComMulta: number;
    atrasoJustificado: number;
  };
  aRealizar: {
    total: number;
    prazoAntecipado: number;
    prazoTecnico: number;
    atrasoLegal: number;
    atrasoLegalComMulta: number;
    atrasoJustificado: number;
  };
  docs: { total: number; lidos: number; naoLidos: number; aguardandoEnvio: number; falhaNoEnvio: number };
}

export interface Atraso {
  id: string;
  obrigacaoId: string;
  justificativa: string;
  causaRaiz: string;
  planoDeAcao: string;
  prazoPrometido: string;
  cumprido: boolean;
  cumpridoEm: string | null;
  createdAt: string;
}

export type AjustePrazo = 'ANTECIPAR' | 'POSTERGAR' | 'MANTER';
export type TipoDias = 'UTEIS' | 'CORRIDOS';

// Cadastro de obrigação (mesmos campos do Acessórias).
export interface TipoObrigacao {
  id: string;
  nome: string;
  mininome: string | null;
  setorId: string;
  setor: Setor;
  tempoPrevistoMinutos: number | null;
  ativo: boolean;
  createdAt: string;
  // Jan–Dez: 0 não tem · 1–31 todo dia N · 51–70 Nº dia útil · 90 último dia útil
  entregasPorMes: number[];
  competenciaReferente: number;
  diasAntes: number;
  tipoDiasAntes: TipoDias;
  ajustePrazo: AjustePrazo;
  sabadoUtil: boolean;
  geraMulta: boolean;
  alertaNaoLida: boolean;
  comentarioPadrao: string | null;
  _count?: { empresas: number };
}

// Regime tributário ou grupo de obrigações: um nome + conjunto de tipos.
export interface ConjuntoObrigacoes {
  id: string;
  nome: string;
  tipoIds: string[];
  createdAt: string;
}

export interface ContadoresObrigacao {
  entregues: number;
  atrasoTecnico: number;
  proximos30: number;
  futuras: number;
}

export interface ClienteObrigacao {
  id: string;
  ativa: boolean;
  tempoPrevistoMinutos: number | null;
  contadores?: ContadoresObrigacao;
  clienteId: string;
  tipoId: string;
  tipo: TipoObrigacao;
  responsavelId: string | null;
  responsavel: { id: string; nome: string } | null;
}

export interface ComentarioEntrega {
  id: string;
  texto: string;
  createdAt: string;
  usuario: { id: string; nome: string } | null;
}

export interface LogObrigacao {
  id: string;
  acao: string;
  detalhe: string;
  createdAt: string;
  usuario: { id: string; nome: string } | null;
}

// Uma entrega da Lista de Entregas (obrigação de um cliente numa competência).
export interface Obrigacao {
  id: string;
  nome: string;
  competencia: string | null; // "2026-09-01"
  prazo: string;
  prazoTecnico: string | null;
  tempoRealMinutos: number | null;
  dispensada: boolean;
  concluidaEm: string | null;
  createdAt: string;
  clienteId: string;
  cliente: { id: string; razaoSocial: string; cnpj: string; codigo?: number };
  setorId: string;
  setor: Setor;
  tipoId: string | null;
  tipo: TipoObrigacao | null;
  protocolos?: ProtocoloResumo[];
  responsavelId: string | null;
  responsavel: { id: string; nome: string } | null;
  entreguePorId: string | null;
  entreguePor: { id: string; nome: string } | null;
  atraso: Atraso | null;
  _count?: { comentarios: number; documentos?: number };
}

export type StatusDemanda = 'A_FAZER' | 'EM_ANDAMENTO' | 'CONCLUIDA';

export interface Demanda {
  id: string;
  titulo: string;
  descricao: string | null;
  status: StatusDemanda;
  createdAt: string;
  setorId: string;
  setor: Setor;
  clienteId: string | null;
  cliente: { id: string; razaoSocial: string; cnpj: string } | null;
  responsavelId: string | null;
  responsavel: { id: string; nome: string } | null;
}

export type TipoLancamento = 'PAGAR' | 'RECEBER';

export interface LancamentoFinanceiro {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  categoria: string | null;
  valor: number;
  vencimento: string;
  liquidadoEm: string | null;
  createdAt: string;
  clienteId: string | null;
  cliente: { id: string; razaoSocial: string; cnpj: string } | null;
}

export type StatusAtendimento = 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'FINALIZADO';

export interface Atendimento {
  id: string;
  motivo: string;
  observacoes: string | null;
  status: StatusAtendimento;
  abertoEm: string;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
  clienteId: string;
  cliente: { id: string; razaoSocial: string; cnpj: string };
  setorId: string;
  setor: Setor;
  responsavelId: string | null;
  responsavel: { id: string; nome: string } | null;
}
