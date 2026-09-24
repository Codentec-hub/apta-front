import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { ClientesView } from '@/components/dashboard/clientes/clientes-view';

export const metadata = { title: `Clientes | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <ClientesView />;
}
