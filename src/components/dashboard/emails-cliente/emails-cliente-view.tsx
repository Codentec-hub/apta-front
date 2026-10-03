'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { PODE_ALTERAR_PRAZOS } from '@/lib/obrigacao-status';
import type { ConfiguracaoEnvio } from '@/types/domain';

// "3, 1" → [3, 1]; null se tiver algo que não seja número de 0 a 60.
function lerDias(texto: string): number[] | null {
  const partes = texto
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const dias = partes.map(Number);
  if (dias.some((d) => !Number.isInteger(d) || d < 0 || d > 60)) return null;
  return [...new Set(dias)].sort((a, b) => b - a);
}

export function EmailsClienteView(): React.JSX.Element {
  const { user } = useUser();
  const podeEditar = Boolean(user && PODE_ALTERAR_PRAZOS.has(user.perfil));

  const [config, setConfig] = React.useState<ConfiguracaoEnvio | null>(null);
  const [dias, setDias] = React.useState('');
  const [prefixo, setPrefixo] = React.useState('');
  const [aviso, setAviso] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [salvo, setSalvo] = React.useState(false);

  function aplicar(c: ConfiguracaoEnvio): void {
    setConfig(c);
    setDias(c.diasAlertaNaoLida.join(', '));
    setPrefixo(c.prefixoAlertaNaoLida);
    setAviso(c.avisoCabecalho ?? '');
  }

  React.useEffect(() => {
    api<ConfiguracaoEnvio>('/configuracoes/envio')
      .then(aplicar)
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar a configuração'));
  }, []);

  const diasLidos = lerDias(dias);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!diasLidos) return;
    setSalvando(true);
    setErro(null);
    try {
      aplicar(
        await api<ConfiguracaoEnvio>('/configuracoes/envio', {
          method: 'PUT',
          body: JSON.stringify({ diasAlertaNaoLida: diasLidos, prefixoAlertaNaoLida: prefixo, avisoCabecalho: aviso }),
        })
      );
      setSalvo(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">E-mails ao cliente</Typography>
        <Typography color="text.secondary" variant="body2">
          Configuração do envio das guias e declarações por e-mail e do lembrete de guia não lida.
        </Typography>
      </Stack>

      {erro ? <Alert severity="error">{erro}</Alert> : null}
      {config && !config.emailConfigurado ? (
        <Alert severity="warning">
          O envio por e-mail ainda não está ligado no servidor (falta a chave do serviço de e-mail). Enquanto isso, nem o protocolo
          nem os lembretes são enviados automaticamente.
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
        <Stack component="form" spacing={3} onSubmit={salvar}>
          <Stack spacing={0.5}>
            <Typography variant="h6">Lembrete de guia não lida</Typography>
            <Typography color="text.secondary" variant="body2">
              Vale para as obrigações com <strong>Alerta guia não-lida? = Sim</strong>. Se o cliente recebeu o protocolo por e-mail e
              ainda não abriu o documento, ele recebe um lembrete nos dias escolhidos antes do vencimento.
            </Typography>
          </Stack>
          <TextField
            label="Dias antes do vencimento"
            value={dias}
            onChange={(event) => setDias(event.target.value)}
            disabled={!podeEditar || !config}
            error={diasLidos === null}
            helperText={
              diasLidos === null
                ? 'Use números de 0 a 60 separados por vírgula'
                : diasLidos.length === 0
                  ? 'Sem dias: nenhum lembrete será enviado'
                  : `Lembretes ${diasLidos.map((d) => (d === 0 ? 'no dia do vencimento' : `${d} dia(s) antes`)).join(', ')}`
            }
            fullWidth
          />
          <TextField
            label="Prefixo do assunto"
            value={prefixo}
            onChange={(event) => setPrefixo(event.target.value)}
            disabled={!podeEditar || !config}
            helperText={`Exemplo: ${prefixo.trim() ? `${prefixo.trim()} ` : ''}DAS - Simples Nacional 09/2026 — Empresa Ltda`}
            slotProps={{ htmlInput: { maxLength: 60 } }}
            fullWidth
          />
          <TextField
            label="Aviso no topo do e-mail (opcional)"
            value={aviso}
            onChange={(event) => setAviso(event.target.value)}
            disabled={!podeEditar || !config}
            helperText="Texto em destaque no início do lembrete. Ex.: Evite multa: o pagamento vence em breve."
            slotProps={{ htmlInput: { maxLength: 500 } }}
            multiline
            minRows={2}
            fullWidth
          />
          {podeEditar ? (
            <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" disabled={salvando || !config || diasLidos === null}>
                Salvar
              </Button>
            </Stack>
          ) : (
            <Typography color="text.secondary" variant="caption">
              Apenas administradores e gestores podem alterar.
            </Typography>
          )}
        </Stack>
      </Paper>

      <Snackbar open={salvo} autoHideDuration={3000} onClose={() => setSalvo(false)} message="Configuração salva" />
    </Stack>
  );
}
