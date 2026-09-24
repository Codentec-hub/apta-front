'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import { formatarCompetencia } from '@/lib/obrigacao-status';
import type { LogObrigacao, Obrigacao } from '@/types/domain';

export interface HistoricoDialogProps {
  open: boolean;
  obrigacao: Obrigacao | null;
  onClose: () => void;
}

// Log de operações da entrega (alterações de prazo, entrega, reabertura…).
export function HistoricoDialog({ open, obrigacao, onClose }: HistoricoDialogProps): React.JSX.Element | null {
  const [logs, setLogs] = React.useState<LogObrigacao[] | null>(null);

  React.useEffect(() => {
    if (!open || !obrigacao) return;
    setLogs(null);
    api<LogObrigacao[]>(`/obrigacoes/${obrigacao.id}/logs`)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [open, obrigacao]);

  if (!obrigacao) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Histórico da entrega</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>{obrigacao.cliente.razaoSocial}</strong> — {obrigacao.nome} · competência{' '}
          {formatarCompetencia(obrigacao.competencia)}
        </Typography>
        {logs === null ? (
          <Typography color="text.secondary">Carregando…</Typography>
        ) : logs.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nenhuma alteração registrada — entrega como foi gerada.
          </Typography>
        ) : (
          <Stack divider={<Divider />} spacing={1.5}>
            {logs.map((log) => (
              <Stack key={log.id} spacing={0.25}>
                <Typography variant="body2">{log.detalhe}</Typography>
                <Typography color="text.secondary" variant="caption">
                  {dayjs(log.createdAt).format('DD/MM/YYYY HH:mm')} · {log.usuario?.nome ?? 'Sistema'}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
