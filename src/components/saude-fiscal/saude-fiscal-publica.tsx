"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PrinterIcon } from "@phosphor-icons/react/dist/ssr/Printer";
import dayjs from "dayjs";

import { config } from "@/config";
import { formatarDocumento } from "@/lib/empresa";
import { mesPorExtenso, type DadosSaudeFiscal } from "@/lib/saude-fiscal";

import { RelatorioSaudeFiscal } from "./relatorio-saude-fiscal";

export function SaudeFiscalPublica({ token }: { token: string }): React.JSX.Element {
	const [dados, setDados] = React.useState<DadosSaudeFiscal | null>(null);
	const [erro, setErro] = React.useState<string | null>(null);

	React.useEffect(() => {
		fetch(`${config.apiUrl}/publico/saude-fiscal/${encodeURIComponent(token)}`)
			.then(async (res) => {
				if (!res.ok)
					throw new Error(res.status === 404 ? "Este link é inválido ou foi cancelado." : "Não foi possível carregar o relatório.");
				setDados(((await res.json()) as { dados: DadosSaudeFiscal }).dados);
			})
			.catch((error: unknown) => setErro(error instanceof Error ? error.message : "Erro ao carregar"));
	}, [token]);

	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "var(--mui-palette-background-default)", px: 2, py: { xs: 3, md: 6 } }}>
			<Stack spacing={3} sx={{ width: "100%", maxWidth: 1040, mx: "auto" }}>
				<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
						<Box component="img" src="/apta-logo.png" alt="" sx={{ height: 40, width: 40 }} />
						<Typography variant="h6">Apta Contabilidade</Typography>
					</Stack>
					{dados ? (
						<Button
							variant="outlined"
							startIcon={<PrinterIcon />}
							onClick={() => globalThis.print()}
							sx={{ displayPrint: "none" }}
						>
							Imprimir / salvar PDF
						</Button>
					) : null}
				</Stack>

				{erro ? <Alert severity="error">{erro}</Alert> : null}
				{!dados && !erro ? <CircularProgress size={28} /> : null}

				{dados ? (
					<>
						<Box>
							<Typography variant="overline" color="text.secondary">
								Relatório de saúde fiscal · {mesPorExtenso(dados.mes)}
							</Typography>
							<Typography variant="h4">{dados.empresa.nomeFantasia || dados.empresa.razaoSocial}</Typography>
							<Typography variant="body2" color="text.secondary">
								{dados.empresa.razaoSocial} · CNPJ {formatarDocumento(dados.empresa.cnpj)}
								{dados.empresa.regimeTributario ? ` · ${dados.empresa.regimeTributario}` : ""} · gerado em{" "}
								{dayjs(dados.geradoEm).format("DD/MM/YYYY")}
							</Typography>
						</Box>
						<RelatorioSaudeFiscal dados={dados} />
						<Typography variant="caption" color="text.secondary">
							Valores calculados a partir das notas fiscais eletrônicas do mês (notas canceladas ficam de fora). Dúvidas?
							Fale com a Apta Contabilidade.
						</Typography>
					</>
				) : null}
			</Stack>
		</Box>
	);
}
