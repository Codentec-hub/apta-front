import * as React from 'react';
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { config } from '@/config';
import { Preferencias } from '@/components/dashboard/notificacoes/notificacoes-view';

export const metadata = { title: `Notificações | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Notificações</Typography>
        <Typography color="text.secondary" variant="body2">
          Como você quer ser avisado: aviso na tela, som e notificação do navegador, e quais avisos receber no sistema e por
          e-mail. Vale só para a sua conta.
        </Typography>
      </div>
      <Preferencias />
    </Stack>
  );
}
