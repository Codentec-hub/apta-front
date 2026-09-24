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
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import type { Atraso, Obrigacao } from '@/types/domain';

export interface AtrasoDialogProps {
  open: boolean;
  obrigacao: Obrigacao | null;
  onClose: () => void;
  onSaved: (obrigacao: Obrigacao) => void;
}

export function AtrasoDialog({ open, obrigacao, onClose, onSaved }: AtrasoDialogProps): React.JSX.Element | null {
  const atraso = obrigacao?.atraso ?? null;

  const [justificativa, setJustificativa] = React.useState('');
  const [causaRaiz, setCausaRaiz] = React.useState('');
  const [planoDeAcao, setPlanoDeAcao] = React.useState('');
  const [prazoPrometido, setPrazoPrometido] = React.useState<Dayjs | null>(dayjs().add(3, 'day'));
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setJustificativa(atraso?.justificativa ?? '');
    setCausaRaiz(atraso?.causaRaiz ?? '');
    setPlanoDeAcao(atraso?.planoDeAcao ?? '');
    setPrazoPrometido(atraso ? dayjs(atraso.prazoPrometido) : dayjs().add(3, 'day'));
    setErro(null);
  }, [open, atraso]);

  if (!obrigacao) {
    return null;
  }

  const cumprido = atraso?.cumprido ?? false;

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!justificativa.trim() || !causaRaiz.trim() || !planoDeAcao.trim() || !prazoPrometido || !obrigacao) {
      setErro('Preencha justificativa, causa raiz, plano de ação e o prazo prometido');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      await api<Atraso>(`/obrigacoes/${obrigacao.id}/atraso`, {
        method: 'PUT',
        body: JSON.stringify({
          justificativa: justificativa.trim(),
          causaRaiz: causaRaiz.trim(),
          planoDeAcao: planoDeAcao.trim(),
          prazoPrometido: prazoPrometido.toISOString(),
        }),
      });
      const atualizada = await api<Obrigacao>(`/obrigacoes/${obrigacao.id}`);
      onSaved(atualizada);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao registrar o plano de ação');
    } finally {
      setSalvando(false);
    }
  }

  async function marcarCumprido(): Promise<void> {
    if (!obrigacao) {
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await api(`/obrigacoes/${obrigacao.id}/atraso/cumprir`, { method: 'POST' });
      const atualizada = await api<Obrigacao>(`/obrigacoes/${obrigacao.id}`);
      onSaved(atualizada);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao confirmar o plano de ação');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {atraso ? 'Plano de ação' : 'Registrar atraso'} — {obrigacao.nome}
      </DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <Typography color="text.secondary" variant="body2">
              {obrigacao.cliente.razaoSocial} · prazo original {dayjs(obrigacao.prazo).format('DD/MM/YYYY')}
            </Typography>

            {cumprido ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Plano de ação cumprido em {dayjs(atraso?.cumpridoEm).format('DD/MM/YYYY [às] HH:mm')}.
              </Alert>
            ) : null}

            <TextField
              label="Justificativa"
              helperText="Por que essa entrega atrasou?"
              value={justificativa}
              onChange={(event) => setJustificativa(event.target.value)}
              disabled={cumprido}
              multiline
              minRows={2}
              required
              fullWidth
            />
            <TextField
              label="Causa raiz"
              helperText="Qual o motivo de fundo, para evitar que se repita?"
              value={causaRaiz}
              onChange={(event) => setCausaRaiz(event.target.value)}
              disabled={cumprido}
              multiline
              minRows={2}
              required
              fullWidth
            />
            <TextField
              label="Plano de ação"
              helperText="O que será feito para resolver e não repetir?"
              value={planoDeAcao}
              onChange={(event) => setPlanoDeAcao(event.target.value)}
              disabled={cumprido}
              multiline
              minRows={2}
              required
              fullWidth
            />
            <DatePicker
              label="Prazo prometido para concluir o plano"
              value={prazoPrometido}
              onChange={setPrazoPrometido}
              disabled={cumprido}
              format="DD/MM/YYYY"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          {atraso && !cumprido ? (
            <Button onClick={marcarCumprido} disabled={salvando} color="success" variant="outlined">
              Marcar como cumprido
            </Button>
          ) : null}
          {cumprido ? null : (
            <Button type="submit" variant="contained" disabled={salvando}>
              {atraso ? 'Salvar alterações' : 'Registrar'}
            </Button>
          )}
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
