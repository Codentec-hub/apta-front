"use client";

import * as React from "react";
import RouterLink from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import dayjs from "dayjs";

import { paths } from "@/paths";
import { api } from "@/lib/api";
import { formatarDocumento } from "@/lib/empresa";
import { usePaginacao } from "@/hooks/use-paginacao";

interface EmpresaSieg {
	id: string;
	nome: string;
	documento: string;
	ufCertificado: number | null;
	certificadoExpiraEm: string | null;
	consultaNoturna: boolean;
	ativo: boolean;
	deletado: boolean;
	cliente: { id: string; nome: string; ativo: boolean } | null;
}

interface RespostaEmpresas {
	situacao: "nunca" | "andamento" | "concluida" | "erro";
	configurado: boolean;
	iniciadaEm: string | null;
	concluidaEm: string | null;
	paginasLidas: number;
	aguardandoLimiteAte: string | null;
	erro: string | null;
	empresas: EmpresaSieg[];
	clientesSemSieg: { id: string; nome: string; documento: string }[];
	totalClientesAtivos: number;
}

type Filtro = "todas" | "clientes" | "nao-clientes" | "vencidos" | "vencendo" | "inativas";

// Código IBGE da UF -> sigla (o SIEG devolve o código numérico).
const UF_IBGE: Record<number, string> = {
	11: "RO",
	12: "AC",
	13: "AM",
	14: "RR",
	15: "PA",
	16: "AP",
	17: "TO",
	21: "MA",
	22: "PI",
	23: "CE",
	24: "RN",
	25: "PB",
	26: "PE",
	27: "AL",
	28: "SE",
	29: "BA",
	31: "MG",
	32: "ES",
	33: "RJ",
	35: "SP",
	41: "PR",
	42: "SC",
	43: "RS",
	50: "MS",
	51: "MT",
	52: "GO",
	53: "DF",
};

function situacaoCertificado(expira: string | null): "vencido" | "vencendo" | "ok" | "sem" {
	if (!expira) return "sem";
	const dias = dayjs(expira).diff(dayjs(), "day");
	if (dias < 0) return "vencido";
	if (dias <= 30) return "vencendo";
	return "ok";
}

function Indicador({
	titulo,
	valor,
	nota,
	cor,
}: {
	titulo: string;
	valor: number | string;
	nota: string;
	cor?: string;
}): React.JSX.Element {
	return (
		<Card variant="outlined" sx={{ height: "100%" }}>
			<CardContent>
				<Typography color="text.secondary" variant="overline">
					{titulo}
				</Typography>
				<Typography variant="h4" sx={{ color: cor }}>
					{valor}
				</Typography>
				<Typography color="text.secondary" variant="caption">
					{nota}
				</Typography>
			</CardContent>
		</Card>
	);
}

