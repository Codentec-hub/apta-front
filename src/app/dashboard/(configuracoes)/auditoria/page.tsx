import * as React from 'react';
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { config } from '@/config';
import { AuditoriaView } from '@/components/dashboard/auditoria/auditoria-view';
import { ApenasPerfis } from '@/components/dashboard/layout/apenas-perfis';

export const metadata = { title: `Auditoria | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <ApenasPerfis perfis={['ADMIN', 'GESTOR']}>
      <Stack spacing={3}>
        <div>
          <Typography variant="h4">Auditoria</Typography>
          <Typography color="text.secondary" variant="body2">
            Quem criou, alterou ou excluiu cada coisa no sistema, quando e de onde. Clique na seta para ver o antes e depois.
          </Typography>
        </div>
        <AuditoriaView />
      </Stack>
    </ApenasPerfis>
  );
}
