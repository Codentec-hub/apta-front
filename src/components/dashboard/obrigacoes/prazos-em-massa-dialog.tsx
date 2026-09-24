'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import { formatarCompetencia } from '@/lib/obrigacao-status';
import type { Obrigacao } from '@/types/domain';

export interface PrazosEmMassaDialogProps {
  open: boolean;
  entregas: Obrigacao[];
  onClose: () => void;
  onSaved: (atualizadas: Obrigacao[]) => void;
}

// Fim do dia local (mesma convenção dos prazos gerados pelo backend).
function fimDoDia(data: Dayjs): string {
  return data.endOf('day').toISOString();
}

export function PrazosEmMassaDialog({ open, entregas, onClose, onSaved }: PrazosEmMassaDialogProps): React.JSX.Element | null {
  const [alterarLegal, setAlterarLegal] = React.useState(true);
  const [alterarTecnico, setAlterarTecnico] = React.useState(false);
  const [prazo, setPrazo] = React.useState<Dayjs | null>(null);
  const [prazoTecnico, setPrazoTecnico] = React.useState<Dayjs | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setAlterarLegal(true);
      setAlterarTecnico(false);
      setPrazo(null);
      setPrazoTecnico(null);
      setErro(null);
    }
  }, [open]);

  const primeira = entregas[0];
  if (!primeira) return null;

  async function salvar(): Promise<void> {
    if ((!alterarLegal && !alterarTecnico) || (alterarLegal && !prazo) || (alterarTecnico && !prazoTecnico)) {
      setErro('Informe a nova data do(s) prazo(s) marcado(s)');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const atualizadas = await api<Obrigacao[]>('/obrigacoes/prazos-em-massa', {
        method: 'POST',
        body: JSON.stringify({
          ids: entregas.map((e) => e.id),
          ...(alterarLegal && prazo ? { prazo: fimDoDia(prazo) } : {}),
          ...(alterarTecnico && prazoTecnico ? { prazoTecnico: fimDoDia(prazoTecnico) } : {}),
        }),
      });
      onSaved(atualizadas);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao alterar prazos');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Alterar prazos em massa</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Typography variant="body2">
            <strong>{primeira.nome}</strong> · competência {formatarCompetencia(primeira.competencia)} ·{' '}
            <strong>{entregas.length}</strong> entrega(s)
          </Typography>
          <Typography color="text.secondary" variant="caption">
            Use para feriados estaduais/municipais e prorrogações da Receita. A alteração fica registrada no histórico
            de cada entrega.
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={alterarLegal} onChange={(e) => setAlterarLegal(e.target.checked)} />}
            label="Alterar prazo legal"
          />
          {alterarLegal ? <DatePicker label="Novo prazo legal" value={prazo} onChange={setPrazo} format="DD/MM/YYYY" /> : null}
          <FormControlLabel
            control={<Checkbox checked={alterarTecnico} onChange={(e) => setAlterarTecnico(e.target.checked)} />}
            label="Alterar prazo técnico"
          />
          {alterarTecnico ? (
            <DatePicker label="Novo prazo técnico" value={prazoTecnico} onChange={setPrazoTecnico} format="DD/MM/YYYY" />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={salvar} disabled={salvando}>
          Atualizar {entregas.length} entrega(s)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
