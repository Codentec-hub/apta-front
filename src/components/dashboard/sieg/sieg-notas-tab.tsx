"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
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
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { FileZipIcon } from "@phosphor-icons/react/dist/ssr/FileZip";
import { FileCodeIcon } from "@phosphor-icons/react/dist/ssr/FileCode";
import { FilePdfIcon } from "@phosphor-icons/react/dist/ssr/FilePdf";
import { ListBulletsIcon } from "@phosphor-icons/react/dist/ssr/ListBullets";
import dayjs from "dayjs";

import { api } from "@/lib/api";
import { formatarDocumento } from "@/lib/empresa";
import {
	baixarArquivoApi,
	formatarMoeda,
	mesesRecentes,
	PAPEL_LABEL,
	rotuloMes,
	TIPO_NOTA_LABEL,
	totalContagem,
	type ContagemTipos,
	type Papel,
	type TipoNota,
} from "@/lib/sieg";
import { usePaginacao } from "@/hooks/use-paginacao";

interface LinhaContagem {
	documento: string;
	nome: string;
	clienteId: string | null;
	emitidas: ContagemTipos | null;
	recebidas: ContagemTipos | null;
	atualizadoEm: string | null;
}

interface RespostaContagens {
	mes: string;
	andamento: { situacao: string; mes: string | null; feitas: number; total: number; erros: string[] };
	empresas: LinhaContagem[];
}

interface Nota {
	chave: string;
	tipo: TipoNota;
	numero: string | null;
	serie: string | null;
	emissao: string | null;
	emitenteDocumento: string | null;
	emitenteNome: string | null;
	destinatarioDocumento: string | null;
	destinatarioNome: string | null;
	valor: number | null;
	naturezaOperacao: string | null;
	cancelada?: boolean;
}

interface RespostaNotas {
	notas: Nota[];
	total: number;
	busca: { situacao: string; paginas: number; notas: number; erro: string | null; concluidaEm: string | null } | null;
}

interface Evento {
	tipo: number | null;
	descricao: string;
	protocolo: string | null;
	data: string | null;
}

const TIPOS: TipoNota[] = ["nfe", "nfce", "nfse", "cte", "cfe"];

function ResumoTipos({ c }: { c: ContagemTipos | null }): React.JSX.Element {
	if (!c)
		return (
			<Typography color="text.secondary" variant="body2">
				não contado
			</Typography>
		);
	const partes = TIPOS.filter((t) => c[t] > 0).map((t) => `${TIPO_NOTA_LABEL[t]} ${c[t]}`);
	return (
		<Tooltip title={partes.join(" · ") || "nenhuma nota"}>
			<Typography variant="body2" sx={{ fontWeight: totalContagem(c) ? 600 : 400 }}>
				{totalContagem(c)}
			</Typography>
		</Tooltip>
	);
}

interface Props {
	podeAcionar: boolean;
	documentoInicial?: string | null;
}

