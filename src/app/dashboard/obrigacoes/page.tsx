import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { ObrigacoesView } from '@/components/dashboard/obrigacoes/obrigacoes-view';

export const metadata = { title: `Obrigações | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <ObrigacoesView />;
}
