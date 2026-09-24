'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import type { ComentarioEntrega, Obrigacao } from '@/types/domain';

export interface ComentariosDialogProps {
  open: boolean;
  obrigacao: Obrigacao | null;
  onClose: () => void;
  onChange: (obrigacaoId: string, total: number) => void;
}

// Coluna "Comentários" da Lista de Entregas.
export function ComentariosDialog({ open, obrigacao, onClose, onChange }: ComentariosDialogProps): React.JSX.Element | null {
  const [comentarios, setComentarios] = React.useState<ComentarioEntrega[] | null>(null);
  const [texto, setTexto] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !obrigacao) return;
    setComentarios(null);
    setTexto('');
    setErro(null);
    api<ComentarioEntrega[]>(`/obrigacoes/${obrigacao.id}/comentarios`)
      .then(setComentarios)
      .catch(() => setComentarios([]));
  }, [open, obrigacao]);

  if (!obrigacao) return null;

  async function adicionar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!obrigacao || !texto.trim()) return;
    try {
      const novo = await api<ComentarioEntrega>(`/obrigacoes/${obrigacao.id}/comentarios`, {
        method: 'POST',
        body: JSON.stringify({ texto }),
      });
      const lista = [novo, ...(comentarios ?? [])];
      setComentarios(lista);
      setTexto('');
      onChange(obrigacao.id, lista.length);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao comentar');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Comentários</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2">
            <strong>{obrigacao.nome}</strong> — {obrigacao.cliente.razaoSocial}
          </Typography>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Stack component="form" direction="row" spacing={1} onSubmit={adicionar}>
            <TextField
              size="small"
              placeholder="Escreva um comentário…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              fullWidth
              autoFocus
            />
            <Button type="submit" variant="contained" disabled={!texto.trim()}>
              Comentar
            </Button>
          </Stack>
          {comentarios === null ? (
            <Typography color="text.secondary">Carregando…</Typography>
          ) : comentarios.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
              Nenhum comentário.
            </Typography>
          ) : (
            <Stack divider={<Divider />} spacing={1.5}>
              {comentarios.map((c) => (
                <Stack key={c.id} spacing={0.25}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {c.texto}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {dayjs(c.createdAt).format('DD/MM/YYYY HH:mm')} · {c.usuario?.nome ?? '—'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
