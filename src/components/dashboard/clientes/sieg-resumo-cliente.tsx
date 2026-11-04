"use client";

import * as React from "react";
import RouterLink from "next/link";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

import { paths } from "@/paths";
import { api } from "@/lib/api";
import { rotuloMes } from "@/lib/sieg";

interface Resumo {
	naSieg: boolean;
	empresa: {
		id: string;
		ativo: boolean;
		certificadoExpiraEm: string | null;
		consultaNoturna: boolean;
		statusSieg: string | null;
	} | null;
	meses: { mes: string; emitidas: number | null; recebidas: number | null }[];
}

/** Bloco "SIEG" na ficha do cliente: certificado e notas dos últimos 3 meses. */
export function SiegResumoCliente({
	clienteId,
	documento,
}: {
	clienteId: string;
	documento: string;
}): React.JSX.Element | null {
	const [resumo, setResumo] = React.useState<Resumo | null>(null);

	React.useEffect(() => {
		api<Resumo>(`/sieg/dados/resumo-cliente/${clienteId}`)
			.then(setResumo)
			.catch(() => setResumo(null));
	}, [clienteId]);

	if (!resumo) return null;

	const expira = resumo.empresa?.certificadoExpiraEm ? dayjs(resumo.empresa.certificadoExpiraEm) : null;
	const dias = expira ? expira.diff(dayjs(), "day") : null;

	return (
		<Paper variant="outlined" sx={{ p: 2 }}>
			<Stack spacing={1.5}>
				<Stack
					direction="row"
					spacing={1}
					sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}
				>
					<Typography variant="subtitle1">SIEG</Typography>
					{resumo.naSieg ? (
						<Link
							component={RouterLink}
							href={`${paths.dashboard.sieg}?aba=notas&documento=${documento.replaceAll(/\D/g, "")}`}
							variant="body2"
						>
							Ver notas na SIEG
						</Link>
					) : null}
				</Stack>
				{resumo.empresa ? (
					<>
						<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
							<Chip
								size="small"
								color={resumo.empresa.ativo ? "success" : "default"}
								label={resumo.empresa.ativo ? "Ativa na SIEG" : "Inativa/excluída na SIEG"}
							/>
							{expira ? (
								<Chip
									size="small"
									color={dias !== null && dias < 0 ? "error" : dias !== null && dias <= 30 ? "warning" : "default"}
									variant={dias !== null && dias <= 30 ? "filled" : "outlined"}
									label={`Certificado ${dias !== null && dias < 0 ? "venceu" : "vence"} em ${expira.format("DD/MM/YYYY")}`}
								/>
							) : null}
							<Chip
								size="small"
								variant="outlined"
								label={`Consulta noturna ${resumo.empresa.consultaNoturna ? "ligada" : "desligada"}`}
							/>
						</Stack>
						<Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
							{resumo.meses.map((m) => (
								<Stack key={m.mes}>
									<Typography variant="caption" color="text.secondary">
										{rotuloMes(m.mes)}
									</Typography>
									<Typography variant="body2">
										{m.emitidas === null && m.recebidas === null
											? "não contado"
											: `${m.emitidas ?? 0} emitidas · ${m.recebidas ?? 0} recebidas`}
									</Typography>
								</Stack>
							))}
						</Stack>
					</>
				) : (
					<Typography variant="body2" color="text.secondary">
						Este CNPJ/CPF não está na conta SIEG da Apta — as notas dele não são capturadas.
					</Typography>
				)}
			</Stack>
		</Paper>
	);
}
