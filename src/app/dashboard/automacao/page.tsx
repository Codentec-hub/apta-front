import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { PlaceholderPage } from '@/components/dashboard/placeholder-page';

export const metadata = { title: `Automação e IA | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <PlaceholderPage
      titulo="Automação e IA"
      fase="Fase 3.10 — Inteligência e automação avançada"
      descricao="Inteligência artificial aplicada à triagem de atendimento, resposta a demandas recorrentes e sinais preditivos de atraso e produtividade por setor."
    />
  );
}