export function SiegNotasTab({ podeAcionar, documentoInicial }: Props): React.JSX.Element {
	const meses = React.useMemo(() => mesesRecentes(13), []);
	const [mes, setMes] = React.useState(meses[0]!);
	const [contagens, setContagens] = React.useState<RespostaContagens | null>(null);
	const [erro, setErro] = React.useState<string | null>(null);
	const [empresa, setEmpresa] = React.useState<LinhaContagem | null>(null);
	const [tipo, setTipo] = React.useState<TipoNota>("nfe");
	const [papel, setPapel] = React.useState<Papel>("emitente");
	const [notas, setNotas] = React.useState<RespostaNotas | null>(null);
	const [eventos, setEventos] = React.useState<{ nota: Nota; lista: Evento[] | null; erro?: string } | null>(null);
	const [baixando, setBaixando] = React.useState<string | null>(null);
	const [busca, setBusca] = React.useState("");

	const carregarContagens = React.useCallback(async () => {
		try {
			setContagens(await api<RespostaContagens>(`/sieg/dados/contagens?mes=${mes}`));
			setErro(null);
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao carregar as contagens");
		}
	}, [mes]);

	React.useEffect(() => {
		void carregarContagens();
	}, [carregarContagens]);

	// Abre direto numa empresa quando vem da ficha do cliente (?documento=).
	React.useEffect(() => {
		if (!documentoInicial || !contagens || empresa) return;
		const achada = contagens.empresas.find((e) => e.documento === documentoInicial);
		if (achada) setEmpresa(achada);
	}, [documentoInicial, contagens, empresa]);

	const contandoTodas = contagens?.andamento.situacao === "andamento";
	React.useEffect(() => {
		if (!contandoTodas) return;
		const t = setInterval(() => void carregarContagens(), 5000);
		return () => clearInterval(t);
	}, [contandoTodas, carregarContagens]);

	const carregarNotas = React.useCallback(async () => {
		if (!empresa) return;
		try {
			setNotas(
				await api<RespostaNotas>(
					`/sieg/dados/notas?documento=${empresa.documento}&mes=${mes}&tipo=${tipo}&papel=${papel}`
				)
			);
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao carregar as notas");
		}
	}, [empresa, mes, tipo, papel]);

	React.useEffect(() => {
		setNotas(null);
		void carregarNotas();
	}, [carregarNotas]);

	const capturando = notas?.busca?.situacao === "andamento";
	React.useEffect(() => {
		if (!capturando) return;
		const t = setInterval(() => void carregarNotas(), 5000);
		return () => clearInterval(t);
	}, [capturando, carregarNotas]);

	async function acionar(fn: () => Promise<unknown>) {
		try {
			setErro(null);
			await fn();
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao falar com a SIEG");
		}
	}

	async function baixar(nota: Nota, formato: "xml") {
		setBaixando(`${nota.chave}-${formato}`);
		await acionar(() =>
			baixarArquivoApi(
				`/sieg/dados/notas/${encodeURIComponent(nota.chave)}/${formato}`,
				`${nota.chave}.xml`
			)
		);
		setBaixando(null);
	}

	async function verEventos(nota: Nota) {
		setEventos({ nota, lista: null });
		try {
			const lista = await api<Evento[]>(`/sieg/dados/notas/${encodeURIComponent(nota.chave)}/eventos`);
			setEventos({ nota, lista });
		} catch (error) {
			setEventos({ nota, lista: [], erro: error instanceof Error ? error.message : "Erro ao buscar os eventos" });
		}
	}

	const linhas = React.useMemo(() => {
		const termo = busca.trim().toLowerCase();
		const dig = termo.replaceAll(/\D/g, "");
		return (contagens?.empresas ?? []).filter(
			(e) => !termo || e.nome.toLowerCase().includes(termo) || (dig && e.documento.includes(dig))
		);
	}, [contagens, busca]);
	const pag = usePaginacao(linhas, 25);
	const pagNotas = usePaginacao(notas?.notas ?? [], 25);

	const contagemSelecionada = empresa ? contagens?.empresas.find((e) => e.documento === empresa.documento) : null;
	const esperado = contagemSelecionada?.[papel === "emitente" ? "emitidas" : "recebidas"]?.[tipo] ?? null;
	const naoContadas = (contagens?.empresas ?? []).filter((e) => !e.emitidas && !e.recebidas).length;

	return (
		<Stack spacing={2}>
			{erro ? (
				<Alert severity="error" onClose={() => setErro(null)}>
					{erro}
				</Alert>
			) : null}

			<Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
				<TextField
					select
					size="small"
					label="Mês"
					value={mes}
					onChange={(e) => setMes(e.target.value)}
					sx={{ minWidth: 140 }}
				>
					{meses.map((m) => (
						<MenuItem key={m} value={m}>
							{rotuloMes(m)}
						</MenuItem>
					))}
				</TextField>
				<Autocomplete
					size="small"
					sx={{ minWidth: 340, flex: 1 }}
					options={contagens?.empresas ?? []}
					value={empresa}
					onChange={(_e, v) => setEmpresa(v)}
					getOptionLabel={(e) => `${e.nome} · ${formatarDocumento(e.documento)}`}
					isOptionEqualToValue={(a, b) => a.documento === b.documento}
					renderInput={(params) => <TextField {...params} label="Empresa (para ver as notas)" />}
				/>
				{podeAcionar ? (
					<Button
						variant="outlined"
						startIcon={contandoTodas ? <CircularProgress size={16} /> : <ArrowClockwiseIcon />}
						disabled={contandoTodas}
						onClick={() =>
							void acionar(async () => {
								await api("/sieg/dados/contagens/atualizar", { method: "POST", body: JSON.stringify({ mes }) });
								await carregarContagens();
							})
						}
					>
						{contandoTodas ? "Contando…" : `Contar notas de ${rotuloMes(mes)}`}
					</Button>
				) : null}
			</Stack>

			{contandoTodas && contagens ? (
				<Box>
					<Typography variant="caption" color="text.secondary">
						Contando as notas na SIEG: {contagens.andamento.feitas} de {contagens.andamento.total} empresas (a SIEG
						aceita 5 contagens por minuto).
					</Typography>
					<LinearProgress
						variant="determinate"
						value={contagens.andamento.total ? (contagens.andamento.feitas / contagens.andamento.total) * 100 : 0}
					/>
				</Box>
			) : null}
			{contagens && contagens.andamento.erros.length > 0 && contagens.andamento.mes === mes ? (
				<Alert severity="warning">
					{contagens.andamento.erros.length} empresa(s) não foram contadas:{" "}
					{contagens.andamento.erros.slice(0, 3).join(" | ")}
				</Alert>
			) : null}

			{empresa ? (
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
							<Box>
								<Typography variant="h6">{empresa.nome}</Typography>
								<Typography color="text.secondary" variant="body2">
									{formatarDocumento(empresa.documento)} · {rotuloMes(mes)}
								</Typography>
							</Box>
							<Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
								<Tooltip title="XMLs já guardados de todos os tipos (pastas emitidas e recebidas), para importar na Domínio">
									<Button
										size="small"
										variant="outlined"
										disabled={baixando !== null}
										startIcon={baixando === "zip" ? <CircularProgress size={14} /> : <FileZipIcon />}
										onClick={() => {
											setBaixando("zip");
											setErro(null);
											baixarArquivoApi(`/sieg/dados/notas/zip?documento=${empresa.documento}&mes=${mes}`, `xmls-${empresa.documento}-${mes}.zip`)
												.catch((error: unknown) => setErro(error instanceof Error ? error.message : "Erro ao baixar o ZIP"))
												.finally(() => setBaixando(null));
										}}
									>
										XMLs do mês (ZIP)
									</Button>
								</Tooltip>
								<Button size="small" onClick={() => setEmpresa(null)}>
									Voltar para todas
								</Button>
							</Stack>
						</Stack>

						<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
							<ToggleButtonGroup
								size="small"
								exclusive
								value={papel}
								onChange={(_e, v: Papel | null) => v && setPapel(v)}
							>
								{(["emitente", "destinatario"] as Papel[]).map((p) => (
									<ToggleButton key={p} value={p}>
										{PAPEL_LABEL[p]} (
										{totalContagem(contagemSelecionada?.[p === "emitente" ? "emitidas" : "recebidas"] ?? null)})
									</ToggleButton>
								))}
							</ToggleButtonGroup>
							<ToggleButtonGroup
								size="small"
								exclusive
								value={tipo}
								onChange={(_e, v: TipoNota | null) => v && setTipo(v)}
								sx={{ flexWrap: "wrap" }}
							>
								{TIPOS.map((t) => (
									<ToggleButton key={t} value={t}>
										{TIPO_NOTA_LABEL[t]} (
										{contagemSelecionada?.[papel === "emitente" ? "emitidas" : "recebidas"]?.[t] ?? "–"})
									</ToggleButton>
								))}
							</ToggleButtonGroup>
						</Stack>

						<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
							{podeAcionar ? (
								<Button
									variant="contained"
									disabled={capturando}
									startIcon={capturando ? <CircularProgress size={16} color="inherit" /> : <ArrowClockwiseIcon />}
									onClick={() =>
										void acionar(async () => {
											await api("/sieg/dados/notas/capturar", {
												method: "POST",
												body: JSON.stringify({ documento: empresa.documento, mes, tipo, papel }),
											});
											await carregarNotas();
										})
									}
								>
									{capturando ? "Buscando na SIEG…" : notas?.busca ? "Buscar de novo na SIEG" : "Buscar notas na SIEG"}
								</Button>
							) : null}
							<Typography variant="body2" color="text.secondary">
								{notas?.busca
									? notas.busca.situacao === "andamento"
										? `Buscando… ${notas.busca.notas} nota(s) em ${notas.busca.paginas} página(s). A SIEG entrega 50 notas a cada 30 s.`
										: notas.busca.situacao === "erro"
											? `A última busca falhou: ${notas.busca.erro}`
											: `Última busca: ${dayjs(notas.busca.concluidaEm).format("DD/MM/YYYY HH:mm")} · ${notas.busca.notas} nota(s).${
													notas.busca.erro ? ` ${notas.busca.erro}` : ""
												}`
									: "Ainda não buscamos as notas desta combinação na SIEG."}
								{esperado !== null && notas ? ` A SIEG contou ${esperado}.` : ""}
							</Typography>
						</Stack>
						{capturando ? <LinearProgress /> : null}

						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Número</TableCell>
										<TableCell>Emissão</TableCell>
										<TableCell>{papel === "emitente" ? "Destinatário" : "Emitente"}</TableCell>
										<TableCell align="right">Valor</TableCell>
										<TableCell align="right">Arquivos</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{pagNotas.itensPaginados.map((n) => {
										const nome = papel === "emitente" ? n.destinatarioNome : n.emitenteNome;
										const doc = papel === "emitente" ? n.destinatarioDocumento : n.emitenteDocumento;
										return (
											<TableRow key={n.chave} hover>
												<TableCell>
													{n.numero ?? "—"}
													{n.cancelada ? (
														<Chip size="small" color="error" variant="outlined" label="Cancelada" sx={{ ml: 1 }} />
													) : null}
													{n.serie ? (
														<Typography component="span" variant="caption" color="text.secondary">
															{" "}
															/ {n.serie}
														</Typography>
													) : null}
												</TableCell>
												<TableCell sx={{ whiteSpace: "nowrap" }}>
													{n.emissao ? dayjs(n.emissao).format("DD/MM/YYYY") : "—"}
												</TableCell>
												<TableCell>
													<Typography variant="body2">{nome ?? "—"}</Typography>
													<Typography variant="caption" color="text.secondary">
														{doc ? formatarDocumento(doc) : ""}
														{n.naturezaOperacao ? ` · ${n.naturezaOperacao}` : ""}
													</Typography>
												</TableCell>
												<TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
													{formatarMoeda(n.valor)}
												</TableCell>
												<TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
													<Tooltip title="Baixar XML">
														<IconButton size="small" disabled={baixando !== null} onClick={() => void baixar(n, "xml")}>
															{baixando === `${n.chave}-xml` ? <CircularProgress size={16} /> : <FileCodeIcon />}
														</IconButton>
													</Tooltip>
													<Tooltip title={n.tipo === "nfe" || n.tipo === "nfce" ? "Ver DANFE (imprimir / PDF)" : "Ver a nota (imprimir / PDF)"}>
														<IconButton
															size="small"
															component="a"
															href={`/nota/${encodeURIComponent(n.chave)}`}
															target="_blank"
															rel="noopener"
														>
															<FilePdfIcon />
														</IconButton>
													</Tooltip>
													{n.tipo === "nfe" || n.tipo === "nfce" || n.tipo === "cte" || n.tipo === "nfse" ? (
														<Tooltip title="Eventos (cancelamento, carta de correção…)">
															<IconButton size="small" onClick={() => void verEventos(n)}>
																<ListBulletsIcon />
															</IconButton>
														</Tooltip>
													) : null}
												</TableCell>
											</TableRow>
										);
									})}
									{(notas?.notas.length ?? 0) === 0 ? (
										<TableRow>
											<TableCell colSpan={5}>
												<Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: "center" }}>
													{notas === null
														? "Carregando…"
														: "Nenhuma nota guardada para este filtro. Clique em “Buscar notas na SIEG”."}
												</Typography>
											</TableCell>
										</TableRow>
									) : null}
								</TableBody>
							</Table>
						</TableContainer>
						{notas && notas.notas.length > 0 ? (
							<Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
								<Typography variant="body2" sx={{ pl: 2 }}>
									{notas.notas.length} nota(s) · total {formatarMoeda(notas.total)}
								</Typography>
								<TablePagination
									component="div"
									count={notas.notas.length}
									page={pagNotas.pagina}
									rowsPerPage={pagNotas.linhasPorPagina}
									rowsPerPageOptions={[25, 50, 100]}
									onPageChange={pagNotas.aoMudarPagina}
									onRowsPerPageChange={pagNotas.aoMudarLinhasPorPagina}
									labelRowsPerPage="Linhas"
								/>
							</Stack>
						) : null}
					</Stack>
				</Paper>
			) : (
				<Paper variant="outlined">
					<Stack
						direction={{ xs: "column", sm: "row" }}
						spacing={2}
						sx={{ p: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}
					>
						<TextField
							size="small"
							label="Buscar empresa"
							value={busca}
							onChange={(e) => setBusca(e.target.value)}
							sx={{ minWidth: 260 }}
						/>
						<Typography variant="body2" color="text.secondary">
							Notas de {rotuloMes(mes)} por empresa, contadas na SIEG.
							{naoContadas > 0 ? ` ${naoContadas} empresa(s) ainda sem contagem neste mês.` : ""}
						</Typography>
					</Stack>
					<TableContainer>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Empresa</TableCell>
									<TableCell align="right">Emitidas</TableCell>
									<TableCell align="right">Recebidas</TableCell>
									<TableCell>Contado em</TableCell>
									<TableCell />
								</TableRow>
							</TableHead>
							<TableBody>
								{pag.itensPaginados.map((e) => (
									<TableRow key={e.documento} hover>
										<TableCell>
											<Typography variant="body2">{e.nome}</Typography>
											<Typography variant="caption" color="text.secondary">
												{formatarDocumento(e.documento)}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<ResumoTipos c={e.emitidas} />
										</TableCell>
										<TableCell align="right">
											<ResumoTipos c={e.recebidas} />
										</TableCell>
										<TableCell sx={{ whiteSpace: "nowrap" }}>
											{e.atualizadoEm ? dayjs(e.atualizadoEm).format("DD/MM HH:mm") : "—"}
										</TableCell>
										<TableCell align="right">
											<Button size="small" onClick={() => setEmpresa(e)}>
												Ver notas
											</Button>
										</TableCell>
									</TableRow>
								))}
								{linhas.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5}>
											<Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: "center" }}>
												{contagens === null
													? "Carregando…"
													: "Nenhuma empresa ativa na SIEG. Atualize a lista na aba Empresas."}
											</Typography>
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</TableContainer>
					<TablePagination
						component="div"
						count={linhas.length}
						page={pag.pagina}
						rowsPerPage={pag.linhasPorPagina}
						rowsPerPageOptions={[25, 50, 100]}
						onPageChange={pag.aoMudarPagina}
						onRowsPerPageChange={pag.aoMudarLinhasPorPagina}
						labelRowsPerPage="Linhas por página"
					/>
				</Paper>
			)}

			<Dialog open={eventos !== null} onClose={() => setEventos(null)} fullWidth maxWidth="sm">
				<DialogTitle>Eventos da nota {eventos?.nota.numero ?? ""}</DialogTitle>
				<DialogContent dividers>
					{eventos?.lista === null ? (
						<CircularProgress size={20} />
					) : eventos?.erro ? (
						<Alert severity="error">{eventos.erro}</Alert>
					) : eventos?.lista?.length ? (
						<Stack spacing={1}>
							{eventos.lista.map((ev, i) => (
								<Stack key={`${ev.protocolo ?? i}`} direction="row" spacing={1} sx={{ alignItems: "center" }}>
									<Chip size="small" color={/cancel/i.test(ev.descricao) ? "error" : "default"} label={ev.descricao} />
									<Typography variant="body2" color="text.secondary">
										{ev.data ? dayjs(ev.data).format("DD/MM/YYYY HH:mm") : ""}
										{ev.protocolo ? ` · protocolo ${ev.protocolo}` : ""}
									</Typography>
								</Stack>
							))}
						</Stack>
					) : (
						<Typography variant="body2">Nenhum evento (cancelamento, carta de correção…) para esta nota.</Typography>
					)}
				</DialogContent>
			</Dialog>
		</Stack>
	);
}
