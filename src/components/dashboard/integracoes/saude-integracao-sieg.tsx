'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';

import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';
import { SiegSaudeTab } from '@/components/dashboard/sieg/sieg-saude-tab';

/** Configurações → Integrações → SIEG: token, busca noturna, chamadas e erros. */
export function SaudeIntegracaoSieg(): React.JSX.Element {
  const { user } = useUser();
  const ehAdmin = user?.perfil === 'ADMIN';
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Link
          component={RouterLink}
          href={paths.dashboard.integracoes}
          underline="hover"
          variant="body2"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowLeftIcon size={14} /> Integrações
        </Link>
        <Typography variant="h4">SIEG</Typography>
        <Typography color="text.secondary" variant="body2">
          Saúde da integração: autorização, busca noturna de notas, chamadas e erros recentes.
        </Typography>
      </Stack>
      <SiegSaudeTab podeAcionar={ehAdmin || user?.perfil === 'GESTOR'} ehAdmin={ehAdmin} />
    </Stack>
  );
}
