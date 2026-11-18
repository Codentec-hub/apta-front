'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Checkbox from '@mui/material/Checkbox';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import { api } from '@/lib/api';
import type { LinkAcesso, Perfil, Setor, Usuario } from '@/types/domain';

export interface UsuarioFormDialogProps {
  open: boolean;
  usuario: Usuario | null;
  setores: Setor[];
  onClose: () => void;
  onSaved: (usuario: Usuario, acesso?: LinkAcesso) => void;
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
  convite: boolean;
  trocaObrigatoria: boolean;
}

const VAZIO: FormState = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'OPERACIONAL',
  setorId: '',
  convite: true,
  trocaObrigatoria: true,
};

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
        convite: false,
        trocaObrigatoria: true,
      });
    } else {
      setForm(VAZIO);
    }
    setErro(null);
  }, [open, usuario]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const precisaSenha = !usuario && !form.convite;
    if (!form.nome.trim() || !form.email.trim() || (precisaSenha && form.senha.length < 8)) {
      setErro(precisaSenha ? 'Nome, e-mail e senha (mín. 8 caracteres) são obrigatórios' : 'Nome e e-mail são obrigatórios');
      return;
    }
    if (form.senha.length > 0 && form.senha.length < 8) {
      setErro('A nova senha precisa ter pelo menos 8 caracteres');
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
              ...(form.senha ? { senha: form.senha, trocaObrigatoria: form.trocaObrigatoria } : {}),
            }),
          })
        : await api<Usuario & { acesso?: LinkAcesso }>('/usuarios', {
            method: 'POST',
            body: JSON.stringify({
              nome: form.nome.trim(),
              email: form.email.trim(),
              perfil: form.perfil,
              setorId: form.setorId || null,
              ...(form.convite
                ? { convite: true }
                : { senha: form.senha, trocaObrigatoria: form.trocaObrigatoria }),
            }),
          });
      const { acesso, ...dados } = salvo as Usuario & { acesso?: LinkAcesso };
      onSaved(dados, acesso);
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
            {usuario ? null : (
              <FormControl>
                <FormLabel>Como a pessoa vai entrar</FormLabel>
                <RadioGroup
                  value={form.convite ? 'convite' : 'senha'}
                  onChange={(e) => setForm((f) => ({ ...f, convite: e.target.value === 'convite' }))}
                >
                  <FormControlLabel
                    value="convite"
                    control={<Radio />}
                    label="Enviar convite: a pessoa recebe um link e cria a própria senha"
                  />
                  <FormControlLabel value="senha" control={<Radio />} label="Definir uma senha provisória agora" />
                </RadioGroup>
              </FormControl>
            )}
            {usuario || !form.convite ? (
              <TextField
                label={usuario ? 'Nova senha (opcional)' : 'Senha provisória'}
                type="password"
                autoComplete="new-password"
                value={form.senha}
                onChange={(event) => setForm((f) => ({ ...f, senha: event.target.value }))}
                required={!usuario}
                helperText={
                  usuario
                    ? 'Preencha só para redefinir a senha (mín. 8 caracteres). Para a pessoa criar a própria, use o botão de link na lista.'
                    : 'Mínimo 8 caracteres'
                }
                fullWidth
              />
            ) : null}
            {(usuario && form.senha) || (!usuario && !form.convite) ? (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.trocaObrigatoria}
                    onChange={(e) => setForm((f) => ({ ...f, trocaObrigatoria: e.target.checked }))}
                  />
                }
                label="Pedir para trocar a senha no primeiro acesso"
              />
            ) : null}
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
            {usuario ? 'Salvar alterações' : form.convite ? 'Criar e gerar convite' : 'Criar usuário'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
