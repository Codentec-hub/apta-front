import * as React from 'react';
import RouterLink from 'next/link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';

import { paths } from '@/paths';
import { Logo } from '@/components/core/logo';

export interface LayoutProps {
  children: React.ReactNode;
}

const DESTAQUES = [
  'Prazos e planos de ação sempre acompanhados',
  'Atendimento e demandas organizados por setor',
  'Financeiro e indicadores de produtividade da equipe',
];

export function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <Box
      sx={{
        display: { xs: 'flex', lg: 'grid' },
        flexDirection: 'column',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '100%',
      }}
    >
      <Box sx={{ alignItems: 'center', display: 'flex', flex: '1 1 auto', justifyContent: 'center', p: 3 }}>
        <Stack spacing={6} sx={{ maxWidth: '450px', width: '100%' }}>
          <Box
            component={RouterLink}
            href={paths.home}
            sx={{ alignSelf: 'center', display: 'inline-block', fontSize: 0 }}
          >
            <Logo height={135} width={299} />
          </Box>
          {children}
        </Stack>
      </Box>
      <Box
        sx={{
          alignItems: 'center',
          background: 'radial-gradient(50% 50% at 50% 50%, #2f83c4 0%, #10151a 100%)',
          color: 'var(--mui-palette-common-white)',
          display: { xs: 'none', lg: 'flex' },
          justifyContent: 'center',
          p: 6,
        }}
      >
        <Stack spacing={4} sx={{ maxWidth: '480px' }}>
          <Stack spacing={2}>
            <Typography color="inherit" sx={{ fontSize: '14px', letterSpacing: '0.12em', opacity: 0.8 }} variant="overline">
              Sistema Apta
            </Typography>
            <Typography color="inherit" sx={{ fontSize: '36px', fontWeight: 600, lineHeight: '44px' }} variant="h1">
              Toda a operação contábil em um só lugar
            </Typography>
            <Typography color="inherit" sx={{ fontSize: '18px', lineHeight: '28px', opacity: 0.85 }} variant="body1">
              Obrigações, atendimento, financeiro e produtividade da equipe reunidos em uma única plataforma, com os
              dados da Apta sob o controle da Apta.
            </Typography>
          </Stack>
          <Stack spacing={1.5} sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.24)', pt: 3 }}>
            {DESTAQUES.map((texto) => (
              <Stack direction="row" key={texto} spacing={1.5} sx={{ alignItems: 'center' }}>
                <CheckCircleIcon fontSize="var(--icon-fontSize-lg)" weight="fill" />
                <Typography color="inherit" variant="body1">
                  {texto}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
