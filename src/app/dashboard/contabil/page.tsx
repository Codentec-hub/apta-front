import * as React from 'react';
import type { Metadata } from 'next';

import { config } from '@/config';
import { PlaceholderPage } from '@/components/dashboard/placeholder-page';

export const metadata = { title: `Contábil | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <PlaceholderPage
      titulo="Contábil"
      fase="Fase 3.9 — Contábil avançado"
      descricao="Conexão Open Finance e validação automática dos arquivos recebidos, para conferência das contas contábeis."
    />
  );
}
