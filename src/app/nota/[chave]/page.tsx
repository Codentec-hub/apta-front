import * as React from "react";
import type { Metadata } from "next";

import { config } from "@/config";
import { NotaVisualizacao } from "@/components/nota/nota-visualizacao";

export const metadata = { title: `Nota fiscal | ${config.site.name}`, robots: { index: false } } satisfies Metadata;

interface PageProps {
	params: Promise<{ chave: string }>;
}

// DANFE / visualização da nota montada no sistema a partir do XML (abre numa
// aba própria, sem o menu, para imprimir ou salvar em PDF). Exige login.
export default async function Page({ params }: PageProps): Promise<React.JSX.Element> {
	const { chave } = await params;
	return <NotaVisualizacao chave={chave} />;
}
