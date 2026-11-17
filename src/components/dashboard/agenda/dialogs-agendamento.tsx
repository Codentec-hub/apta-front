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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import { horarioLongo } from '@/lib/leads';

interface Alvo {
  id: string;
  inicio: string;
  lead: { nome: string; conversaId: string | null };
}

interface ConfirmarProps {
  alvo: Alvo | null;
  enviarPadrao: boolean;
  onClose: () => void;
  onFeito: (aviso: string) => void;
}

export function ConfirmarAgendamentoDialog({ alvo, enviarPadrao, onClose, onFeito }: ConfirmarProps): React.JSX.Element {
  const [avisar, setAvisar] = React.useState(enviarPadrao);
  const [observacoes, setObservacoes] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (alvo) {
      setAvisar(enviarPadrao && Boolean(alvo.lead.conversaId));
      setObservacoes('');
      setErro(null);
    }
  }, [alvo, enviarPadrao]);

  async function confirmar(): Promise<void> {
    if (!alvo) return;
    setSalvando(true);
    setErro(null);
    try {
      const r = await api<{ mensagemEnviada: boolean; erroEnvio: string | null }>(`/agendamentos/${alvo.id}/confirmar`, {
        method: 'POST',
        body: JSON.stringify({ avisarLead: avisar, observacoes: observacoes || null }),
      });
      onFeito(
        r.erroEnvio
          ? `Confirmado, mas a mensagem ao lead falhou: ${r.erroEnvio}`
          : r.mensagemEnviada
            ? `Confirmado. ${alvo.lead.nome} recebeu a confirmação no WhatsApp.`
            : 'Agendamento confirmado.'
      );
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao confirmar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={Boolean(alvo)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Confirmar agendamento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            <strong>{alvo?.lead.nome}</strong>
            <br />
            {alvo ? horarioLongo(alvo.inicio) : ''}
          </Typography>
          <FormControlLabel
            control={<Checkbox checked={avisar} onChange={(e) => setAvisar(e.target.checked)} disabled={!alvo?.lead.conversaId} />}
            label="Enviar a confirmação ao lead pelo WhatsApp"
          />
          {alvo && !alvo.lead.conversaId ? (
            <Typography variant="caption" color="text.secondary">
              Este lead ainda não tem conversa no WhatsApp do sistema.
            </Typography>
          ) : null}
          <TextField
            label="Observações internas (opcional)"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            multiline
            minRows={2}
            size="small"
          />
          {erro ? <Alert severity="error">{erro}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Voltar</Button>
        <Button variant="contained" color="success" onClick={() => void confirmar()} disabled={salvando}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface CancelarProps {
  alvo: Alvo | null;
  onClose: () => void;
  onFeito: (aviso: string) => void;
}

export function CancelarAgendamentoDialog({ alvo, onClose, onFeito }: CancelarProps): React.JSX.Element {
  const [motivo, setMotivo] = React.useState('');
  const [avisar, setAvisar] = React.useState(false);
  const [mensagem, setMensagem] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (alvo) {
      setMotivo('');
      setAvisar(false);
      setMensagem(
        `Oi, ${alvo.lead.nome.split(' ')[0]}! Precisamos desmarcar o horário de ${horarioLongo(alvo.inicio)}. Podemos combinar outro dia?`
      );
      setErro(null);
    }
  }, [alvo]);

  async function cancelar(): Promise<void> {
    if (!alvo) return;
    setSalvando(true);
    setErro(null);
    try {
      await api(`/agendamentos/${alvo.id}/cancelar`, {
        method: 'POST',
        body: JSON.stringify({ motivo, mensagemLead: avisar ? mensagem : null }),
      });
      onFeito('Agendamento cancelado e horário liberado.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao cancelar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={Boolean(alvo)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancelar agendamento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            <strong>{alvo?.lead.nome}</strong> · {alvo ? horarioLongo(alvo.inicio) : ''}
          </Typography>
          <TextField label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} size="small" required autoFocus />
          <FormControlLabel
            control={<Checkbox checked={avisar} onChange={(e) => setAvisar(e.target.checked)} disabled={!alvo?.lead.conversaId} />}
            label="Avisar o lead pelo WhatsApp"
          />
          {avisar ? (
            <TextField label="Mensagem ao lead" value={mensagem} onChange={(e) => setMensagem(e.target.value)} multiline minRows={3} />
          ) : null}
          {erro ? <Alert severity="error">{erro}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Voltar</Button>
        <Button variant="contained" color="error" onClick={() => void cancelar()} disabled={salvando || motivo.trim().length < 2}>
          Cancelar agendamento
        </Button>
      </DialogActions>
    </Dialog>
  );
}
