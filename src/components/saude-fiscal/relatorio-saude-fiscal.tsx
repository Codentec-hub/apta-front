"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import dayjs from "dayjs";

import { formatarDocumento } from "@/lib/empresa";
import { mesPorExtenso, moedaCurta, type DadosSaudeFiscal, type NotaResumo, type Pendencia } from "@/lib/saude-fiscal";
import { formatarMoeda, rotuloMes } from "@/lib/sieg";

// Cores das duas séries (validadas para daltonismo e contraste nos dois temas).
const coresSerie = {
	"--cor-saidas": "#2a78d6",
	"--cor-entradas": "#eb6834",
} as const;
const coresSerieEscuro = {
	"--cor-saidas": "#3987e5",
	"--cor-entradas": "#d95926",
} as const;

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }): React.JSX.Element {
	return (
		<Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
			<Typography variant="body2" color="text.secondary">
				{rotulo}
			</Typography>
			<Typography variant="h5" sx={{ mt: 0.5 }}>
				{valor}
			</Typography>
			{detalhe ? (
				<Typography variant="caption" color="text.secondary">
					{detalhe}
				</Typography>
			) : null}
		</Paper>
	);
}

function Legenda({ cor, rotulo }: { cor: string; rotulo: string }): React.JSX.Element {
	return (
		<Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
			<Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: `var(${cor})` }} />
			<Typography variant="caption" color="text.secondary">
				{rotulo}
			</Typography>
		</Stack>
	);
}

