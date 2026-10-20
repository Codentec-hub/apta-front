import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { CaixaEntrada } from '@/components/dashboard/atendimento/caixa-entrada';

export const metadata = { title: `Atendimento | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <React.Suspense>
      <CaixaEntrada />
    </React.Suspense>
  );
}
