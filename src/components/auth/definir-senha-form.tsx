'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api, setToken } from '@/lib/api';
import { paths } from '@/paths';
import { useUser } from '@/hooks/use-user';

interface InfoLink {
  tipo: 'CONVITE' | 'REDEFINICAO';
  nome: string;
  email: string;
}

/** Página do link do convite / da redefinição: cria a senha e já entra. */
export function DefinirSenhaForm(): React.JSX.Element {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const { checkSession } = useUser();
  const [info, setInfo] = React.useState<InfoLink | null>(null);
  const [invalido, setInvalido] = React.useState<string | null>(null);
  const [senha, setSenha] = React.useState('');
  const [confirmar, setConfirmar] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      setInvalido('Link incompleto. Abra o link exatamente como você recebeu.');
      return;
    }
    api<InfoLink>(`/auth/acesso/${encodeURIComponent(token)}`)
      .then(setInfo)
      .catch((error: unknown) => setInvalido(error instanceof Error ? error.message : 'Este link não vale mais.'));
  }, [token]);

  async function salvar(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres');
      return;
    }
    if (senha !== confirmar) {
      setErro('A confirmação não confere com a senha');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const r = await api<{ token: string }>(`/auth/acesso/${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify({ senha }),
      });
      setToken(r.token);
      await checkSession?.();
      router.replace(paths.dashboard.overview);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar a senha');
      setSalvando(false);
    }
  }

  if (invalido) {
    return (
      <Stack spacing={2}>
        <Typography variant="h5">Link inválido</Typography>
        <Alert severity="warning">{invalido}</Alert>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
          <Link component={RouterLink} href={paths.auth.esqueciSenha} variant="body2">
            Pedir um link novo
          </Link>
          <Link component={RouterLink} href={paths.auth.signIn} variant="body2">
            Ir para o login
          </Link>
        </Stack>
      </Stack>
    );
  }
  if (!info) {
    return (
      <Stack sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const convite = info.tipo === 'CONVITE';
  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h5">{convite ? `Bem-vindo(a), ${info.nome.split(' ')[0]}!` : 'Criar nova senha'}</Typography>
        <Typography variant="body2" color="text.secondary">
          {convite ? 'Crie sua senha para entrar no sistema.' : 'Escolha uma nova senha para a sua conta.'} Seu login é{' '}
          <strong>{info.email}</strong>.
        </Typography>
      </Stack>
      <Stack component="form" spacing={2} onSubmit={salvar}>
        {/* campo oculto: ajuda o gerenciador de senhas a salvar com o e-mail certo */}
        <input type="email" name="username" autoComplete="username" value={info.email} readOnly hidden />
        <TextField
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          helperText="Pelo menos 8 caracteres."
          autoFocus
          fullWidth
        />
        <TextField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          fullWidth
        />
        {erro ? <Alert severity="error">{erro}</Alert> : null}
        <Button type="submit" variant="contained" disabled={salvando}>
          {salvando ? 'Salvando…' : convite ? 'Criar senha e entrar' : 'Salvar e entrar'}
        </Button>
      </Stack>
    </Stack>
  );
}
