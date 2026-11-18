'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import { paths } from '@/paths';

export function EsqueciSenhaForm(): React.JSX.Element {
  const [email, setEmail] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [resultado, setResultado] = React.useState<{ emailLigado: boolean } | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  async function enviar(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErro('Informe um e-mail válido');
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      setResultado(
        await api<{ emailLigado: boolean }>('/auth/esqueci-senha', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim() }),
        })
      );
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar o pedido');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h5">Esqueci minha senha</Typography>
        <Typography variant="body2" color="text.secondary">
          Informe o e-mail que você usa para entrar no sistema.
        </Typography>
      </Stack>
      {resultado ? (
        <Alert severity="success">
          {resultado.emailLigado
            ? 'Se o e-mail estiver cadastrado, você vai receber em instantes um link para criar uma nova senha. O link vale por 2 horas. Confira também a caixa de spam.'
            : 'Pedido registrado. O administrador do sistema foi avisado e vai te mandar um link para criar uma nova senha.'}
        </Alert>
      ) : (
        <Stack component="form" spacing={2} onSubmit={enviar}>
          <TextField
            label="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            fullWidth
          />
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Button type="submit" variant="contained" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar link'}
          </Button>
        </Stack>
      )}
      <Link component={RouterLink} href={paths.auth.signIn} variant="body2" sx={{ alignSelf: 'center' }}>
        Voltar para o login
      </Link>
    </Stack>
  );
}
