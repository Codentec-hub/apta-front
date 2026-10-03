'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PaperclipIcon } from '@phosphor-icons/react/dist/ssr/Paperclip';
import dayjs, { type Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import { anexarDocumento, formatarTamanho } from '@/lib/documentos-entrega';
import type { Obrigacao } from '@/types/domain';

import { destinatariosPadrao, SeletorDestinatarios, useCanaisEnvio, useContatosDaEmpresa } from './documentos-entrega-dialog';

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
  // Entrega com documento (modelo Acessórias): anexa a guia/declaração e já
  // gera o protocolo para os contatos que recebem este departamento.
  const [arquivos, setArquivos] = React.useState<File[]>([]);
  const [destinatarios, setDestinatarios] = React.useState<Set<string>>(new Set());
  const inputArquivo = React.useRef<HTMLInputElement>(null);
  const contatos = useContatosDaEmpresa(obrigacao?.clienteId ?? null, open);
  const canais = useCanaisEnvio(open);
  const [enviarEmail, setEnviarEmail] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setTempoRealMinutos('');
      setEntregueEm(dayjs());
      setComentario(obrigacao?.tipo?.comentarioPadrao ?? '');
      setErro(null);
      setArquivos([]);
      setEnviarEmail(true);
    }
  }, [open, obrigacao]);

  React.useEffect(() => {
    if (contatos && obrigacao) setDestinatarios(destinatariosPadrao(contatos, obrigacao.setorId));
  }, [contatos, obrigacao]);

  if (!obrigacao) {
    return null;
  }

  const comEmail = (contatos ?? []).filter((c) => destinatarios.has(c.id) && c.email).length;

  async function confirmar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!obrigacao) {
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      // Anexa antes de concluir: se um upload falhar, a entrega não fica
      // marcada sem o documento.
      for (const arquivo of arquivos) await anexarDocumento(obrigacao.id, arquivo);
      if (arquivos.length > 0 && destinatarios.size > 0) {
        await api(`/obrigacoes/${obrigacao.id}/protocolos`, {
          method: 'POST',
          body: JSON.stringify({ contatoIds: [...destinatarios], enviarEmail: canais.email && enviarEmail }),
        });
      }
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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

            <Divider />
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Documentos para o cliente</Typography>
              <Button size="small" startIcon={<PaperclipIcon />} onClick={() => inputArquivo.current?.click()}>
                Anexar
              </Button>
              <input
                ref={inputArquivo}
                type="file"
                multiple
                hidden
                onChange={(event) => {
                  const novos = [...(event.target.files ?? [])];
                  setArquivos((atual) => [...atual, ...novos]);
                  event.target.value = '';
                }}
              />
            </Stack>
            {arquivos.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                Opcional. Anexe a guia/declaração para gerar o protocolo de entrega ao cliente.
              </Typography>
            ) : (
              <>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {arquivos.map((a, i) => (
                    <Chip
                      key={`${a.name}-${i}`}
                      size="small"
                      label={`${a.name} (${formatarTamanho(a.size)})`}
                      onDelete={() => setArquivos((atual) => atual.filter((_, j) => j !== i))}
                    />
                  ))}
                </Stack>
                <Typography variant="body2">
                  Enviar para (marcados os que recebem <strong>{obrigacao.setor.nome}</strong>):
                </Typography>
                <SeletorDestinatarios
                  contatos={contatos}
                  setorId={obrigacao.setorId}
                  selecionados={destinatarios}
                  onChange={setDestinatarios}
                />
                {canais.email ? (
                  <FormControlLabel
                    control={<Checkbox checked={enviarEmail} onChange={(event) => setEnviarEmail(event.target.checked)} />}
                    label={
                      <Typography variant="body2">
                        Enviar por e-mail agora ({comEmail} de {destinatarios.size} com e-mail)
                      </Typography>
                    }
                  />
                ) : null}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {arquivos.length > 0 && destinatarios.size > 0 ? 'Entregar e gerar protocolo' : 'Marcar como entregue'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
