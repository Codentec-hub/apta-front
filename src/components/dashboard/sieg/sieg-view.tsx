"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";

import { useUser } from "@/hooks/use-user";
import { SiegEmpresasView } from "@/components/dashboard/integracoes/sieg-empresas-view";

import { SiegNotasTab } from "./sieg-notas-tab";
import { SiegRelatoriosTab } from "./sieg-relatorios-tab";
import { SiegSaudeTab } from "./sieg-saude-tab";

const ABAS = ["empresas", "notas", "relatorios", "saude"] as const;
type Aba = (typeof ABAS)[number];

/** Área da SIEG: empresas, notas fiscais, relatórios e a saúde da integração. */
export function SiegView(): React.JSX.Element {
	const params = useSearchParams();
	const router = useRouter();
	const { user } = useUser();
	const ehAdmin = user?.perfil === "ADMIN";
	const podeAcionar = ehAdmin || user?.perfil === "GESTOR";
	const abaUrl = params.get("aba") as Aba | null;
	const aba: Aba = abaUrl && ABAS.includes(abaUrl) ? abaUrl : "empresas";

	const trocar = (nova: Aba) => {
		const p = new URLSearchParams(params.toString());
		p.set("aba", nova);
		if (nova !== "notas") p.delete("documento");
		router.replace(`?${p.toString()}`);
	};

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
					<ReceiptIcon size={22} />
				</Box>
				<Box>
					<Typography variant="h4">SIEG</Typography>
					<Typography variant="body2" color="text.secondary">
						Empresas, notas fiscais e relatórios lidos da conta SIEG da Apta (somente leitura).
					</Typography>
				</Box>
			</Stack>

			<Tabs value={aba} onChange={(_e, v: Aba) => trocar(v)} variant="scrollable" allowScrollButtonsMobile>
				<Tab value="empresas" label="Empresas" />
				<Tab value="notas" label="Notas fiscais" />
				<Tab value="relatorios" label="Relatórios" />
				<Tab value="saude" label="Saúde da integração" />
			</Tabs>

			{aba === "empresas" ? <SiegEmpresasView embutido /> : null}
			{aba === "notas" ? <SiegNotasTab podeAcionar={podeAcionar} documentoInicial={params.get("documento")} /> : null}
			{aba === "relatorios" ? <SiegRelatoriosTab /> : null}
			{aba === "saude" ? <SiegSaudeTab podeAcionar={podeAcionar} ehAdmin={ehAdmin} /> : null}
		</Stack>
	);
}
