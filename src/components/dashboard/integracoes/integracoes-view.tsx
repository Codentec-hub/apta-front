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
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PlugsConnectedIcon } from "@phosphor-icons/react/dist/ssr/PlugsConnected";
import dayjs from "dayjs";

import { paths } from "@/paths";
import { api } from "@/lib/api";

interface StatusSieg {
	clientIdConfigurado: boolean;
	secretKeyMascarada: string | null;
	origem: "banco" | "ambiente" | "nenhuma";
	oauthAutorizado: boolean;
	oauthExpiraEm: string | null;
}

// Só o SIEG está de fato integrado (Fase A+B concluídas). As demais são
// roteiro -- nenhuma delas está conectada ainda, então não entram como card
// com dados, só como "em breve" (ver histórico: a antiga grade mockada
// chegava a marcar Suri como "Conectado" sem nunca ter sido configurada).
const OUTRAS_INTEGRACOES = [
	{ nome: "DominioWeb", descricao: "Sistema de contabilidade — escrituração e integração fiscal/contábil." },
	{ nome: "Conta Azul", descricao: "Financeiro do escritório e dos clientes de BPO — contas, DRE e fluxo de caixa." },
	{ nome: "WhatsApp", descricao: "Conversas do atendimento e envio de guias." },
	{
		nome: "eSocial / DCTFWeb / FGTS Digital",
		descricao: "Transmissões obrigatórias ao governo para a folha de pagamento.",
	},
	{ nome: "Open Finance", descricao: "Conexão bancária direta para conciliação contábil automática." },
];

function CampoStatus({ label, valor }: { label: string; valor: string }): React.JSX.Element {
	return (
		<Stack direction="row" sx={{ justifyContent: "space-between" }}>
			<Typography color="text.secondary" variant="body2">
				{label}
			</Typography>
			<Typography variant="body2">{valor}</Typography>
		</Stack>
	);
}

export function IntegracoesView(): React.JSX.Element {
	const [status, setStatus] = React.useState<StatusSieg | null>(null);
	const [carregando, setCarregando] = React.useState(true);
	const [erro, setErro] = React.useState<string | null>(null);

	React.useEffect(() => {
		api<StatusSieg>("/configuracoes/sieg")
			.then(setStatus)
			.catch((error: unknown) => setErro(error instanceof Error ? error.message : "Erro ao consultar o SIEG"))
			.finally(() => setCarregando(false));
	}, []);

	return (
		<Stack spacing={3}>
			<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
				<Box
					sx={{
						width: 40,
						height: 40,
						borderRadius: 1.5,
						display: "grid",
						placeItems: "center",
						bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.1)",
						color: "primary.main",
					}}
				>
					<PlugsConnectedIcon size={22} />
				</Box>
				<Typography variant="h4">Integrações</Typography>
			</Stack>

			<Card variant="outlined">
				<CardContent>
					<Stack spacing={2}>
						<Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
							<Typography variant="h6">SIEG</Typography>
							{carregando ? (
								<CircularProgress size={18} />
							) : (
								<Chip
									color={status?.oauthAutorizado ? "success" : "warning"}
									label={status?.oauthAutorizado ? "Conectado" : "Pendente de autorização"}
									size="small"
								/>
							)}
						</Stack>
						<Typography color="text.secondary" variant="body2">
							Captura de XML de notas fiscais e emissão de parcelamentos — autorização OAuth da conta Apta, concluída em
							produção.
						</Typography>

						{erro ? <Alert severity="error">{erro}</Alert> : null}

						{status ? (
							<Stack spacing={1} divider={<Divider />}>
								<CampoStatus
									label="Credenciais de sistema"
									valor={status.clientIdConfigurado ? "Configuradas" : "Não configuradas"}
								/>
								<CampoStatus label="Autorização OAuth" valor={status.oauthAutorizado ? "Ativa" : "Necessária"} />
								{status.oauthExpiraEm ? (
									<CampoStatus label="Expira em" valor={dayjs(status.oauthExpiraEm).format("DD/MM/YYYY")} />
								) : null}
							</Stack>
						) : null}

						{status?.clientIdConfigurado ? (
							<Box>
								<Button component={RouterLink} href={paths.dashboard.sieg} variant="outlined" size="small">
									Abrir área da SIEG
								</Button>
							</Box>
						) : null}
					</Stack>
				</CardContent>
			</Card>

			<Stack spacing={1.5}>
				<Typography color="text.secondary" variant="overline">
					Próximas integrações
				</Typography>
				<Grid container spacing={2}>
					{OUTRAS_INTEGRACOES.map((integracao) => (
						<Grid key={integracao.nome} size={{ xs: 12, sm: 6, md: 4 }}>
							<Card variant="outlined" sx={{ height: "100%" }}>
								<CardContent>
									<Stack spacing={1}>
										<Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
											<Typography variant="subtitle1">{integracao.nome}</Typography>
											<Chip label="Em breve" size="small" variant="outlined" />
										</Stack>
										<Typography color="text.secondary" variant="body2">
											{integracao.descricao}
										</Typography>
									</Stack>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			</Stack>
		</Stack>
	);
}
