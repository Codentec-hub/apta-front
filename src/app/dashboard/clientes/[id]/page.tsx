import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { ClienteDetalheView } from '@/components/dashboard/clientes/cliente-detalhe-view';

export const metadata = { title: `Cliente | ${config.site.name}` } satisfies Metadata;

export default async function Page({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  return <ClienteDetalheView clienteId={id} />;
}
