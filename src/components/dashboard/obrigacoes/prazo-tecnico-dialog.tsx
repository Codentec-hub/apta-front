'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import type { Obrigacao } from '@/types/domain';

export interface PrazoTecnicoDialogProps {
  open: boolean;
  obrigacao: Obrigacao | null;
  onClose: () => void;
  onSaved: (obrigacao: Obrigacao) => void;
}

// Ícone de relógio "Alterar o prazo técnico" da Lista de Entregas.
export function PrazoTecnicoDialog({ open, obrigacao, onClose, onSaved }: PrazoTecnicoDialogProps): React.JSX.Element | null {
  const [data, setData] = React.useState<Dayjs | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && obrigacao) {
      setData(dayjs(obrigacao.prazoTecnico ?? obrigacao.prazo));
      setErro(null);
    }
  }, [open, obrigacao]);

  if (!obrigacao) return null;

  async function salvar(): Promise<void> {
    if (!obrigacao || !data) return;
    if (data.isAfter(dayjs(obrigacao.prazo), 'day')) {
      setErro('O prazo técnico não pode passar do prazo legal');
      return;
    }
    try {
      const atualizada = await api<Obrigacao>(`/obrigacoes/${obrigacao.id}`, {
        method: 'PUT',
        body: JSON.stringify({ prazoTecnico: data.endOf('day').toISOString() }),
      });
      onSaved(atualizada);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao alterar prazo técnico');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Alterar o prazo técnico</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Typography variant="body2">
            <strong>{obrigacao.nome}</strong> — {obrigacao.cliente.razaoSocial}
            <br />
            Prazo legal: {dayjs(obrigacao.prazo).format('DD/MM/YYYY')}
          </Typography>
          <DatePicker label="Novo prazo técnico" value={data} onChange={setData} format="DD/MM/YYYY" maxDate={dayjs(obrigacao.prazo)} />
          <Typography color="text.secondary" variant="caption">
            A alteração fica registrada no histórico da entrega.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={salvar} disabled={!data}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
