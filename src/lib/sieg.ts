import { config } from "@/config";
import { getToken } from "@/lib/api";

export type TipoNota = "nfe" | "nfce" | "cte" | "nfse" | "cfe";
export type Papel = "emitente" | "destinatario";

export const TIPO_NOTA_LABEL: Record<TipoNota, string> = {
	nfe: "NF-e",
	nfce: "NFC-e",
	cte: "CT-e",
	nfse: "NFS-e",
	cfe: "CF-e (SAT)",
};

export const PAPEL_LABEL: Record<Papel, string> = { emitente: "Emitidas", destinatario: "Recebidas" };

export interface ContagemTipos {
	nfe: number;
	nfce: number;
	cte: number;
	cfe: number;
	nfse: number;
}

export const totalContagem = (c: ContagemTipos | null): number => (c ? c.nfe + c.nfce + c.cte + c.cfe + c.nfse : 0);

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-10" -> "out/2026" */
export function rotuloMes(mes: string): string {
	return `${MESES[Number(mes.slice(5, 7)) - 1] ?? mes}/${mes.slice(0, 4)}`;
}

/** Últimos N meses (AAAA-MM), do atual para trás. */
export function mesesRecentes(quantos: number): string[] {
	const hoje = new Date();
	return Array.from({ length: quantos }, (_v, i) => {
		const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
	});
}

/**
 * Baixa um arquivo de uma rota autenticada do backend (XML, DANFE, relatório)
 * e dispara o download no navegador. Lança Error com a mensagem do backend.
 */
export async function baixarArquivoApi(path: string, nomePadrao: string, init: RequestInit = {}): Promise<void> {
	const token = getToken();
	const res = await fetch(`${config.apiUrl}${path}`, {
		...init,
		headers: {
			...(init.body ? { "Content-Type": "application/json" } : {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...init.headers,
		},
	});
	if (!res.ok) {
		const body = await res.json().catch(() => null);
		throw new Error(typeof body?.erro === "string" ? body.erro : `Erro ${res.status}`);
	}
	const nome = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? nomePadrao;
	const url = URL.createObjectURL(await res.blob());
	const a = document.createElement("a");
	a.href = url;
	a.download = nome;
	a.click();
	URL.revokeObjectURL(url);
}

export const formatarMoeda = (v: number | null | undefined): string =>
	v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
