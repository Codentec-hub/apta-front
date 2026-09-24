import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { PlaceholderPage } from '@/components/dashboard/placeholder-page';

export const metadata = { title: `Folha de Pagamento | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <PlaceholderPage
      titulo="Folha de Pagamento"
      fase="Fase 3.7 — Folha de pagamento"
      descricao="Cálculo da folha e do pró-labore, com transmissão automatizada de eSocial, DCTFWeb e FGTS Digital, e provisão de férias e 13º integradas à contabilidade."
    />
  );
}
