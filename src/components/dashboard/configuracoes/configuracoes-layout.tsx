'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useUser } from '@/hooks/use-user';
import { itensDoPerfil, settingsNavItems } from '@/components/dashboard/layout/config';
import { navIcons } from '@/components/dashboard/layout/nav-icons';

/** Página de Configurações: menu lateral agrupado (no celular, atalhos no topo) + a página escolhida. */
export function ConfiguracoesLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const { user } = useUser();
  const itens = itensDoPerfil(settingsNavItems, user?.perfil);
  const grupos = [...new Set(itens.map((i) => i.grupo ?? ''))];
  const ativo = (href?: string) => Boolean(href && (pathname === href || pathname.startsWith(`${href}/`)));

  return (
    <Stack spacing={3}>
      {/* Celular: atalhos em linha */}
      <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', md: 'none' }, overflowX: 'auto', pb: 0.5, alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ flexShrink: 0, mr: 0.5 }}>
          Configurações
        </Typography>
        {itens.map((i) => (
          <Chip
            key={i.key}
            component={RouterLink}
            href={i.href ?? '#'}
            clickable
            label={i.title}
            color={ativo(i.href) ? 'primary' : 'default'}
            variant={ativo(i.href) ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Paper
          variant="outlined"
          component="nav"
          sx={{ display: { xs: 'none', md: 'block' }, width: 240, flexShrink: 0, p: 1.5, position: 'sticky', top: 88 }}
        >
          <Typography variant="h6" sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
            Configurações
          </Typography>
          {grupos.map((g) => (
            <Box key={g} sx={{ '& + &': { mt: 2 } }}>
              <Typography variant="overline" color="text.secondary" sx={{ px: 1.5, display: 'block', lineHeight: 2 }}>
                {g}
              </Typography>
              {itens
                .filter((i) => (i.grupo ?? '') === g)
                .map((i) => {
                  const Icone = i.icon ? navIcons[i.icon] : null;
                  const marcado = ativo(i.href);
                  return (
                    <Box
                      key={i.key}
                      component={RouterLink}
                      href={i.href ?? '#'}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.5,
                        py: 1,
                        borderRadius: 1,
                        textDecoration: 'none',
                        color: marcado ? 'primary.main' : 'text.primary',
                        bgcolor: marcado ? 'var(--mui-palette-primary-50)' : 'transparent',
                        fontWeight: marcado ? 600 : 400,
                        '&:hover': { bgcolor: marcado ? 'var(--mui-palette-primary-50)' : 'var(--mui-palette-action-hover)' },
                      }}
                    >
                      {Icone ? <Icone fontSize="var(--icon-fontSize-md)" weight={marcado ? 'fill' : 'regular'} /> : null}
                      <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                        {i.title}
                      </Typography>
                    </Box>
                  );
                })}
            </Box>
          ))}
        </Paper>
        <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      </Stack>
    </Stack>
  );
}
