import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { PlaceholderPage } from '@/components/dashboard/placeholder-page';

export const metadata = { title: `Fiscal | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <PlaceholderPage
      titulo="Fiscal"
      fase="Fase 3.6 — Automação fiscal"
      descricao="Captura automática de notas fiscais, emissão de parcelamentos em lote e monitoramento de vencimento de certificados digitais. Integra o SIEG e o DominioWeb."
    />
  );
}
