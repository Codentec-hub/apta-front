'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import type { Cliente, Setor, UsuarioResumo } from '@/types/domain';

const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'];

export interface ClienteFormDialogProps {
  open: boolean;
  cliente: Cliente | null;
  setores: Setor[];
  usuarios: UsuarioResumo[];
  onClose: () => void;
  onSaved: (cliente: Cliente) => void;
}

interface FormState {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  regimeTributario: string;
}

const VAZIO: FormState = { razaoSocial: '', nomeFantasia: '', cnpj: '', regimeTributario: '' };

export function ClienteFormDialog({
  open,
  cliente,
  setores,
  usuarios,
  onClose,
  onSaved,
}: ClienteFormDialogProps): React.JSX.Element {
  const [form, setForm] = React.useState<FormState>(VAZIO);
  const [clienteAtual, setClienteAtual] = React.useState<Cliente | null>(cliente);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvandoResponsavelSetorId, setSalvandoResponsavelSetorId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setClienteAtual(cliente);
      setForm(
        cliente
          ? {
              razaoSocial: cliente.razaoSocial,
              nomeFantasia: cliente.nomeFantasia ?? '',
              cnpj: cliente.cnpj,
              regimeTributario: cliente.regimeTributario ?? '',
            }
          : VAZIO
      );
      setErro(null);
    }
  }, [open, cliente]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!form.razaoSocial.trim() || !form.cnpj.trim()) {
      setErro('Razão social e CNPJ são obrigatórios');
      return;
    }

    setSalvando(true);
    setErro(null);

    const payload = {
      razaoSocial: form.razaoSocial.trim(),
      nomeFantasia: form.nomeFantasia.trim() || null,
      cnpj: form.cnpj.trim(),
      regimeTributario: form.regimeTributario || null,
    };

    try {
      const salvo = clienteAtual
        ? await api<Cliente>(`/clientes/${clienteAtual.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(payload) });

      setClienteAtual(salvo);
      onSaved(salvo);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar cliente');
    } finally {
      setSalvando(false);
    }
  }

  async function alterarResponsavel(setorId: string, usuarioId: string): Promise<void> {
    if (!clienteAtual) {
      return;
    }
    setSalvandoResponsavelSetorId(setorId);
    setErro(null);
    try {
      await (usuarioId
        ? api(`/clientes/${clienteAtual.id}/responsaveis/${setorId}`, {
            method: 'PUT',
            body: JSON.stringify({ usuarioId }),
          })
        : api(`/clientes/${clienteAtual.id}/responsaveis/${setorId}`, { method: 'DELETE' }));
      const atualizado = await api<Cliente>(`/clientes/${clienteAtual.id}`);
      setClienteAtual(atualizado);
      onSaved(atualizado);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar responsável');
    } finally {
      setSalvandoResponsavelSetorId(null);
    }
  }

  function responsavelDoSetor(setorId: string): string {
    return clienteAtual?.responsaveis.find((r) => r.setorId === setorId)?.usuarioId ?? '';
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{clienteAtual ? 'Editar cliente' : 'Novo cliente'}</DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <TextField
              label="Razão social"
              value={form.razaoSocial}
              onChange={(event) => setForm((f) => ({ ...f, razaoSocial: event.target.value }))}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Nome fantasia"
              value={form.nomeFantasia}
              onChange={(event) => setForm((f) => ({ ...f, nomeFantasia: event.target.value }))}
              fullWidth
            />
            <TextField
              label="CNPJ"
              value={form.cnpj}
              onChange={(event) => setForm((f) => ({ ...f, cnpj: event.target.value }))}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="regime-label">Regime tributário</InputLabel>
              <Select
                labelId="regime-label"
                label="Regime tributário"
                value={form.regimeTributario}
                onChange={(event) => setForm((f) => ({ ...f, regimeTributario: event.target.value }))}
              >
                <MenuItem value="">
                  <em>Não definido</em>
                </MenuItem>
                {REGIMES.map((regime) => (
                  <MenuItem key={regime} value={regime}>
                    {regime}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {clienteAtual ? (
              <>
                <Divider />
                <Typography variant="subtitle2">Responsáveis por setor</Typography>
                <Stack spacing={2}>
                  {setores.map((setor) => (
                    <FormControl key={setor.id} fullWidth size="small">
                      <InputLabel id={`resp-${setor.id}`}>{setor.nome}</InputLabel>
                      <Select
                        labelId={`resp-${setor.id}`}
                        label={setor.nome}
                        value={responsavelDoSetor(setor.id)}
                        disabled={salvandoResponsavelSetorId === setor.id}
                        onChange={(event) => alterarResponsavel(setor.id, event.target.value)}
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
                  ))}
                </Stack>
              </>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Salve o cliente para poder atribuir os responsáveis por setor.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {clienteAtual ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
