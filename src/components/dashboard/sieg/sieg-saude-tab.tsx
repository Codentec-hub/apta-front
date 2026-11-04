"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

import { api } from "@/lib/api";

interface Saude {
	credenciaisConfiguradas: boolean;
	token: {
		autorizado: boolean;
		expiraEm: string | null;
		diasParaVencer: number | null;
		renovadoEm: string | null;
		erroRenovacao: string | null;
	};
	sincronizacao: {
		ultimaEm: string | null;
		erro: string | null;
		agendamento: { rodando: boolean; ultimaVerificacao: string | null; ultimaAcao: string | null; horario: string };
		contagens: { situacao: string; mes: string | null; feitas: number; total: number };
		ultimaContagemEm: string | null;
	};
	dados: { empresasAtivas: number; notasCapturadas: number };
	chamadas24h: { rota: string; total: number; erros: number; mediaMs: number }[];
	ultimosErros: { rota: string; status: number | null; erro: string; criadoEm: string }[];
}

const NOME_ROTA: Record<string, string> = {
	"/api/v1/listar": "Listar empresas",
	"/api/v1/status": "Status do certificado",
	"/api/v1/contar-xmls": "Contar notas",
	"/api/v1/baixar-xmls": "Baixar notas (lote)",
	"/api/v1/baixar-xml": "Baixar uma nota",
	"/api/v1/baixar-eventos": "Eventos",
	"/api/v1/relatorios-pre-configurados": "Relatórios",
	"/api/v1/gerarDanfeViaXml": "DANFE",
};

const dataHora = (v: string | null) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—");

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }): React.JSX.Element {
	return (
		<Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
			<Typography variant="body2" color="text.secondary">
				{rotulo}
			</Typography>
			<Typography variant="body2" sx={{ textAlign: "right" }}>
				{valor}
			</Typography>
		</Stack>
	);
}

