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

import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';

const PERFIL: Record<string, string> = { ADMIN: 'Administrador', GESTOR: 'Gestor', OPERACIONAL: 'Operacional' };

export function MinhaContaDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element {
  const { user, checkSession } = useUser();
  const [nome, setNome] = React.useState('');
  const [senhaAtual, setSenhaAtual] = React.useState('');
  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmar, setConfirmar] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setNome(user?.nome ?? '');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmar('');
    setErro(null);
    setOk(null);
  }, [open, user?.nome]);

  const trocandoSenha = Boolean(senhaAtual || novaSenha || confirmar);

  async function salvar(): Promise<void> {
    setErro(null);
    setOk(null);
    if (!nome.trim()) {
      setErro('Informe seu nome');
      return;
    }
    if (trocandoSenha) {
      if (novaSenha.length < 8) {
        setErro('A nova senha precisa ter pelo menos 8 caracteres');
        return;
      }
      if (novaSenha !== confirmar) {
        setErro('A confirmação não confere com a nova senha');
        return;
      }
    }
    setSalvando(true);
    try {
      if (nome.trim() !== user?.nome) {
        await api('/auth/me', { method: 'PUT', body: JSON.stringify({ nome: nome.trim() }) });
        await checkSession?.();
      }
      if (trocandoSenha) {
        await api('/auth/senha', { method: 'POST', body: JSON.stringify({ senhaAtual, novaSenha }) });
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmar('');
      }
      setOk(trocandoSenha ? 'Dados e senha atualizados.' : 'Dados atualizados.');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Minha conta</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} fullWidth />
          <TextField
            label="E-mail"
            value={user?.email ?? ''}
            disabled
            fullWidth
            helperText="Para trocar o e-mail, fale com o administrador."
          />
          <Typography variant="body2" color="text.secondary">
            Perfil: {PERFIL[user?.perfil ?? ''] ?? user?.perfil}
            {user?.setor ? ` · ${user.setor.nome}` : ''}
          </Typography>
          <Divider />
          <Typography variant="subtitle2">Trocar senha</Typography>
          <TextField
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            fullWidth
          />
          <TextField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            fullWidth
            helperText="Pelo menos 8 caracteres."
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
          {ok ? <Alert severity="success">{ok}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
        <Button variant="contained" onClick={() => void salvar()} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
