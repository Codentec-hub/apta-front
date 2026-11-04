"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { api } from "@/lib/api";
import { formatarDocumento } from "@/lib/empresa";

interface Previa {
	lidaEm: string | null;
	totalAtivasSieg: number;
	criar: { documento: string; nome: string; uf: string | null }[];
	manter: number;
	apagar: { id: string; nome: string; documento: string; obrigacoes: number; demandas: number; contatos: number }[];
}

interface Resultado {
	criados: number;
	apagados: number;
	mantidos: number;
}

interface Props {
	aberto: boolean;
	onFechar: () => void;
	onConcluido: () => void;
}

/**
 * Ação pontual do administrador: a base de clientes passa a ser as empresas
 * ativas na SIEG, com opção de apagar os clientes que não estão lá (os
 * fictícios). A SIEG só é lida, nunca alterada.
 */
export function SiegImportarClientesDialog({ aberto, onFechar, onConcluido }: Props): React.JSX.Element {
	const [previa, setPrevia] = React.useState<Previa | null>(null);
	const [carregando, setCarregando] = React.useState(false);
	const [aplicando, setAplicando] = React.useState(false);
	const [erro, setErro] = React.useState<string | null>(null);
	const [apagar, setApagar] = React.useState(false);
	const [resultado, setResultado] = React.useState<Resultado | null>(null);

	React.useEffect(() => {
		if (!aberto) return;
		setPrevia(null);
		setErro(null);
		setApagar(false);
		setResultado(null);
		setCarregando(true);
		api<Previa>("/configuracoes/sieg/clientes/previa")
			.then(setPrevia)
			.catch((error: unknown) => setErro(error instanceof Error ? error.message : "Não foi possível montar a prévia"))
			.finally(() => setCarregando(false));
	}, [aberto]);

	async function aplicar(): Promise<void> {
		if (!previa) return;
		setAplicando(true);
		setErro(null);
		try {
			const r = await api<Resultado>("/configuracoes/sieg/clientes/aplicar", {
				method: "POST",
				body: JSON.stringify({ apagarForaDaSieg: apagar, quantidadeApagarConfirmada: previa.apagar.length }),
			});
			setResultado(r);
			onConcluido();
		} catch (error) {
			setErro(error instanceof Error ? error.message : "Não foi possível importar os clientes");
		} finally {
			setAplicando(false);
		}
	}

	const nadaAFazer = previa !== null && previa.criar.length === 0 && (previa.apagar.length === 0 || !apagar);

	return (
		<Dialog open={aberto} onClose={aplicando ? undefined : onFechar} fullWidth maxWidth="md">
			<DialogTitle>Usar a lista da SIEG como clientes da Apta</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={2}>
					<Alert severity="info">
						A SIEG não é alterada: o sistema só lê a lista de lá. Clientes cadastrados depois pela tela de Clientes
						ficam só no banco da Apta.
					</Alert>

					{carregando ? (
						<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
							<CircularProgress size={18} />
							<Typography variant="body2">Montando a prévia…</Typography>
						</Stack>
					) : null}

					{erro ? <Alert severity="error">{erro}</Alert> : null}

					{resultado ? (
						<Alert severity="success">
							Pronto: {resultado.criados} cliente(s) criado(s) a partir da SIEG, {resultado.mantidos} já existiam e
							foram mantidos
							{resultado.apagados > 0 ? `, ${resultado.apagados} cliente(s) fora da SIEG apagado(s)` : ""}.
						</Alert>
					) : null}

					{previa && !resultado ? (
						<>
							<Typography variant="body2">
								{previa.totalAtivasSieg} empresas ativas na SIEG:{" "}
								<strong>{previa.criar.length} serão criadas como clientes</strong> e {previa.manter} já existem aqui
								(ficam como estão).
							</Typography>

							{previa.criar.length > 0 ? (
								<Box>
									<Typography variant="subtitle2">Serão criadas ({previa.criar.length})</Typography>
									<Typography color="text.secondary" variant="caption">
										Com razão social, CNPJ/CPF e UF da SIEG. Regime, atividade e inscrições você completa depois em
										Clientes.
									</Typography>
									<List
										dense
										sx={{ maxHeight: 180, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}
									>
										{previa.criar.map((e) => (
											<ListItem key={e.documento}>
												<ListItemText
													primary={e.nome}
													secondary={`${formatarDocumento(e.documento)}${e.uf ? ` · ${e.uf}` : ""}`}
												/>
											</ListItem>
										))}
									</List>
								</Box>
							) : null}

							{previa.apagar.length > 0 ? (
								<Box>
									<Typography variant="subtitle2">
										Clientes da Apta que não estão na SIEG ({previa.apagar.length})
									</Typography>
									<List
										dense
										sx={{ maxHeight: 180, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}
									>
										{previa.apagar.map((c) => (
											<ListItem key={c.id}>
												<ListItemText
													primary={c.nome}
													secondary={`${formatarDocumento(c.documento)} · ${c.obrigacoes} obrigação(ões), ${c.demandas} demanda(s), ${c.contatos} contato(s)`}
												/>
											</ListItem>
										))}
									</List>
									<FormControlLabel
										sx={{ mt: 1 }}
										control={<Checkbox checked={apagar} onChange={(e) => setApagar(e.target.checked)} color="error" />}
										label={`Apagar estes ${previa.apagar.length} clientes (fictícios) junto com as obrigações, demandas e contatos deles`}
									/>
									{apagar ? (
										<Alert severity="warning" sx={{ mt: 1 }}>
											Não dá para desfazer. As conversas do Atendimento não são apagadas, só ficam sem cliente
											vinculado.
										</Alert>
									) : null}
								</Box>
							) : null}
						</>
					) : null}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={onFechar} disabled={aplicando}>
					{resultado ? "Fechar" : "Cancelar"}
				</Button>
				{resultado ? null : (
					<Button
						variant="contained"
						color={apagar ? "error" : "primary"}
						disabled={!previa || aplicando || nadaAFazer}
						onClick={() => void aplicar()}
						startIcon={aplicando ? <CircularProgress size={16} color="inherit" /> : undefined}
					>
						{apagar
							? `Criar ${previa?.criar.length ?? 0} e apagar ${previa?.apagar.length ?? 0}`
							: `Criar ${previa?.criar.length ?? 0} clientes`}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}
