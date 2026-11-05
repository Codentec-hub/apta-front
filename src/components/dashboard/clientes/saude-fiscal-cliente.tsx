"use client";

import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import dayjs from "dayjs";

import { api } from "@/lib/api";
import {
	resumoEnvios,
	type CanaisDisponiveis,
	type DadosSaudeFiscal,
	type Pendencia,
	type ResultadoEnvio,
} from "@/lib/saude-fiscal";
import { formatarMoeda, mesesRecentes, rotuloMes } from "@/lib/sieg";
import { RelatorioSaudeFiscal } from "@/components/saude-fiscal/relatorio-saude-fiscal";

type Canal = "email" | "whatsapp";

interface RelatorioEnviado {
	id: string;
	numero: number;
	mes: string;
	automatico: boolean;
	envios: ResultadoEnvio[];
	lidoEm: string | null;
	acessos: number;
	createdAt: string;
	link: string;
}

function DialogoEnvio({
	aberto,
	titulo,
	descricao,
	canaisDisponiveis,
	onFechar,
	onEnviar,
}: {
	aberto: boolean;
	titulo: string;
	descricao: string;
	canaisDisponiveis: CanaisDisponiveis | null;
	onFechar: () => void;
	onEnviar: (canais: Canal[]) => Promise<ResultadoEnvio[]>;
}): React.JSX.Element {
	const [canais, setCanais] = React.useState<Canal[]>(["email", "whatsapp"]);
	const [enviando, setEnviando] = React.useState(false);
	const [erro, setErro] = React.useState<string | null>(null);
	const [resultado, setResultado] = React.useState<ResultadoEnvio[] | null>(null);

	React.useEffect(() => {
		if (aberto) {
			setResultado(null);
			setErro(null);
		}
	}, [aberto]);

	const alternar = (c: Canal) => setCanais((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]));

	async function enviar() {
		setEnviando(true);
		setErro(null);
		try {
			setResultado(await onEnviar(canais));
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao enviar");
		} finally {
			setEnviando(false);
		}
	}

	return (
		<Dialog open={aberto} onClose={onFechar} fullWidth maxWidth="sm">
			<DialogTitle>{titulo}</DialogTitle>
			<DialogContent>
				<Stack spacing={2}>
					<Typography variant="body2" color="text.secondary">
						{descricao}
					</Typography>
					{resultado ? (
						<Stack spacing={1}>
							<Alert severity={resultado.some((r) => r.status === "enviado") ? "success" : "warning"}>
								{resumoEnvios(resultado)}
							</Alert>
							{resultado.map((r, i) => (
								<Typography key={i} variant="body2" color={r.status === "falha" ? "error" : "text.primary"}>
									{r.canal === "email" ? "E-mail" : "WhatsApp"} · {r.nome} ({r.destino}):{" "}
									{r.status === "enviado" ? "enviado" : r.erro}
								</Typography>
							))}
						</Stack>
					) : (
						<>
							<Stack direction="row" spacing={2}>
								<FormControlLabel
									control={<Checkbox checked={canais.includes("email")} onChange={() => alternar("email")} />}
									label="E-mail"
								/>
								<FormControlLabel
									control={<Checkbox checked={canais.includes("whatsapp")} onChange={() => alternar("whatsapp")} />}
									label="WhatsApp"
								/>
							</Stack>
							{canaisDisponiveis && !canaisDisponiveis.email && canais.includes("email") ? (
								<Alert severity="warning">O envio por e-mail ainda não está configurado no servidor.</Alert>
							) : null}
							{canaisDisponiveis?.whatsappSimulador && canais.includes("whatsapp") ? (
								<Alert severity="info">
									O WhatsApp está no modo simulador: a mensagem fica registrada, mas não chega ao cliente.
								</Alert>
							) : null}
							<Typography variant="caption" color="text.secondary">
								Vai para os contatos ativos que recebem de todos os departamentos e para o responsável legal.
							</Typography>
						</>
					)}
					{erro ? <Alert severity="error">{erro}</Alert> : null}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onFechar}>{resultado ? "Fechar" : "Cancelar"}</Button>
				{resultado ? null : (
					<Button
						variant="contained"
						disabled={enviando || canais.length === 0}
						startIcon={enviando ? <CircularProgress size={16} color="inherit" /> : <PaperPlaneTiltIcon />}
						onClick={() => void enviar()}
					>
						Enviar
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}

export function SaudeFiscalCliente({ clienteId }: { clienteId: string }): React.JSX.Element {
	const meses = React.useMemo(() => mesesRecentes(13), []);
	const [mes, setMes] = React.useState(meses[1] ?? meses[0]!);
	const [dados, setDados] = React.useState<DadosSaudeFiscal | null>(null);
	const [canais, setCanais] = React.useState<CanaisDisponiveis | null>(null);
	const [historico, setHistorico] = React.useState<RelatorioEnviado[]>([]);
	const [erro, setErro] = React.useState<string | null>(null);
	const [carregando, setCarregando] = React.useState(false);
	const [dialogo, setDialogo] = React.useState<"relatorio" | "pendencias" | "nova" | null>(null);
	const [novaDescricao, setNovaDescricao] = React.useState("");
	const [novoPrazo, setNovoPrazo] = React.useState("");
	const [salvando, setSalvando] = React.useState(false);

	const carregar = React.useCallback(async () => {
		setCarregando(true);
		try {
			const [r, h] = await Promise.all([
				api<{ dados: DadosSaudeFiscal; canais: CanaisDisponiveis }>(`/clientes/${clienteId}/saude-fiscal?mes=${mes}`),
				api<RelatorioEnviado[]>(`/clientes/${clienteId}/saude-fiscal/relatorios`),
			]);
			setDados(r.dados);
			setCanais(r.canais);
			setHistorico(h);
			setErro(null);
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao carregar a saúde fiscal");
		} finally {
			setCarregando(false);
		}
	}, [clienteId, mes]);

	React.useEffect(() => {
		void carregar();
	}, [carregar]);

	async function criarPendencia() {
		setSalvando(true);
		try {
			await api(`/clientes/${clienteId}/pendencias`, {
				method: "POST",
				body: JSON.stringify({ descricao: novaDescricao, prazo: novoPrazo || null }),
			});
			setDialogo(null);
			setNovaDescricao("");
			setNovoPrazo("");
			await carregar();
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao salvar a pendência");
		} finally {
			setSalvando(false);
		}
	}

	async function resolver(p: Pendencia) {
		try {
			await api(`/clientes/${clienteId}/pendencias/${p.pendenciaId}/resolver`, { method: "POST" });
			await carregar();
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao resolver a pendência");
		}
	}

	const pendenciasCliente = dados?.pendencias.filter((p) => !p.interna).length ?? 0;
	const pendenciasEquipe = dados ? dados.pendencias.length - pendenciasCliente : 0;

	return (
		<Accordion variant="outlined" disableGutters sx={{ borderRadius: 1, "&:before": { display: "none" } }}>
			<AccordionSummary expandIcon={<CaretDownIcon />}>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} sx={{ alignItems: { sm: "center" } }}>
					<Typography variant="subtitle1">Saúde fiscal</Typography>
					{dados ? (
						<Typography variant="body2" color="text.secondary">
							{rotuloMes(mes)} · saídas {formatarMoeda(dados.resumo.saidas)} · entradas {formatarMoeda(dados.resumo.entradas)} ·{" "}
							{pendenciasCliente} pendência(s) do cliente
							{pendenciasEquipe ? ` · ${pendenciasEquipe} da equipe` : ""}
						</Typography>
					) : null}
				</Stack>
			</AccordionSummary>
			<AccordionDetails>
				<Stack spacing={2}>
					<Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" } }}>
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
						{carregando ? <CircularProgress size={20} /> : null}
						<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, ml: { md: "auto" } }}>
							<Button size="small" startIcon={<PlusIcon />} onClick={() => setDialogo("nova")}>
								Nova pendência
							</Button>
							<Button
								size="small"
								variant="outlined"
								disabled={pendenciasCliente === 0}
								onClick={() => setDialogo("pendencias")}
							>
								Enviar pendências
							</Button>
							<Button
								size="small"
								variant="contained"
								startIcon={<PaperPlaneTiltIcon />}
								disabled={!dados}
								onClick={() => setDialogo("relatorio")}
							>
								Enviar relatório de {rotuloMes(mes)}
							</Button>
						</Stack>
					</Stack>
					{erro ? (
						<Alert severity="error" onClose={() => setErro(null)}>
							{erro}
						</Alert>
					) : null}

					{dados ? (
						<RelatorioSaudeFiscal
							dados={dados}
							equipe
							acaoPendencia={(p) =>
								p.pendenciaId ? (
									<Button size="small" onClick={() => void resolver(p)}>
										Resolver
									</Button>
								) : null
							}
						/>
					) : null}

					<Paper variant="outlined">
						<Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
							Relatórios enviados
						</Typography>
						{historico.length === 0 ? (
							<Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
								Nenhum relatório enviado a este cliente ainda.
							</Typography>
						) : (
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Mês</TableCell>
										<TableCell>Gerado em</TableCell>
										<TableCell>Envio</TableCell>
										<TableCell>Cliente abriu</TableCell>
										<TableCell />
									</TableRow>
								</TableHead>
								<TableBody>
									{historico.map((h) => (
										<TableRow key={h.id}>
											<TableCell>{rotuloMes(h.mes)}</TableCell>
											<TableCell sx={{ whiteSpace: "nowrap" }}>
												{dayjs(h.createdAt).format("DD/MM/YYYY HH:mm")}
												{h.automatico ? <Chip size="small" label="automático" variant="outlined" sx={{ ml: 1 }} /> : null}
											</TableCell>
											<TableCell>{resumoEnvios(h.envios)}</TableCell>
											<TableCell>
												{h.lidoEm ? `${dayjs(h.lidoEm).format("DD/MM HH:mm")} (${h.acessos}×)` : "ainda não"}
											</TableCell>
											<TableCell align="right">
												<Link href={h.link} target="_blank" rel="noopener" variant="body2">
													Ver
												</Link>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</Paper>
				</Stack>
			</AccordionDetails>

			<DialogoEnvio
				aberto={dialogo === "relatorio"}
				titulo={`Enviar relatório de saúde fiscal (${rotuloMes(mes)})`}
				descricao="O cliente recebe a mensagem “Aqui está o seu relatório de saúde fiscal” com um link para ver compras, vendas, serviços, guias e pendências do mês. Os números ficam congelados como estão agora."
				canaisDisponiveis={canais}
				onFechar={() => setDialogo(null)}
				onEnviar={async (c) => {
					const r = await api<{ resultados: ResultadoEnvio[] }>(`/clientes/${clienteId}/saude-fiscal/relatorios`, {
						method: "POST",
						body: JSON.stringify({ mes, enviar: true, canais: c }),
					});
					void carregar();
					return r.resultados;
				}}
			/>
			<DialogoEnvio
				aberto={dialogo === "pendencias"}
				titulo="Enviar pendências ao cliente"
				descricao={`Envia a lista com as ${pendenciasCliente} pendência(s) do cliente (as marcadas “só a equipe vê” não vão).`}
				canaisDisponiveis={canais}
				onFechar={() => setDialogo(null)}
				onEnviar={async (c) => {
					const r = await api<{ resultados: ResultadoEnvio[] }>(`/clientes/${clienteId}/pendencias/enviar`, {
						method: "POST",
						body: JSON.stringify({ canais: c }),
					});
					return r.resultados;
				}}
			/>
			<Dialog open={dialogo === "nova"} onClose={() => setDialogo(null)} fullWidth maxWidth="sm">
				<DialogTitle>Nova pendência do cliente</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ pt: 1 }}>
						<TextField
							label="O que está pendente"
							placeholder="Ex.: enviar o extrato bancário de outubro"
							value={novaDescricao}
							onChange={(e) => setNovaDescricao(e.target.value)}
							multiline
							minRows={2}
							autoFocus
						/>
						<TextField
							label="Prazo (opcional)"
							type="date"
							value={novoPrazo}
							onChange={(e) => setNovoPrazo(e.target.value)}
							slotProps={{ inputLabel: { shrink: true } }}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDialogo(null)}>Cancelar</Button>
					<Button
						variant="contained"
						disabled={salvando || novaDescricao.trim().length < 3}
						onClick={() => void criarPendencia()}
					>
						Salvar
					</Button>
				</DialogActions>
			</Dialog>
		</Accordion>
	);
}