function baixarCsv(empresas: EmpresaSieg[]): void {
	const linhas = [
		["Empresa", "CNPJ/CPF", "UF", "Certificado vence em", "Consulta noturna", "Ativa no SIEG", "Cliente na Apta"],
		...empresas.map((e) => [
			e.nome,
			formatarDocumento(e.documento),
			e.ufCertificado ? (UF_IBGE[e.ufCertificado] ?? String(e.ufCertificado)) : "",
			e.certificadoExpiraEm ? dayjs(e.certificadoExpiraEm).format("DD/MM/YYYY") : "",
			e.consultaNoturna ? "sim" : "não",
			e.ativo && !e.deletado ? "sim" : "não",
			e.cliente?.nome ?? "",
		]),
	];
	const csv = `\uFEFF${linhas.map((l) => l.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(";")).join("\r\n")}`;
	const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
	const a = document.createElement("a");
	a.href = url;
	a.download = `empresas-sieg-${dayjs().format("YYYY-MM-DD")}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

export function SiegEmpresasView(): React.JSX.Element {
	const [dados, setDados] = React.useState<RespostaEmpresas | null>(null);
	const [erroTela, setErroTela] = React.useState<string | null>(null);
	const [busca, setBusca] = React.useState("");
	const [filtro, setFiltro] = React.useState<Filtro>("todas");

	const carregar = React.useCallback(async (atualizar = false) => {
		try {
			const resposta = await api<RespostaEmpresas>(
				atualizar ? "/configuracoes/sieg/empresas/atualizar" : "/configuracoes/sieg/empresas",
				atualizar ? { method: "POST" } : {}
			);
			setDados(resposta);
			setErroTela(null);
		} catch (error) {
			setErroTela(error instanceof Error ? error.message : "Erro ao consultar as empresas do SIEG");
		}
	}, []);

	React.useEffect(() => {
		void carregar();
	}, [carregar]);

	// Enquanto a busca no SIEG roda em segundo plano, consulta o andamento.
	const emAndamento = dados?.situacao === "andamento";
	React.useEffect(() => {
		if (!emAndamento) return;
		const timer = setInterval(() => void carregar(), 3000);
		return () => clearInterval(timer);
	}, [emAndamento, carregar]);

	const empresas = React.useMemo(() => (dados?.empresas ?? []).filter((e) => !e.deletado), [dados]);

	const contagem = React.useMemo(() => {
		const c = { ativas: 0, clientes: 0, naoClientes: 0, vencidos: 0, vencendo: 0, inativas: 0, noturna: 0 };
		for (const e of empresas) {
			if (e.ativo) c.ativas++;
			else c.inativas++;
			if (e.cliente) c.clientes++;
			else c.naoClientes++;
			const s = situacaoCertificado(e.certificadoExpiraEm);
			if (s === "vencido") c.vencidos++;
			if (s === "vencendo") c.vencendo++;
			if (e.consultaNoturna) c.noturna++;
		}
		return c;
	}, [empresas]);

	const filtradas = React.useMemo(() => {
		const termo = busca.trim().toLowerCase();
		const digitos = termo.replaceAll(/\D/g, "");
		return empresas.filter((e) => {
			if (termo && !e.nome.toLowerCase().includes(termo) && !(digitos && e.documento.includes(digitos))) return false;
			const s = situacaoCertificado(e.certificadoExpiraEm);
			switch (filtro) {
				case "clientes": {
					return Boolean(e.cliente);
				}
				case "nao-clientes": {
					return !e.cliente;
				}
				case "vencidos": {
					return s === "vencido";
				}
				case "vencendo": {
					return s === "vencendo";
				}
				case "inativas": {
					return !e.ativo;
				}
				default: {
					return true;
				}
			}
		});
	}, [empresas, busca, filtro]);

	const paginacao = usePaginacao(filtradas, 25);
	React.useEffect(() => paginacao.resetarPagina(), [busca, filtro]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Stack spacing={3}>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				spacing={2}
				sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
			>
				<Stack spacing={0.5}>
					<Link
						component={RouterLink}
						href={paths.dashboard.integracoes}
						underline="hover"
						variant="body2"
						sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
					>
						<ArrowLeftIcon size={14} /> Integrações
					</Link>
					<Typography variant="h4">Empresas na SIEG</Typography>
					<Typography color="text.secondary" variant="body2">
						Empresas com certificado digital cadastrado na conta SIEG da Apta (API “Listar Certificados e Empresas”),
						lidas agora e cruzadas com os clientes daqui pelo CNPJ/CPF. Empresas sem certificado na SIEG não aparecem
						nesta consulta.
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1}>
					<Button
						variant="outlined"
						startIcon={<DownloadSimpleIcon />}
						disabled={filtradas.length === 0}
						onClick={() => baixarCsv(filtradas)}
					>
						Exportar
					</Button>
					<Button
						variant="contained"
						startIcon={emAndamento ? <CircularProgress size={16} color="inherit" /> : <ArrowClockwiseIcon />}
						disabled={emAndamento || !dados?.configurado}
						onClick={() => void carregar(true)}
					>
						{emAndamento ? "Buscando…" : "Atualizar do SIEG"}
					</Button>
				</Stack>
			</Stack>

			{erroTela ? <Alert severity="error">{erroTela}</Alert> : null}

			{dados && !dados.configurado ? (
				<Alert severity="warning">
					As credenciais do SIEG (Client ID e Secret Key) não estão configuradas neste ambiente, então não dá para
					consultar as empresas. Configure em Integrações ou nas variáveis SIEG_CLIENT_ID/SIEG_SECRET_KEY.
				</Alert>
			) : null}

			{dados?.situacao === "erro" ? (
				<Alert severity="error">
					A busca no SIEG falhou: {dados.erro}
					{dados.empresas.length > 0 ? ` (mostrando ${dados.empresas.length} empresas que vieram antes do erro)` : ""}
				</Alert>
			) : null}

			{emAndamento ? (
				<Card variant="outlined">
					<CardContent>
						<Stack spacing={1}>
							<Typography variant="body2">
								Consultando o SIEG…{" "}
								{dados?.paginasLidas
									? `${dados.paginasLidas} página(s) lida(s), ${empresas.length} empresas até agora.`
									: ""}
							</Typography>
							{dados?.aguardandoLimiteAte ? (
								<Typography color="text.secondary" variant="caption">
									O SIEG limita as consultas por minuto; aguardando até{" "}
									{dayjs(dados.aguardandoLimiteAte).format("HH:mm:ss")} para continuar.
								</Typography>
							) : null}
							<LinearProgress />
						</Stack>
					</CardContent>
				</Card>
			) : null}

			{dados?.situacao === "concluida" ? (
				<Alert severity="success">
					Integração funcionando: {empresas.length} empresas lidas da SIEG em {dados.paginasLidas} página(s), às{" "}
					{dayjs(dados.concluidaEm).format("HH:mm [de] DD/MM/YYYY")}.
				</Alert>
			) : null}

			<Grid container spacing={2}>
				<Grid size={{ xs: 6, md: 3 }}>
					<Indicador
						titulo="Com certificado na SIEG"
						valor={empresas.length}
						nota={`${contagem.ativas} ativas · ${contagem.noturna} com consulta noturna`}
					/>
				</Grid>
				<Grid size={{ xs: 6, md: 3 }}>
					<Indicador
						titulo="Clientes da Apta"
						valor={contagem.clientes}
						nota={`de ${dados?.totalClientesAtivos ?? 0} clientes ativos cadastrados`}
					/>
				</Grid>
				<Grid size={{ xs: 6, md: 3 }}>
					<Indicador
						titulo="Certificado vencido"
						valor={contagem.vencidos}
						nota="a SIEG não baixa notas dessas empresas"
						cor={contagem.vencidos ? "error.main" : undefined}
					/>
				</Grid>
				<Grid size={{ xs: 6, md: 3 }}>
					<Indicador
						titulo="Vence em 30 dias"
						valor={contagem.vencendo}
						nota="avisar o cliente para renovar"
						cor={contagem.vencendo ? "warning.main" : undefined}
					/>
				</Grid>
			</Grid>

			<Paper variant="outlined">
				<Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ p: 2, alignItems: { md: "center" } }}>
					<TextField
						size="small"
						label="Buscar por nome ou CNPJ"
						value={busca}
						onChange={(e) => setBusca(e.target.value)}
						sx={{ minWidth: 260 }}
					/>
					<ToggleButtonGroup
						size="small"
						exclusive
						value={filtro}
						onChange={(_e, v: Filtro | null) => v && setFiltro(v)}
						sx={{ flexWrap: "wrap" }}
					>
						<ToggleButton value="todas">Todas ({empresas.length})</ToggleButton>
						<ToggleButton value="clientes">Clientes Apta ({contagem.clientes})</ToggleButton>
						<ToggleButton value="nao-clientes">Fora da Apta ({contagem.naoClientes})</ToggleButton>
						<ToggleButton value="vencidos">Vencidos ({contagem.vencidos})</ToggleButton>
						<ToggleButton value="vencendo">Vencendo ({contagem.vencendo})</ToggleButton>
						<ToggleButton value="inativas">Inativas ({contagem.inativas})</ToggleButton>
					</ToggleButtonGroup>
				</Stack>
				<TableContainer>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Empresa</TableCell>
								<TableCell>CNPJ/CPF</TableCell>
								<TableCell>UF</TableCell>
								<TableCell>Certificado</TableCell>
								<TableCell>Consulta noturna</TableCell>
								<TableCell>Cliente na Apta</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{paginacao.itensPaginados.map((e) => {
								const s = situacaoCertificado(e.certificadoExpiraEm);
								return (
									<TableRow key={e.id || e.documento} hover>
										<TableCell>
											<Typography variant="body2">{e.nome || "—"}</Typography>
											{e.ativo ? null : (
												<Chip label="Inativa no SIEG" size="small" variant="outlined" sx={{ mt: 0.5 }} />
											)}
										</TableCell>
										<TableCell sx={{ whiteSpace: "nowrap" }}>{formatarDocumento(e.documento)}</TableCell>
										<TableCell>{e.ufCertificado ? (UF_IBGE[e.ufCertificado] ?? e.ufCertificado) : "—"}</TableCell>
										<TableCell sx={{ whiteSpace: "nowrap" }}>
											{e.certificadoExpiraEm ? (
												<Chip
													size="small"
													color={s === "vencido" ? "error" : s === "vencendo" ? "warning" : "default"}
													variant={s === "ok" ? "outlined" : "filled"}
													label={`${s === "vencido" ? "Venceu" : "Vence"} ${dayjs(e.certificadoExpiraEm).format("DD/MM/YYYY")}`}
												/>
											) : (
												"—"
											)}
										</TableCell>
										<TableCell>{e.consultaNoturna ? "Ligada" : "Desligada"}</TableCell>
										<TableCell>
											{e.cliente ? (
												<Link
													component={RouterLink}
													href={`${paths.dashboard.clientes}/${e.cliente.id}`}
													variant="body2"
												>
													{e.cliente.nome}
												</Link>
											) : (
												<Typography color="text.secondary" variant="body2">
													Não cadastrada
												</Typography>
											)}
										</TableCell>
									</TableRow>
								);
							})}
							{filtradas.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6}>
										<Box sx={{ py: 4, textAlign: "center" }}>
											<Typography color="text.secondary" variant="body2">
												{emAndamento
													? "Aguardando a resposta do SIEG…"
													: empresas.length > 0
														? "Nenhuma empresa com esse filtro."
														: "Nenhuma empresa retornada pelo SIEG."}
											</Typography>
										</Box>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					component="div"
					count={filtradas.length}
					page={paginacao.pagina}
					rowsPerPage={paginacao.linhasPorPagina}
					rowsPerPageOptions={[25, 50, 100]}
					onPageChange={paginacao.aoMudarPagina}
					onRowsPerPageChange={paginacao.aoMudarLinhasPorPagina}
					labelRowsPerPage="Linhas por página"
				/>
			</Paper>

			{dados?.situacao === "concluida" && dados.clientesSemSieg.length > 0 ? (
				<Card variant="outlined">
					<CardContent>
						<Stack spacing={1.5}>
							<Typography variant="h6">
								Clientes da Apta que não estão na SIEG ({dados.clientesSemSieg.length})
							</Typography>
							<Typography color="text.secondary" variant="body2">
								Clientes ativos aqui cujo CNPJ/CPF não aparece na conta SIEG — as notas deles não serão capturadas.
							</Typography>
							<Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
								{dados.clientesSemSieg.map((c) => (
									<Chip
										key={c.id}
										component={RouterLink}
										href={`${paths.dashboard.clientes}/${c.id}`}
										clickable
										label={`${c.nome} · ${formatarDocumento(c.documento)}`}
										variant="outlined"
									/>
								))}
							</Stack>
						</Stack>
					</CardContent>
				</Card>
			) : null}
		</Stack>
	);
}
