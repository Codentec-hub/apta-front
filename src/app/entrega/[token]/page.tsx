import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { EntregaPublica } from '@/components/entrega/entrega-publica';

export const metadata = { title: `Documentos | ${config.site.name}`, robots: { index: false } } satisfies Metadata;

interface PageProps {
  params: Promise<{ token: string }>;
}

// Página que o cliente abre pelo link do protocolo de entrega (sem login).
export default async function Page({ params }: PageProps): Promise<React.JSX.Element> {
  const { token } = await params;
  return <EntregaPublica token={token} />;
}
