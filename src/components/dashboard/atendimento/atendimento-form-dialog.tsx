'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import type { Atendimento, Cliente, Setor, UsuarioResumo } from '@/types/domain';

export interface AtendimentoFormDialogProps {
  open: boolean;
  atendimento: Atendimento | null;
  clientes: Cliente[];
  setores: Setor[];
  usuarios: UsuarioResumo[];
  clientePreSelecionado?: Cliente | null;
  onClose: () => void;
  onSaved: (atendimento: Atendimento) => void;
}

export function AtendimentoFormDialog({
  open,
  atendimento,
  clientes,
  setores,
  usuarios,
  clientePreSelecionado,
  onClose,
  onSaved,
}: AtendimentoFormDialogProps): React.JSX.Element {
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [setorId, setSetorId] = React.useState('');
  const [motivo, setMotivo] = React.useState('');
  const [observacoes, setObservacoes] = React.useState('');
  const [responsavelId, setResponsavelId] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  const responsavelSugerido = React.useMemo(() => {
    if (!cliente || !setorId) {
      return null;
    }
    const vinculo = cliente.responsaveis.find((r) => r.setorId === setorId);
    return vinculo ? vinculo.usuario.nome : null;
  }, [cliente, setorId]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    if (atendimento) {
      setCliente(clientes.find((c) => c.id === atendimento.clienteId) ?? null);
      setSetorId(atendimento.setorId);
      setMotivo(atendimento.motivo);
      setObservacoes(atendimento.observacoes ?? '');
      setResponsavelId(atendimento.responsavelId ?? '');
    } else {
      setCliente(clientePreSelecionado ?? null);
      setSetorId('');
      setMotivo('');
      setObservacoes('');
      setResponsavelId('');
    }
    setErro(null);
  }, [open, atendimento, clientes, clientePreSelecionado]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!cliente || !setorId || !motivo.trim()) {
      setErro('Cliente, setor e motivo são obrigatórios');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const salvo = atendimento
        ? await api<Atendimento>(`/atendimentos/${atendimento.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              motivo: motivo.trim(),
              observacoes: observacoes.trim() || null,
              setorId,
              responsavelId: responsavelId || null,
            }),
          })
        : await api<Atendimento>('/atendimentos', {
            method: 'POST',
            body: JSON.stringify({
              clienteId: cliente.id,
              setorId,
              motivo: motivo.trim(),
              observacoes: observacoes.trim() || null,
              responsavelId: responsavelId || null,
            }),
          });
      onSaved(salvo);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar atendimento');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{atendimento ? 'Editar atendimento' : 'Novo atendimento'}</DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <Autocomplete
              options={clientes}
              value={cliente}
              disabled={Boolean(atendimento)}
              getOptionLabel={(option) => `${option.razaoSocial} — ${option.cnpj}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, value) => setCliente(value)}
              renderInput={(params) => <TextField {...params} label="Cliente" required />}
            />
            <FormControl fullWidth required>
              <InputLabel id="atendimento-setor-label">Setor</InputLabel>
              <Select
                labelId="atendimento-setor-label"
                label="Setor"
                value={setorId}
                onChange={(event) => setSetorId(event.target.value)}
              >
                {setores.map((setor) => (
                  <MenuItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Motivo do contato"
              placeholder="Ex.: Solicitação de extrato bancário"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Observações (opcional)"
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="atendimento-responsavel-label">Responsável</InputLabel>
              <Select
                labelId="atendimento-responsavel-label"
                label="Responsável"
                value={responsavelId}
                onChange={(event) => setResponsavelId(event.target.value)}
              >
                <MenuItem value="">
                  <em>{responsavelSugerido ? `Automático (${responsavelSugerido})` : 'Nenhum'}</em>
                </MenuItem>
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {responsavelSugerido && !atendimento ? (
              <Typography color="text.secondary" variant="caption">
                Deixe em branco para direcionar automaticamente para {responsavelSugerido}, o responsável desse
                cliente nesse setor.
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {atendimento ? 'Salvar alterações' : 'Abrir atendimento'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
