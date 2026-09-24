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

import { api } from '@/lib/api';
import type { Cliente, Demanda, Setor, UsuarioResumo } from '@/types/domain';

export interface DemandaFormDialogProps {
  open: boolean;
  demanda: Demanda | null;
  setores: Setor[];
  clientes: Cliente[];
  usuarios: UsuarioResumo[];
  clientePreSelecionado?: Cliente | null;
  onClose: () => void;
  onSaved: (demanda: Demanda) => void;
}

export function DemandaFormDialog({
  open,
  demanda,
  setores,
  clientes,
  usuarios,
  clientePreSelecionado,
  onClose,
  onSaved,
}: DemandaFormDialogProps): React.JSX.Element {
  const [titulo, setTitulo] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [setorId, setSetorId] = React.useState('');
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [responsavelId, setResponsavelId] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    if (demanda) {
      setTitulo(demanda.titulo);
      setDescricao(demanda.descricao ?? '');
      setSetorId(demanda.setorId);
      setCliente(clientes.find((c) => c.id === demanda.clienteId) ?? null);
      setResponsavelId(demanda.responsavelId ?? '');
    } else {
      setTitulo('');
      setDescricao('');
      setSetorId('');
      setCliente(clientePreSelecionado ?? null);
      setResponsavelId('');
    }
    setErro(null);
  }, [open, demanda, clientes, clientePreSelecionado]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!titulo.trim() || !setorId) {
      setErro('Título e setor são obrigatórios');
      return;
    }

    setSalvando(true);
    setErro(null);

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      setorId,
      clienteId: cliente?.id ?? null,
      responsavelId: responsavelId || null,
    };

    try {
      const salvo = demanda
        ? await api<Demanda>(`/demandas/${demanda.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api<Demanda>('/demandas', { method: 'POST', body: JSON.stringify(payload) });
      onSaved(salvo);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar demanda');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{demanda ? 'Editar demanda' : 'Nova demanda'}</DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <TextField
              label="Título"
              placeholder="Ex.: Planejamento tributário 2027"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Descrição (opcional)"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel id="demanda-setor-label">Setor</InputLabel>
              <Select
                labelId="demanda-setor-label"
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
            <Autocomplete
              options={clientes}
              value={cliente}
              getOptionLabel={(option) => `${option.razaoSocial} — ${option.cnpj}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, value) => setCliente(value)}
              renderInput={(params) => <TextField {...params} label="Cliente (opcional)" />}
            />
            <FormControl fullWidth>
              <InputLabel id="demanda-responsavel-label">Responsável</InputLabel>
              <Select
                labelId="demanda-responsavel-label"
                label="Responsável"
                value={responsavelId}
                onChange={(event) => setResponsavelId(event.target.value)}
              >
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {demanda ? 'Salvar alterações' : 'Criar demanda'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
