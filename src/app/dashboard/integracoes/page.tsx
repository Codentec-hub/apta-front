import * as React from 'react';
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { config } from '@/config';
import { IntegracoesGrid } from '@/components/dashboard/integracoes/integracoes-grid';

export const metadata = { title: `Integrações | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography
          color="primary.main"
          sx={{ fontFamily: 'var(--font-roboto-mono, monospace)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Fase 3.1 — Fundação técnica · em construção
        </Typography>
        <Typography variant="h4">Integrações</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: '68ch', lineHeight: 1.6 }}>
          Configuração das ferramentas hoje usadas pelo escritório. Os dados abaixo são{' '}
          <strong>fictícios</strong>, apenas para ilustrar como cada integração vai aparecer — a ativação de
          verdade acontece na Fase 3.1, após o levantamento de disponibilidade de API de cada uma.
        </Typography>
      </Stack>
      <IntegracoesGrid />
    </Stack>
  );
}
