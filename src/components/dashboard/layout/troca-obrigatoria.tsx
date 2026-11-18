'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

/** Senha provisória (definida pelo administrador): só segue depois de trocar. */
export function TrocaObrigatoria(): React.JSX.Element | null {
  const { user, checkSession } = useUser();
  const router = useRouter();
  const [atual, setAtual] = React.useState('');
  const [nova, setNova] = React.useState('');
  const [confirmar, setConfirmar] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);

  if (!user?.trocaObrigatoria) return null;

  async function salvar(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (nova.length < 8) {
      setErro('A nova senha precisa ter pelo menos 8 caracteres');
      return;
    }
    if (nova !== confirmar) {
      setErro('A confirmação não confere com a nova senha');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await api('/auth/senha', { method: 'POST', body: JSON.stringify({ senhaAtual: atual, novaSenha: nova }) });
      await checkSession?.();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível trocar a senha');
    } finally {
      setSalvando(false);
    }
  }

  async function sair(): Promise<void> {
    await authClient.signOut();
    await checkSession?.();
    router.refresh();
  }

  return (
    <Dialog open fullWidth maxWidth="xs" disableEscapeKeyDown>
      <Stack component="form" onSubmit={salvar}>
        <DialogTitle>Crie sua senha</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Você entrou com uma senha provisória. Para continuar, escolha uma senha só sua.
            </Typography>
            <input type="email" name="username" autoComplete="username" value={user.email} readOnly hidden />
            <TextField
              label="Senha provisória"
              type="password"
              autoComplete="current-password"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              helperText="Pelo menos 8 caracteres."
              fullWidth
            />
            <TextField
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              fullWidth
            />
            {erro ? <Alert severity="error">{erro}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => void sair()}>
            Sair
          </Button>
          <Button type="submit" variant="contained" disabled={salvando || !atual}>
            {salvando ? 'Salvando…' : 'Salvar senha'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