/** Entradas x saídas nos últimos 12 meses: barras agrupadas, uma escala só. */
function GraficoMeses({ serie, mesAtual }: { serie: DadosSaudeFiscal["serie"]; mesAtual: string }): React.JSX.Element {
	const [tabela, setTabela] = React.useState(false);
	const maximo = Math.max(1, ...serie.flatMap((s) => [s.entradas, s.saidas]));
	const ALTURA = 180;
	const passos = [1, 0.5, 0];

	return (
		<Paper
			variant="outlined"
			sx={(theme) => ({ p: 2, ...coresSerie, ...theme.applyStyles("dark", coresSerieEscuro) })}
		>
			<Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
				<Typography variant="subtitle1">Entradas e saídas nos últimos 12 meses</Typography>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<Legenda cor="--cor-saidas" rotulo="Saídas (vendas e serviços)" />
					<Legenda cor="--cor-entradas" rotulo="Entradas (compras)" />
					<Button size="small" onClick={() => setTabela((v) => !v)} sx={{ displayPrint: "none" }}>
						{tabela ? "Ver gráfico" : "Ver tabela"}
					</Button>
				</Stack>
			</Stack>
			{tabela ? (
				<Table size="small" sx={{ mt: 1 }}>
					<TableHead>
						<TableRow>
							<TableCell>Mês</TableCell>
							<TableCell align="right">Saídas</TableCell>
							<TableCell align="right">Entradas</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{serie.map((s) => (
							<TableRow key={s.mes}>
								<TableCell>{rotuloMes(s.mes)}</TableCell>
								<TableCell align="right">{formatarMoeda(s.saidas)}</TableCell>
								<TableCell align="right">{formatarMoeda(s.entradas)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<Box sx={{ display: "flex", mt: 1, pt: 1.5, overflowX: "auto" }}>
					<Box sx={{ position: "relative", width: 52, height: ALTURA, flexShrink: 0 }}>
						{passos.map((p) => (
							<Typography
								key={p}
								variant="caption"
								color="text.secondary"
								sx={{ position: "absolute", right: 6, top: (1 - p) * ALTURA - 8, lineHeight: "16px" }}
							>
								{moedaCurta(maximo * p)}
							</Typography>
						))}
					</Box>
					<Box sx={{ flex: 1, minWidth: 420 }}>
						<Box sx={{ position: "relative", height: ALTURA, display: "flex", alignItems: "flex-end" }}>
							{passos.map((p) => (
								<Box
									key={p}
									sx={{
										position: "absolute",
										left: 0,
										right: 0,
										top: (1 - p) * ALTURA,
										borderTop: "1px solid",
										borderColor: "divider",
										opacity: p === 0 ? 1 : 0.6,
									}}
								/>
							))}
							{serie.map((s) => (
								<Tooltip
									key={s.mes}
									arrow
									title={
										<Box>
											<strong>{rotuloMes(s.mes)}</strong>
											<br />
											Saídas: {formatarMoeda(s.saidas)}
											<br />
											Entradas: {formatarMoeda(s.entradas)}
										</Box>
									}
								>
									<Box
										sx={{
											flex: 1,
											height: "100%",
											display: "flex",
											alignItems: "flex-end",
											justifyContent: "center",
											gap: "2px",
											position: "relative",
											zIndex: 1,
											borderRadius: 1,
											bgcolor: s.mes === mesAtual ? "action.hover" : "transparent",
											"&:hover": { bgcolor: "action.selected" },
										}}
									>
										{(["saidas", "entradas"] as const).map((k) => (
											<Box
												key={k}
												sx={{
													width: "28%",
													maxWidth: 16,
													height: `${(s[k] / maximo) * 100}%`,
													minHeight: s[k] > 0 ? 2 : 0,
													bgcolor: `var(--cor-${k})`,
													borderRadius: "4px 4px 0 0",
												}}
											/>
										))}
									</Box>
								</Tooltip>
							))}
						</Box>
						<Box sx={{ display: "flex" }}>
							{serie.map((s) => (
								<Typography
									key={s.mes}
									variant="caption"
									color={s.mes === mesAtual ? "text.primary" : "text.secondary"}
									sx={{ flex: 1, textAlign: "center", fontWeight: s.mes === mesAtual ? 600 : 400, mt: 0.5 }}
								>
									{rotuloMes(s.mes).replace("/20", "/")}
								</Typography>
							))}
						</Box>
					</Box>
				</Box>
			)}
		</Paper>
	);
}

function TabelaNotas({
	titulo,
	notas,
	contraparte,
	vazio,
}: {
	titulo: string;
	notas: NotaResumo[];
	contraparte: string;
	vazio: string;
}): React.JSX.Element {
	const total = notas.reduce((s, n) => s + n.valor, 0);
	return (
		<Paper variant="outlined">
			<Stack direction="row" sx={{ p: 2, pb: 1, justifyContent: "space-between", alignItems: "baseline" }}>
				<Typography variant="subtitle1">{titulo}</Typography>
				<Typography variant="body2" color="text.secondary">
					{notas.length} nota(s) · {formatarMoeda(total)}
				</Typography>
			</Stack>
			{notas.length === 0 ? (
				<Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
					{vazio}
				</Typography>
			) : (
				<TableContainer sx={{ maxHeight: 420 }}>
					<Table size="small" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>Data</TableCell>
								<TableCell>Número</TableCell>
								<TableCell>{contraparte}</TableCell>
								<TableCell align="right">Valor</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{notas.map((n) => (
								<TableRow key={n.chave}>
									<TableCell sx={{ whiteSpace: "nowrap" }}>
										{n.emissao ? dayjs(n.emissao).format("DD/MM") : "—"}
									</TableCell>
									<TableCell>{n.numero ?? "—"}</TableCell>
									<TableCell>
										<Typography variant="body2">{n.contraparteNome ?? "—"}</Typography>
										{n.contraparteDocumento ? (
											<Typography variant="caption" color="text.secondary">
												{formatarDocumento(n.contraparteDocumento)}
											</Typography>
										) : null}
									</TableCell>
									<TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
										{formatarMoeda(n.valor)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Paper>
	);
}

const ROTULO_GUIA = { entregue: "Entregue", pendente: "Em andamento", atrasada: "Atrasada", dispensada: "Dispensada" } as const;
const COR_GUIA = { entregue: "success", pendente: "default", atrasada: "error", dispensada: "default" } as const;

export function IconeGravidade({ g }: { g: Pendencia["gravidade"] }): React.JSX.Element {
	if (g === "alta") return <WarningCircleIcon size={20} color="var(--mui-palette-error-main)" />;
	if (g === "media") return <WarningIcon size={20} color="var(--mui-palette-warning-main)" />;
	return <WarningIcon size={20} color="var(--mui-palette-text-secondary)" />;
}

export interface RelatorioSaudeFiscalProps {
	dados: DadosSaudeFiscal;
	/** Visão da equipe: mostra cobertura da captura e pendências internas. */
	equipe?: boolean;
	/** Ações ao lado de cada pendência (ex.: resolver), só na visão da equipe. */
	acaoPendencia?: (p: Pendencia) => React.ReactNode;
}

export function RelatorioSaudeFiscal({ dados, equipe = false, acaoPendencia }: RelatorioSaudeFiscalProps): React.JSX.Element {
	const r = dados.resumo;
	const incompleto = dados.cobertura.contadas > dados.cobertura.capturadas;
	const pendencias = equipe ? dados.pendencias : dados.pendencias.filter((p) => !p.interna);
	const compras = dados.compras.notas;

	return (
		<Stack spacing={2}>
			{equipe && !dados.naSieg ? (
				<Alert severity="info">Esta empresa não está na SIEG, então não há notas para o relatório.</Alert>
			) : null}
			{equipe && incompleto ? (
				<Alert severity="warning">
					A SIEG contou {dados.cobertura.contadas} nota(s) em {rotuloMes(dados.mes)} e temos {dados.cobertura.capturadas}{" "}
					guardada(s). A captura noturna completa o restante; até lá os valores podem estar menores.
				</Alert>
			) : null}

			<Grid container spacing={2}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Indicador rotulo="Saídas (vendas e serviços)" valor={formatarMoeda(r.saidas)} detalhe={`${r.notasEmitidas} nota(s) emitida(s)`} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Indicador rotulo="Entradas (compras)" valor={formatarMoeda(r.entradas)} detalhe={`${r.notasRecebidas} nota(s) recebida(s)`} />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Indicador
						rotulo="Serviços prestados"
						valor={formatarMoeda(r.servicosPrestados)}
						detalhe={`${dados.servicos.prestados.length} NFS-e · tomados ${formatarMoeda(r.servicosTomados)}`}
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<Indicador
						rotulo="Certificado digital"
						valor={
							dados.certificado.expiraEm ? dayjs(dados.certificado.expiraEm).format("DD/MM/YYYY") : "—"
						}
						detalhe={
							dados.certificado.dias === null
								? "sem informação"
								: dados.certificado.dias < 0
									? "vencido"
									: `vence em ${dados.certificado.dias} dia(s)`
						}
					/>
				</Grid>
			</Grid>
			{r.canceladas ? (
				<Typography variant="caption" color="text.secondary">
					{r.canceladas} nota(s) cancelada(s) no mês não entram nos totais.
				</Typography>
			) : null}

			<GraficoMeses serie={dados.serie} mesAtual={dados.mes} />

			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle1" sx={{ mb: 1 }}>
					Pendências
				</Typography>
				{pendencias.length === 0 ? (
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<CheckCircleIcon size={20} color="var(--mui-palette-success-main)" />
						<Typography variant="body2">Nenhuma pendência. Tudo em dia!</Typography>
					</Stack>
				) : (
					<Stack spacing={1.25}>
						{pendencias.map((p) => (
							<Stack key={p.id} direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
								<Box sx={{ pt: 0.25 }}>
									<IconeGravidade g={p.gravidade} />
								</Box>
								<Box sx={{ flex: 1 }}>
									<Typography variant="body2" sx={{ fontWeight: 600 }}>
										{p.titulo}
										{p.interna ? (
											<Chip size="small" label="só a equipe vê" variant="outlined" sx={{ ml: 1, height: 20 }} />
										) : null}
									</Typography>
									{p.detalhe ? (
										<Typography variant="body2" color="text.secondary">
											{p.detalhe}
										</Typography>
									) : null}
								</Box>
								{acaoPendencia ? acaoPendencia(p) : null}
							</Stack>
						))}
					</Stack>
				)}
			</Paper>

			<Paper variant="outlined">
				<Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
					Guias e entregas de {mesPorExtenso(dados.mes)}
				</Typography>
				{dados.guias.length === 0 ? (
					<Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>
						Nenhuma guia ou entrega registrada neste mês.
					</Typography>
				) : (
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Obrigação</TableCell>
								<TableCell>Vencimento</TableCell>
								<TableCell align="right">Valor</TableCell>
								<TableCell>Situação</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{dados.guias.map((g, i) => (
								<TableRow key={`${g.nome}-${i}`}>
									<TableCell>{g.nome}</TableCell>
									<TableCell>{dayjs(g.prazo).format("DD/MM/YYYY")}</TableCell>
									<TableCell align="right">{g.valor ? formatarMoeda(g.valor) : "—"}</TableCell>
									<TableCell>
										<Chip size="small" variant="outlined" color={COR_GUIA[g.situacao]} label={ROTULO_GUIA[g.situacao]} />
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Paper>

			{dados.compras.fornecedores.length > 0 ? (
				<Paper variant="outlined">
					<Typography variant="subtitle1" sx={{ p: 2, pb: 1 }}>
						Principais fornecedores do mês
					</Typography>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Fornecedor</TableCell>
								<TableCell align="right">Notas</TableCell>
								<TableCell align="right">Valor</TableCell>
								<TableCell align="right">% das compras</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{dados.compras.fornecedores.map((f) => (
								<TableRow key={f.documento ?? f.nome}>
									<TableCell>
										<Typography variant="body2">{f.nome}</Typography>
										{f.documento ? (
											<Typography variant="caption" color="text.secondary">
												{formatarDocumento(f.documento)}
											</Typography>
										) : null}
									</TableCell>
									<TableCell align="right">{f.notas}</TableCell>
									<TableCell align="right">{formatarMoeda(f.valor)}</TableCell>
									<TableCell align="right">{r.entradas ? `${Math.round((f.valor / r.entradas) * 100)}%` : "—"}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Paper>
			) : null}

			<TabelaNotas titulo="Compras do mês" notas={compras} contraparte="Fornecedor" vazio="Nenhuma compra registrada no mês." />
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, md: 6 }}>
					<TabelaNotas
						titulo="Serviços prestados (NFS-e emitidas)"
						notas={dados.servicos.prestados}
						contraparte="Tomador"
						vazio="Nenhuma NFS-e emitida no mês."
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<TabelaNotas
						titulo="Serviços tomados (NFS-e recebidas)"
						notas={dados.servicos.tomados}
						contraparte="Prestador"
						vazio="Nenhuma NFS-e recebida no mês."
					/>
				</Grid>
			</Grid>
		</Stack>
	);
}
