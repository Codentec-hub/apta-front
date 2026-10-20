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
  dataAbertura: string | null;
  situacaoCadastral: string | null;
  cnaePrincipal: string | null;
  cnaeDescricao: string | null;
  cnaesSecundarios: { codigo: string; descricao: string }[] | null;
  atividades: AtividadeEmpresa[];
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  notasEmitidas: NotaEmitida[];
  cep: string | null;
  endereco: string | null;
  responsaveis: ClienteResponsavel[];
  contatos?: ContatoCliente[];
}

// "Contatos na empresa": quem recebe os documentos de cada departamento.
export type AtividadeEmpresa = 'servicos' | 'comercio' | 'industria';
export type NotaEmitida = 'nfse' | 'nfe' | 'nfce' | 'cte';

// Resultado da consulta do CNPJ na Receita (GET /consulta-cnpj/:cnpj).
export interface ConsultaCnpj {
  jaCadastrado: { id: string; razaoSocial: string; codigo: number } | null;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  situacaoCadastral: string | null;
  dataAbertura: string | null;
  cnaePrincipal: string | null;
  cnaeDescricao: string | null;
  cnaesSecundarios: { codigo: string; descricao: string }[];
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  simples: boolean;
  mei: boolean;
  socios: { nome: string; cargo: string | null; responsavelLegal: boolean }[];
}

export interface ContatoCliente {
  id: string;
  nome: string;
  cargo: string | null;
  celular: string | null;
  email: string | null;
  recebeTodos: boolean;
  responsavelLegal: boolean;
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
  alertasNaoLida: { diasAntes: number; enviadoEm: string; erro: string | null }[];
}

// Configuração geral do envio de e-mails ao cliente (lembrete de guia não lida).
export interface ConfiguracaoEnvio {
  diasAlertaNaoLida: number[];
  prefixoAlertaNaoLida: string;
  avisoCabecalho: string | null;
  emailConfigurado: boolean;
}

export interface ConfiguracaoGemini {
  modelo: string;
  apiKeyConfigurada: boolean;
  apiKeyMascarada: string | null;
  origem: 'banco' | 'ambiente' | 'nenhuma';
}

export interface ConfiguracaoEvolution {
  url: string | null;
  instancia: string | null;
  apiKeyConfigurada: boolean;
  apiKeyMascarada: string | null;
  origem: 'banco' | 'ambiente' | 'nenhuma';
}

// Resumo que vem em cada linha da Lista de Entregas.
export type ProtocoloResumo = Pick<
  ProtocoloEntrega,
  'id' | 'numero' | 'destinatarioNome' | 'status' | 'enviadoEm' | 'lidoEm'
>;

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
  valorGuia: number | null;
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

export type StatusAtendimento = 'TRIAGEM' | 'AGUARDANDO' | 'EM_ATENDIMENTO' | 'FINALIZADO';

export interface MotivoAtendimento {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface Atendimento {
  id: string;
  motivo: string | null;
  observacoes: string | null;
  status: StatusAtendimento;
  abertoEm: string;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
  clienteId: string | null;
  cliente: { id: string; razaoSocial: string; cnpj: string } | null;
  setorId: string | null;
  setor: Setor | null;
  responsavelId: string | null;
  responsavel: { id: string; nome: string } | null;
  motivoId: string | null;
  motivoCategoria: { id: string; nome: string } | null;
  conversaId: string | null;
}

export interface AgenteIA {
  id: string;
  nome: string;
  descricao: string | null;
  instrucoes: string;
  ativo: boolean;
  setorId: string | null;
  setor: { id: string; nome: string } | null;
}

export type ModoConversa = 'HUMANO' | 'AGENTE';
export type AbaConversa = 'triagem' | 'aguardando' | 'em_atendimento' | 'agente' | 'finalizadas';

export interface Conversa {
  id: string;
  // Nulo nos atendimentos registrados à mão.
  telefone: string | null;
  nomeExibicao: string | null;
  // "whatsapp" ou um canal manual (telefone, presencial, email, whatsapp_externo, outro).
  canal: string;
  modo: ModoConversa;
  naoLidas: number;
  ultimaMensagemEm: string | null;
  ultimaMensagemTexto: string | null;
  ultimaEntradaEm: string | null;
  clienteId: string | null;
  cliente: {
    id: string;
    razaoSocial: string;
    nomeFantasia: string | null;
    apelido: string | null;
    codigo: number;
    cnpj: string;
  } | null;
  contatoId: string | null;
  contato: { id: string; nome: string; cargo: string | null } | null;
  agenteId: string | null;
  agente: { id: string; nome: string } | null;
  atendimento: (Omit<Atendimento, 'cliente' | 'setor'> & { setor: { id: string; nome: string } | null }) | null;
}

export type AutorMensagem = 'CLIENTE' | 'ATENDENTE' | 'AGENTE' | 'AUTOMACAO' | 'SISTEMA';
export type StatusMensagem = 'RECEBIDA' | 'PENDENTE' | 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'FALHA';

export interface Mensagem {
  id: string;
  autor: AutorMensagem;
  tipo: 'TEXTO' | 'DOCUMENTO' | 'IMAGEM' | 'AUDIO';
  texto: string | null;
  interna: boolean;
  status: StatusMensagem;
  erro: string | null;
  createdAt: string;
  usuario: { id: string; nome: string } | null;
  agente: { id: string; nome: string } | null;
}

export interface ConversaDetalhe extends Conversa {
  mensagens: Mensagem[];
  totalAtendimentos: number;
}

export type CanalManual = 'telefone' | 'presencial' | 'email' | 'whatsapp_externo' | 'outro';

export interface StatusWhatsApp {
  provedor: string;
  simulador: boolean;
  exigeJanela24h: boolean;
  agenteConfigurado: boolean;
}
