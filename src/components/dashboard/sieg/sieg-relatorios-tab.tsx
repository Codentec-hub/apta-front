"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";

import { api } from "@/lib/api";
import { formatarDocumento } from "@/lib/empresa";
import { baixarArquivoApi, mesesRecentes, rotuloMes, TIPO_NOTA_LABEL, type TipoNota } from "@/lib/sieg";

interface TipoRelatorio {
	chave: string;
	nome: string;
	tipos: TipoNota[];
}

interface Empresa {
	documento: string;
	nome: string;
}

const DESCRICOES: Record<string, string> = {
	padrao: "Lista das notas do mês com os principais dados.",
	monofasico:
		"Receita de produtos monofásicos (PIS/COFINS). No Simples Nacional mostra o que não deveria pagar PIS/COFINS de novo no DAS.",
	basico: "Resumo das notas do mês (NF-e e NFC-e).",
	produtos: "Itens das notas, produto a produto (NF-e e NFC-e).",
	cte: "Conhecimentos de transporte do mês.",
	nfse: "Notas de serviço do mês.",
};

export function SiegRelatoriosTab(): React.JSX.Element {
	const meses = React.useMemo(() => mesesRecentes(13), []);
	const [tipos, setTipos] = React.useState<TipoRelatorio[]>([]);
	const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
	const [empresa, setEmpresa] = React.useState<Empresa | null>(null);
	const [mes, setMes] = React.useState(meses[1] ?? meses[0]!);
	const [relatorio, setRelatorio] = React.useState("monofasico");
	const [tipo, setTipo] = React.useState<TipoNota>("nfe");
	const [gerando, setGerando] = React.useState(false);
	const [erro, setErro] = React.useState<string | null>(null);
	const [ok, setOk] = React.useState<string | null>(null);

	React.useEffect(() => {
		void api<TipoRelatorio[]>("/sieg/dados/relatorios/tipos")
			.then(setTipos)
			.catch(() => setTipos([]));
		void api<{ empresas: (Empresa & { ativo: boolean; deletado: boolean })[] }>("/configuracoes/sieg/empresas")
			.then((r) => setEmpresas(r.empresas.filter((e) => e.ativo && !e.deletado)))
			.catch(() => setEmpresas([]));
	}, []);

	const atual = tipos.find((t) => t.chave === relatorio);
	React.useEffect(() => {
		if (atual && !atual.tipos.includes(tipo)) setTipo(atual.tipos[0]!);
	}, [atual, tipo]);

	async function gerar() {
		if (!empresa) return;
		setGerando(true);
		setErro(null);
		setOk(null);
		try {
			await baixarArquivoApi("/sieg/dados/relatorios", `relatorio-${relatorio}-${empresa.documento}-${mes}.xlsx`, {
				method: "POST",
				body: JSON.stringify({ documento: empresa.documento, mes, relatorio, tipo }),
			});
			setOk(`Relatório de ${empresa.nome} (${rotuloMes(mes)}) baixado.`);
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao gerar o relatório");
		} finally {
			setGerando(false);
		}
	}

	return (
		<Paper variant="outlined" sx={{ p: 3 }}>
			<Stack spacing={2} sx={{ maxWidth: 720 }}>
				<Typography variant="body2" color="text.secondary">
					Relatórios prontos que a própria SIEG monta a partir das notas guardadas lá. O arquivo é gerado na hora e
					baixado; a SIEG aceita poucos relatórios por minuto.
				</Typography>
				<Autocomplete
					options={empresas}
					value={empresa}
					onChange={(_e, v) => setEmpresa(v)}
					getOptionLabel={(e) => `${e.nome} · ${formatarDocumento(e.documento)}`}
					isOptionEqualToValue={(a, b) => a.documento === b.documento}
					renderInput={(params) => <TextField {...params} label="Empresa" />}
				/>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
					<TextField select label="Mês" value={mes} onChange={(e) => setMes(e.target.value)} sx={{ minWidth: 160 }}>
						{meses.map((m) => (
							<MenuItem key={m} value={m}>
								{rotuloMes(m)}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						label="Relatório"
						value={relatorio}
						onChange={(e) => setRelatorio(e.target.value)}
						sx={{ flex: 1 }}
					>
						{tipos.map((t) => (
							<MenuItem key={t.chave} value={t.chave}>
								{t.nome}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						label="Tipo de nota"
						value={tipo}
						onChange={(e) => setTipo(e.target.value as TipoNota)}
						sx={{ minWidth: 150 }}
					>
						{(atual?.tipos ?? []).map((t) => (
							<MenuItem key={t} value={t}>
								{TIPO_NOTA_LABEL[t]}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				{DESCRICOES[relatorio] ? (
					<Typography variant="caption" color="text.secondary">
						{DESCRICOES[relatorio]}
					</Typography>
				) : null}
				{erro ? <Alert severity="error">{erro}</Alert> : null}
				{ok ? <Alert severity="success">{ok}</Alert> : null}
				<Stack direction="row">
					<Button
						variant="contained"
						disabled={!empresa || gerando}
						startIcon={gerando ? <CircularProgress size={16} color="inherit" /> : <DownloadSimpleIcon />}
						onClick={() => void gerar()}
					>
						{gerando ? "Gerando na SIEG…" : "Gerar e baixar"}
					</Button>
				</Stack>
			</Stack>
		</Paper>
	);
}
