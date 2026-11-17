'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ArchiveIcon } from '@phosphor-icons/react/dist/ssr/Archive';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { InfoIcon } from '@phosphor-icons/react/dist/ssr/Info';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';
import { WarningOctagonIcon } from '@phosphor-icons/react/dist/ssr/WarningOctagon';

import { COR_SEVERIDADE, quando, type Notificacao, type SeveridadeNotificacao } from '@/lib/notificacoes';

const ICONE: Record<SeveridadeNotificacao, Icon> = {
  info: InfoIcon,
  sucesso: CheckCircleIcon,
  aviso: WarningIcon,
  erro: WarningOctagonIcon,
};

export function ItemNotificacao({
  n,
  onAbrir,
  onArquivar,
  compacto = false,
  selecao,
}: {
  n: Notificacao;
  onAbrir: (n: Notificacao) => void;
  onArquivar?: (n: Notificacao) => void;
  compacto?: boolean;
  selecao?: React.ReactNode;
}): React.JSX.Element {
  const Icone = ICONE[n.severidade] ?? InfoIcon;
  const naoLida = !n.lidaEm;
  return (
    <Stack
      direction="row"
      spacing={1.5}
      onClick={() => onAbrir(n)}
      sx={{
        px: 2,
        py: compacto ? 1.25 : 1.5,
        cursor: 'pointer',
        alignItems: 'flex-start',
        borderBottom: '1px solid var(--mui-palette-divider)',
        bgcolor: naoLida ? 'var(--mui-palette-primary-50)' : 'transparent',
        '&:hover': { bgcolor: 'var(--mui-palette-action-hover)' },
        '&:hover .acoes': { opacity: 1 },
      }}
    >
      {selecao}
      <Box sx={{ color: COR_SEVERIDADE[n.severidade], display: 'flex', pt: 0.25 }}>
        <Icone fontSize="var(--icon-fontSize-lg)" weight={naoLida ? 'fill' : 'regular'} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: naoLida ? 700 : 500 }} noWrap={compacto}>
            {n.titulo}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {quando(n.criadoEm)}
          </Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={
            compacto
              ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
              : undefined
          }
        >
          {n.mensagem}
        </Typography>
        {compacto ? null : (
          <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {n.categoria}
            </Typography>
            {n.emailEnviadoEm ? (
              <Tooltip title="Também enviada por e-mail">
                <Box sx={{ display: 'flex', color: 'text.secondary' }}>
                  <EnvelopeSimpleIcon fontSize="var(--icon-fontSize-sm)" />
                </Box>
              </Tooltip>
            ) : null}
          </Stack>
        )}
      </Box>
      {naoLida ? (
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1, flexShrink: 0 }} />
      ) : null}
      {onArquivar && !n.arquivadaEm ? (
        <Tooltip title="Arquivar">
          <IconButton
            className="acoes"
            size="small"
            sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity .15s', mt: -0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              onArquivar(n);
            }}
          >
            <ArchiveIcon />
          </IconButton>
        </Tooltip>
      ) : null}
    </Stack>
  );
}
