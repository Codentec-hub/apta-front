import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { IntegracoesView } from '@/components/dashboard/integracoes/integracoes-view';

export const metadata = { title: `Integrações | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return <IntegracoesView />;
}
