"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { api } from "@/lib/api";
import { mesPorExtenso, type CanaisDisponiveis } from "@/lib/saude-fiscal";
import { mesesRecentes, rotuloMes } from "@/lib/sieg";

type Canal = "email" | "whatsapp";

interface Lote {
	situacao: "parado" | "andamento" | "concluido";
	mes: string | null;
	total: number;
	feitos: number;
	enviados: number;
	semContato: number;
	falhas: string[];
	concluidoEm: string | null;
}

interface Configuracao {
	automatico: boolean;
	dia: number;
	canais: Canal[];
	ultimoLote: string | null;
	clientesNoLote: number;
	lote: Lote;
	canaisDisponiveis: CanaisDisponiveis;
}

/** Envio mensal automático do relatório de saúde fiscal + envio manual para todos. */
export function EnvioMensalSaudeFiscal({ podeEditar, ehAdmin }: { podeEditar: boolean; ehAdmin: boolean }): React.JSX.Element {
	const meses = React.useMemo(() => mesesRecentes(13), []);
	const [config, setConfig] = React.useState<Configuracao | null>(null);
	const [automatico, setAutomatico] = React.useState(false);
	const [dia, setDia] = React.useState(15);
	const [canais, setCanais] = React.useState<Canal[]>(["email", "whatsapp"]);
	const [mesLote, setMesLote] = React.useState(meses[1]!);
	const [erro, setErro] = React.useState<string | null>(null);
	const [aviso, setAviso] = React.useState<string | null>(null);
	const [salvando, setSalvando] = React.useState(false);

	const carregar = React.useCallback(async (aplicarCampos: boolean) => {
		try {
			const c = await api<Configuracao>("/saude-fiscal/configuracao");
			setConfig(c);
			if (aplicarCampos) {
				setAutomatico(c.automatico);
				setDia(c.dia);
				setCanais(c.canais);
			}
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao carregar");
		}
	}, []);

	React.useEffect(() => {
		void carregar(true);
	}, [carregar]);

	// Enquanto um lote roda, atualiza o andamento.
	React.useEffect(() => {
		if (config?.lote.situacao !== "andamento") return;
		const t = setInterval(() => void carregar(false), 5000);
		return () => clearInterval(t);
	}, [config?.lote.situacao, carregar]);

	const alternar = (c: Canal) => setCanais((v) => (v.includes(c) ? v.filter((x) => x !== c) : [...v, c]));

	async function salvar() {
		setSalvando(true);
		setErro(null);
		try {
			await api("/saude-fiscal/configuracao", { method: "PUT", body: JSON.stringify({ automatico, dia, canais }) });
			setAviso(
				automatico
					? `Envio automático ligado: todo dia ${dia}, o relatório do mês anterior vai para os clientes.`
					: "Envio automático desligado."
			);
			await carregar(true);
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao salvar");
		} finally {
			setSalvando(false);
		}
	}

	async function enviarTodos() {
		setErro(null);
		try {
			await api("/saude-fiscal/enviar-todos", { method: "POST", body: JSON.stringify({ mes: mesLote, canais }) });
			setAviso(`Envio de ${rotuloMes(mesLote)} iniciado para ${config?.clientesNoLote ?? 0} cliente(s).`);
			await carregar(false);
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Erro ao iniciar o envio");
		}
	}

	const lote = config?.lote;

	return (
		<Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
			<Stack spacing={2.5}>
				<Stack spacing={0.5}>
					<Typography variant="h6">Relatório mensal de saúde fiscal</Typography>
					<Typography color="text.secondary" variant="body2">
						Uma vez por mês o cliente recebe “Aqui está o seu relatório de saúde fiscal”, com um link para ver compras,
						vendas, serviços, guias e pendências do mês anterior. Vai para os {config?.clientesNoLote ?? "…"} cliente(s)
						ativos que estão na SIEG, para os contatos que recebem de todos os departamentos e o responsável legal.
					</Typography>
				</Stack>
				{erro ? (
					<Alert severity="error" onClose={() => setErro(null)}>
						{erro}
					</Alert>
				) : null}
				{aviso ? (
					<Alert severity="success" onClose={() => setAviso(null)}>
						{aviso}
					</Alert>
				) : null}
				{config?.canaisDisponiveis.whatsappSimulador && canais.includes("whatsapp") ? (
					<Alert severity="info">
						O WhatsApp está no modo simulador: as mensagens ficam registradas, mas não chegam aos clientes.
					</Alert>
				) : null}

				<FormControlLabel
					control={
						<Switch checked={automatico} disabled={!podeEditar} onChange={(e) => setAutomatico(e.target.checked)} />
					}
					label="Enviar automaticamente todo mês"
				/>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
					<TextField
						select
						size="small"
						label="Dia do envio"
						value={dia}
						disabled={!podeEditar}
						onChange={(e) => setDia(Number(e.target.value))}
						sx={{ width: 160 }}
						helperText="Entre 9h e 18h"
					>
						{Array.from({ length: 28 }, (_v, i) => i + 1).map((d) => (
							<MenuItem key={d} value={d}>
								Dia {d}
							</MenuItem>
						))}
					</TextField>
					<FormControlLabel
						control={
							<Checkbox checked={canais.includes("email")} disabled={!podeEditar} onChange={() => alternar("email")} />
						}
						label="E-mail"
					/>
					<FormControlLabel
						control={
							<Checkbox
								checked={canais.includes("whatsapp")}
								disabled={!podeEditar}
								onChange={() => alternar("whatsapp")}
							/>
						}
						label="WhatsApp"
					/>
				</Stack>
				<Typography variant="caption" color="text.secondary">
					Dica: escolha um dia depois da data de corte da SIEG, para o mês anterior já estar completo.
					{config?.ultimoLote ? ` Último envio automático: ${mesPorExtenso(config.ultimoLote)}.` : ""}
				</Typography>
				{podeEditar ? (
					<Stack direction="row" sx={{ justifyContent: "flex-end" }}>
						<Button variant="contained" disabled={salvando || !config || canais.length === 0} onClick={() => void salvar()}>
							Salvar
						</Button>
					</Stack>
				) : null}

				{ehAdmin ? (
					<Stack spacing={1.5} sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}>
						<Typography variant="subtitle2" sx={{ pt: 1.5 }}>
							Enviar agora para todos
						</Typography>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
							<TextField
								select
								size="small"
								label="Mês"
								value={mesLote}
								onChange={(e) => setMesLote(e.target.value)}
								sx={{ width: 160 }}
							>
								{meses.map((m) => (
									<MenuItem key={m} value={m}>
										{rotuloMes(m)}
									</MenuItem>
								))}
							</TextField>
							<Button
								variant="outlined"
								disabled={!config || lote?.situacao === "andamento" || canais.length === 0}
								onClick={() => void enviarTodos()}
							>
								Enviar para {config?.clientesNoLote ?? 0} cliente(s)
							</Button>
						</Stack>
						{lote && lote.situacao !== "parado" ? (
							<Stack spacing={0.5}>
								<Typography variant="body2">
									{lote.situacao === "andamento" ? "Enviando" : "Último envio"} de {lote.mes ? rotuloMes(lote.mes) : "—"}:{" "}
									{lote.feitos} de {lote.total} · {lote.enviados} enviado(s) · {lote.semContato} sem contato ·{" "}
									{lote.falhas.length} falha(s)
								</Typography>
								{lote.situacao === "andamento" ? (
									<LinearProgress variant="determinate" value={lote.total ? (lote.feitos / lote.total) * 100 : 0} />
								) : null}
								{lote.falhas.length > 0 ? (
									<Alert severity="warning">{lote.falhas.slice(0, 5).join(" | ")}</Alert>
								) : null}
							</Stack>
						) : null}
					</Stack>
				) : null}
			</Stack>
		</Paper>
	);
}