export function SiegSaudeTab({ podeAcionar, ehAdmin }: { podeAcionar: boolean; ehAdmin: boolean }): React.JSX.Element {
	const [saude, setSaude] = React.useState<Saude | null>(null);
	const [erro, setErro] = React.useState<string | null>(null);
	const [aviso, setAviso] = React.useState<string | null>(null);
	const [acao, setAcao] = React.useState<string | null>(null);

	const carregar = React.useCallback(async () => {
		try {
			setSaude(await api<Saude>("/sieg/dados/saude"));
			setErro(null);
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao consultar a saúde da integração");
		}
	}, []);

	React.useEffect(() => {
		void carregar();
		const t = setInterval(() => void carregar(), 15_000);
		return () => clearInterval(t);
	}, [carregar]);

	async function executar(nome: string, path: string, sucesso: string) {
		setAcao(nome);
		setAviso(null);
		setErro(null);
		try {
			await api(path, { method: "POST" });
			setAviso(sucesso);
			await carregar();
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao falar com a SIEG");
		} finally {
			setAcao(null);
		}
	}

	if (!saude) return erro ? <Alert severity="error">{erro}</Alert> : <CircularProgress size={24} />;

	const t = saude.token;
	const corToken = t.autorizado ? (t.diasParaVencer ?? 0) <= 7 ? "warning" : "success" : "error";

	return (
		<Stack spacing={2}>
			{erro ? <Alert severity="error">{erro}</Alert> : null}
			{aviso ? (
				<Alert severity="success" onClose={() => setAviso(null)}>
					{aviso}
				</Alert>
			) : null}
			<Alert severity="info">
				A integração é somente leitura: o sistema só consulta a SIEG (empresas, notas, relatórios) e nunca envia, altera
				ou apaga nada lá.
			</Alert>

			<Grid container spacing={2}>
				<Grid size={{ xs: 12, md: 4 }}>
					<Card variant="outlined" sx={{ height: "100%" }}>
						<CardContent>
							<Stack spacing={1}>
								<Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
									<Typography variant="h6">Autorização</Typography>
									<Chip
										size="small"
										color={corToken}
										label={t.autorizado ? `Vence em ${t.diasParaVencer} dia(s)` : "Vencida/ausente"}
									/>
								</Stack>
								<Linha
									rotulo="Credenciais do sistema"
									valor={saude.credenciaisConfiguradas ? "Configuradas" : "Faltando"}
								/>
								<Linha rotulo="Token vence em" valor={dataHora(t.expiraEm)} />
								<Linha rotulo="Última renovação" valor={dataHora(t.renovadoEm)} />
								<Typography variant="caption" color="text.secondary">
									Renovado sozinho quando faltam 7 dias para vencer.
								</Typography>
								{t.erroRenovacao ? <Alert severity="error">{t.erroRenovacao}</Alert> : null}
								{podeAcionar ? (
									<Button
										size="small"
										variant="outlined"
										disabled={acao !== null || !t.autorizado}
										onClick={() => void executar("token", "/sieg/dados/token/renovar", "Token renovado.")}
									>
										{acao === "token" ? "Renovando…" : "Renovar agora"}
									</Button>
								) : null}
							</Stack>
						</CardContent>
					</Card>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<Card variant="outlined" sx={{ height: "100%" }}>
						<CardContent>
							<Stack spacing={1}>
								<Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
									<Typography variant="h6">Busca automática</Typography>
									{saude.sincronizacao.agendamento.rodando ? <Chip size="small" color="info" label="Rodando" /> : null}
								</Stack>
								<Linha rotulo="Quando" valor={saude.sincronizacao.agendamento.horario} />
								<Linha rotulo="Última busca completa" valor={dataHora(saude.sincronizacao.ultimaEm)} />
								<Linha rotulo="Última contagem de notas" valor={dataHora(saude.sincronizacao.ultimaContagemEm)} />
								<Typography variant="caption" color="text.secondary">
									Atualiza empresas, status dos certificados e conta as notas do mês atual e do anterior.
								</Typography>
								{saude.sincronizacao.erro ? <Alert severity="warning">{saude.sincronizacao.erro}</Alert> : null}
								{ehAdmin ? (
									<Button
										size="small"
										variant="outlined"
										disabled={acao !== null || saude.sincronizacao.agendamento.rodando || !t.autorizado}
										onClick={() =>
											void executar(
												"sync",
												"/sieg/dados/sincronizar",
												"Busca completa iniciada. Pode levar perto de uma hora por causa do limite de consultas da SIEG."
											)
										}
									>
										Rodar busca completa agora
									</Button>
								) : null}
							</Stack>
						</CardContent>
					</Card>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<Card variant="outlined" sx={{ height: "100%" }}>
						<CardContent>
							<Stack spacing={1}>
								<Typography variant="h6">Dados guardados</Typography>
								<Linha rotulo="Empresas ativas na SIEG" valor={saude.dados.empresasAtivas} />
								<Linha rotulo="Notas capturadas" valor={saude.dados.notasCapturadas.toLocaleString("pt-BR")} />
								<Linha
									rotulo="Chamadas nas últimas 24h"
									valor={saude.chamadas24h.reduce((s, c) => s + c.total, 0).toLocaleString("pt-BR")}
								/>
							</Stack>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			<Paper variant="outlined">
				<Typography variant="subtitle1" sx={{ p: 2, pb: 0 }}>
					Consultas à SIEG nas últimas 24 horas
				</Typography>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell>Consulta</TableCell>
							<TableCell align="right">Chamadas</TableCell>
							<TableCell align="right">Com erro</TableCell>
							<TableCell align="right">Tempo médio</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{saude.chamadas24h.map((c) => (
							<TableRow key={c.rota}>
								<TableCell>{NOME_ROTA[c.rota] ?? c.rota}</TableCell>
								<TableCell align="right">{c.total}</TableCell>
								<TableCell align="right" sx={{ color: c.erros ? "error.main" : undefined }}>
									{c.erros}
								</TableCell>
								<TableCell align="right">{(c.mediaMs / 1000).toFixed(1)} s</TableCell>
							</TableRow>
						))}
						{saude.chamadas24h.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4}>
									<Typography variant="body2" color="text.secondary">
										Nenhuma consulta nas últimas 24 horas.
									</Typography>
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</Paper>

			{saude.ultimosErros.length > 0 ? (
				<Paper variant="outlined">
					<Typography variant="subtitle1" sx={{ p: 2, pb: 0 }}>
						Últimos erros
					</Typography>
					<Table size="small">
						<TableBody>
							{saude.ultimosErros.map((e, i) => (
								<TableRow key={`${e.criadoEm}-${i}`}>
									<TableCell sx={{ whiteSpace: "nowrap" }}>{dataHora(e.criadoEm)}</TableCell>
									<TableCell>{NOME_ROTA[e.rota] ?? e.rota}</TableCell>
									<TableCell>{e.status ?? "—"}</TableCell>
									<TableCell>{e.erro}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Paper>
			) : null}
		</Stack>
	);
}
