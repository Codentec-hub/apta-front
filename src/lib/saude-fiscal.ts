// Tipos do relatório de saúde fiscal (espelham backend/src/saude-fiscal/dados.ts).

export type Gravidade = "alta" | "media" | "baixa";

export interface Pendencia {
	id: string;
	origem: "manual" | "certificado" | "guia" | "sieg" | "obrigacao" | "cadastro";
	gravidade: Gravidade;
	titulo: string;
	detalhe: string | null;
	interna: boolean;
	pendenciaId?: string;
	prazo?: string | null;
}

export interface NotaResumo {
	chave: string;
	tipo: string;
	numero: string | null;
	emissao: string | null;
	contraparteDocumento: string | null;
	contraparteNome: string | null;
	valor: number;
}

export interface DadosSaudeFiscal {
	versao: 1;
	geradoEm: string;
	mes: string;
	empresa: {
		razaoSocial: string;
		nomeFantasia: string | null;
		cnpj: string;
		regimeTributario: string | null;
		codigo: number;
	};
	naSieg: boolean;
	resumo: {
		saidas: number;
		entradas: number;
		notasEmitidas: number;
		notasRecebidas: number;
		canceladas: number;
		servicosPrestados: number;
		servicosTomados: number;
	};
	serie: { mes: string; entradas: number; saidas: number }[];
	cobertura: { contadas: number; capturadas: number };
	compras: {
		fornecedores: { documento: string | null; nome: string; valor: number; notas: number }[];
		notas: NotaResumo[];
	};
	servicos: { prestados: NotaResumo[]; tomados: NotaResumo[] };
	guias: {
		nome: string;
		prazo: string;
		valor: number | null;
		situacao: "entregue" | "pendente" | "atrasada" | "dispensada";
		lida: boolean | null;
	}[];
	certificado: { expiraEm: string | null; dias: number | null };
	pendencias: Pendencia[];
}

export interface CanaisDisponiveis {
	email: boolean;
	whatsapp: boolean;
	whatsappSimulador: boolean;
}

export interface ResultadoEnvio {
	canal: "email" | "whatsapp";
	destino: string;
	nome: string;
	status: "enviado" | "falha";
	erro?: string;
	em: string;
}

const MESES = [
	"janeiro",
	"fevereiro",
	"março",
	"abril",
	"maio",
	"junho",
	"julho",
	"agosto",
	"setembro",
	"outubro",
	"novembro",
	"dezembro",
];

/** "2026-10" -> "outubro de 2026" */
export const mesPorExtenso = (mes: string): string =>
	`${MESES[Number(mes.slice(5, 7)) - 1] ?? mes} de ${mes.slice(0, 4)}`;

/** Valor curto para eixos: 12,3 mil · 1,2 mi */
export function moedaCurta(v: number): string {
	if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
	if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
	return v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

/** Resume os envios: "2 enviados · 1 falha" */
export function resumoEnvios(r: ResultadoEnvio[]): string {
	const ok = r.filter((x) => x.status === "enviado").length;
	const falhas = r.length - ok;
	if (r.length === 0) return "nenhum contato com e-mail ou WhatsApp";
	return [ok ? `${ok} enviado(s)` : null, falhas ? `${falhas} falha(s)` : null].filter(Boolean).join(" · ");
}
