'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import type { Obrigacao } from '@/types/domain';

export interface ConcluirDialogProps {
  open: boolean;
  obrigacao: Obrigacao | null;
  onClose: () => void;
  onSaved: (obrigacao: Obrigacao) => void;
}

export function ConcluirDialog({ open, obrigacao, onClose, onSaved }: ConcluirDialogProps): React.JSX.Element | null {
  const [tempoRealMinutos, setTempoRealMinutos] = React.useState('');
  const [entregueEm, setEntregueEm] = React.useState<Dayjs | null>(dayjs());
  const [comentario, setComentario] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTempoRealMinutos('');
      setEntregueEm(dayjs());
      setComentario(obrigacao?.tipo?.comentarioPadrao ?? '');
      setErro(null);
    }
  }, [open, obrigacao]);

  if (!obrigacao) {
    return null;
  }

  async function confirmar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!obrigacao) {
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await api<Obrigacao>(`/obrigacoes/${obrigacao.id}/concluir`, {
        method: 'POST',
        body: JSON.stringify({
          tempoRealMinutos: tempoRealMinutos ? Number(tempoRealMinutos) : null,
          // Hoje = agora; data passada = registro retroativo (meio-dia local).
          entregueEm:
            !entregueEm || entregueEm.isSame(dayjs(), 'day')
              ? null
              : entregueEm.hour(12).minute(0).second(0).toISOString(),
          comentario: comentario.trim() || null,
        }),
      });
      onSaved(atualizada);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao concluir obrigação');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Registrar entrega</DialogTitle>
      <Stack component="form" onSubmit={confirmar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <Typography variant="body2">
              <strong>{obrigacao.cliente.razaoSocial}</strong> — {obrigacao.nome}
            </Typography>
            <DatePicker
              label="Data da entrega"
              value={entregueEm}
              onChange={setEntregueEm}
              maxDate={dayjs()}
              format="DD/MM/YYYY"
            />
            <TextField
              label="Tempo gasto (min)"
              type="number"
              value={tempoRealMinutos}
              onChange={(event) => setTempoRealMinutos(event.target.value)}
              helperText={
                obrigacao.tipo?.tempoPrevistoMinutos
                  ? `Tempo previsto para este tipo: ${obrigacao.tipo.tempoPrevistoMinutos} min`
                  : 'Opcional — ajuda a medir a produtividade real'
              }
              autoFocus
              fullWidth
            />
            <TextField
              label="Comentário"
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            Marcar como entregue
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
