import * as React from "react";
import type { Metadata } from "next";

import { config } from "@/config";
import { SaudeFiscalPublica } from "@/components/saude-fiscal/saude-fiscal-publica";

export const metadata = { title: `Saúde fiscal | ${config.site.name}`, robots: { index: false } } satisfies Metadata;

interface PageProps {
	params: Promise<{ token: string }>;
}

// Página que o cliente abre pelo link do relatório mensal (sem login).
export default async function Page({ params }: PageProps): Promise<React.JSX.Element> {
	const { token } = await params;
	return <SaudeFiscalPublica token={token} />;
}
