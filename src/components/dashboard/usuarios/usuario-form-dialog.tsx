'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
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
import type { Perfil, Setor, Usuario } from '@/types/domain';

export interface UsuarioFormDialogProps {
  open: boolean;
  usuario: Usuario | null;
  setores: Setor[];
  onClose: () => void;
  onSaved: (usuario: Usuario) => void;
}

const PERFIS: { value: Perfil; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'OPERACIONAL', label: 'Operacional' },
];

interface FormState {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
  setorId: string;
}

const VAZIO: FormState = { nome: '', email: '', senha: '', perfil: 'OPERACIONAL', setorId: '' };

export function UsuarioFormDialog({
  open,
  usuario,
  setores,
  onClose,
  onSaved,
}: UsuarioFormDialogProps): React.JSX.Element {
  const [form, setForm] = React.useState<FormState>(VAZIO);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    if (usuario) {
      setForm({
        nome: usuario.nome,
        email: usuario.email,
        senha: '',
        perfil: usuario.perfil,
        setorId: usuario.setorId ?? '',
      });
    } else {
      setForm(VAZIO);
    }
    setErro(null);
  }, [open, usuario]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || (!usuario && form.senha.length < 6)) {
      setErro(usuario ? 'Nome e e-mail são obrigatórios' : 'Nome, e-mail e senha (mín. 6 caracteres) são obrigatórios');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const salvo = usuario
        ? await api<Usuario>(`/usuarios/${usuario.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              nome: form.nome.trim(),
              perfil: form.perfil,
              setorId: form.setorId || null,
              ...(form.senha ? { senha: form.senha } : {}),
            }),
          })
        : await api<Usuario>('/usuarios', {
            method: 'POST',
            body: JSON.stringify({
              nome: form.nome.trim(),
              email: form.email.trim(),
              senha: form.senha,
              perfil: form.perfil,
              setorId: form.setorId || null,
            }),
          });
      onSaved(salvo);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{usuario ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <TextField
              label="Nome"
              value={form.nome}
              onChange={(event) => setForm((f) => ({ ...f, nome: event.target.value }))}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
              required
              disabled={Boolean(usuario)}
              helperText={usuario ? 'O e-mail não pode ser alterado' : undefined}
              fullWidth
            />
            <TextField
              label={usuario ? 'Nova senha (opcional)' : 'Senha'}
              type="password"
              value={form.senha}
              onChange={(event) => setForm((f) => ({ ...f, senha: event.target.value }))}
              required={!usuario}
              helperText="Mínimo 6 caracteres"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="perfil-label">Perfil</InputLabel>
              <Select
                labelId="perfil-label"
                label="Perfil"
                value={form.perfil}
                onChange={(event) => setForm((f) => ({ ...f, perfil: event.target.value as Perfil }))}
              >
                {PERFIS.map((perfil) => (
                  <MenuItem key={perfil.value} value={perfil.value}>
                    {perfil.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="setor-usuario-label">Setor</InputLabel>
              <Select
                labelId="setor-usuario-label"
                label="Setor"
                value={form.setorId}
                onChange={(event) => setForm((f) => ({ ...f, setorId: event.target.value }))}
              >
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
                {setores.map((setor) => (
                  <MenuItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {usuario ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
