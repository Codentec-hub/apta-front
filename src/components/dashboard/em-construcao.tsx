'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr/ClipboardText';
import { HeadsetIcon } from '@phosphor-icons/react/dist/ssr/Headset';

import { paths } from '@/paths';

import { navIcons } from './layout/nav-icons';

// Ilustração própria: blocos sendo empilhados por um guindaste. Usa as cores
// do tema, então acompanha o modo claro/escuro.
function Ilustracao(): React.JSX.Element {
  return (
    <Box
      component="svg"
      viewBox="0 0 240 180"
      aria-hidden
      sx={{ width: { xs: 200, md: 240 }, height: 'auto', display: 'block' }}
    >
      <ellipse cx="120" cy="164" rx="96" ry="8" fill="var(--mui-palette-primary-main)" opacity="0.08" />
      {/* guindaste */}
      <g stroke="var(--mui-palette-neutral-400)" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M44 162V26" />
        <path d="M30 26h150" />
        <path
          d="M44 40l14-14M44 60l14-14M44 80l14-14M44 100l14-14M44 120l14-14M44 140l14-14"
          strokeWidth="2"
          opacity="0.6"
        />
        <path d="M44 26l-14 14" />
        <path d="M150 26v40" strokeWidth="2" strokeDasharray="4 4" />
      </g>
      <rect x="22" y="38" width="16" height="12" rx="2" fill="var(--mui-palette-neutral-400)" />
      {/* bloco suspenso */}
      <g>
        <path d="M150 66l-10 10M150 66l10 10" stroke="var(--mui-palette-neutral-400)" strokeWidth="2" />
        <rect x="132" y="76" width="36" height="26" rx="4" fill="var(--mui-palette-warning-main)" />
        <path
          d="M140 89h20"
          stroke="var(--mui-palette-common-white)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
      {/* blocos já empilhados */}
      <rect x="92" y="136" width="44" height="26" rx="4" fill="var(--mui-palette-primary-main)" />
      <rect x="140" y="136" width="44" height="26" rx="4" fill="var(--mui-palette-primary-light)" />
      <rect x="116" y="108" width="44" height="26" rx="4" fill="var(--mui-palette-primary-dark)" />
      <path
        d="M102 149h24M150 149h24M126 121h24"
        stroke="var(--mui-palette-common-white)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      {/* cone */}
      <path d="M200 162l9-28 9 28z" fill="var(--mui-palette-warning-main)" />
      <path d="M203.5 152h11M206 144h6" stroke="var(--mui-palette-common-white)" strokeWidth="2.5" />
      <rect x="196" y="160" width="26" height="4" rx="2" fill="var(--mui-palette-warning-dark)" />
    </Box>
  );
}

export interface EmConstrucaoProps {
  titulo: string;
  // Chave de `navIcons` (o mesmo ícone do menu). Texto, e não o componente,
  // porque a página é um Server Component.
  icone: string;
  // Fase da proposta (ex.: "Fase 3.6 — Automação fiscal").
  fase: string;
  descricao: string;
  // O que a tela vai fazer quando ficar pronta.
  recursos: string[];
  // Por que ainda não está pronta (ex.: depende de integração externa).
  dependencia?: string;
}

export function EmConstrucao({
  titulo,
  icone,
  fase,
  descricao,
  recursos,
  dependencia,
}: EmConstrucaoProps): React.JSX.Element {
  const Icone = navIcons[icone];
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)',
            color: 'primary.main',
          }}
        >
          {Icone ? <Icone size={22} /> : null}
        </Box>
        <Typography variant="h4">{titulo}</Typography>
      </Stack>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', md: 'row' }}>
          <Stack
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 3, md: 5 },
              bgcolor: 'var(--mui-palette-background-level1)',
              minWidth: { md: 340 },
            }}
          >
            <Ilustracao />
          </Stack>

          <Stack spacing={2.5} sx={{ p: { xs: 3, md: 5 }, flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Chip label="Em construção" color="warning" size="small" />
              <Chip label={fase} size="small" variant="outlined" />
            </Stack>
            <Stack spacing={1}>
              <Typography variant="h5">Esta área ainda está sendo construída</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7, maxWidth: '62ch' }}>
                {descricao}
              </Typography>
            </Stack>

            <Stack spacing={1.25}>
              <Typography variant="overline" color="text.secondary">
                O que vai ter aqui
              </Typography>
              {recursos.map((recurso) => (
                <Stack key={recurso} direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ color: 'primary.main', mt: '2px', flex: '0 0 auto' }}>
                    <CheckCircleIcon size={18} weight="duotone" />
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {recurso}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            {dependencia ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ borderLeft: '3px solid', borderColor: 'warning.main', pl: 1.5, lineHeight: 1.6 }}
              >
                {dependencia}
              </Typography>
            ) : null}

            <Divider />

            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Enquanto isso, o que já está funcionando:
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.obrigacoes}
                  variant="contained"
                  startIcon={<ClipboardTextIcon />}
                >
                  Ir para Obrigações
                </Button>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.atendimento}
                  variant="outlined"
                  startIcon={<HeadsetIcon />}
                >
                  Ir para Atendimento
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
