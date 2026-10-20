'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { PODE_ALTERAR_PRAZOS } from '@/lib/obrigacao-status';
import type { ConfiguracaoEvolution, ConfiguracaoGemini } from '@/types/domain';

function chipOrigem(origem: 'banco' | 'ambiente' | 'nenhuma'): React.JSX.Element {
  if (origem === 'banco') return <Chip label="Configurado por aqui" color="success" size="small" variant="outlined" />;
  if (origem === 'ambiente') return <Chip label="Configurado no servidor" color="info" size="small" variant="outlined" />;
  return <Chip label="Não configurado" color="warning" size="small" variant="outlined" />;
}

function GeminiSection({ podeEditar }: { podeEditar: boolean }): React.JSX.Element {
  const [config, setConfig] = React.useState<ConfiguracaoGemini | null>(null);
  const [modelo, setModelo] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [salvo, setSalvo] = React.useState(false);

  const carregar = React.useCallback(() => {
    api<ConfiguracaoGemini>('/configuracoes/gemini')
      .then((c) => {
        setConfig(c);
        setModelo(c.modelo);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar'));
  }, []);

  React.useEffect(carregar, [carregar]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await api('/configuracoes/gemini', {
        method: 'PUT',
        body: JSON.stringify({ modelo: modelo.trim() || undefined, apiKey: apiKey.trim() || undefined }),
      });
      setApiKey('');
      carregar();
      setSalvo(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
      <Stack component="form" spacing={3} onSubmit={salvar}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="h6">Agente Apta (Gemini)</Typography>
          {config ? chipOrigem(config.origem) : null}
        </Stack>
        <Typography color="text.secondary" variant="body2">
          Motor de resposta automática do atendimento por WhatsApp. Usa a API do Gemini (Google) com as instruções cadastradas em
          cada agente, em Configurações → Agentes de IA.
        </Typography>
        {erro ? <Alert severity="error">{erro}</Alert> : null}
        <TextField
          label="Modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          disabled={!podeEditar || !config}
          helperText="Ex.: gemini-flash-latest"
          fullWidth
        />
        <TextField
          label="Chave de API"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={!podeEditar || !config}
          placeholder={config?.apiKeyMascarada ?? 'Nenhuma chave configurada'}
          helperText="Deixe em branco para manter a chave atual. Gerada em aistudio.google.com → Get API key."
          fullWidth
        />
        {podeEditar ? (
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" disabled={salvando || !config}>
              Salvar
            </Button>
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="caption">
            Apenas administradores e gestores podem alterar.
          </Typography>
        )}
      </Stack>
      <Snackbar open={salvo} autoHideDuration={3000} onClose={() => setSalvo(false)} message="Configuração salva" />
    </Paper>
  );
}

function EvolutionSection({ podeEditar }: { podeEditar: boolean }): React.JSX.Element {
  const [config, setConfig] = React.useState<ConfiguracaoEvolution | null>(null);
  const [url, setUrl] = React.useState('');
  const [instancia, setInstancia] = React.useState('');
  const [apiKey, setApiKey] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [salvo, setSalvo] = React.useState(false);

  const carregar = React.useCallback(() => {
    api<ConfiguracaoEvolution>('/configuracoes/evolution')
      .then((c) => {
        setConfig(c);
        setUrl(c.url ?? '');
        setInstancia(c.instancia ?? '');
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar'));
  }, []);

  React.useEffect(carregar, [carregar]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await api('/configuracoes/evolution', {
        method: 'PUT',
        body: JSON.stringify({
          url: url.trim() || undefined,
          instancia: instancia.trim() || undefined,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      setApiKey('');
      carregar();
      setSalvo(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
      <Stack component="form" spacing={3} onSubmit={salvar}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="h6">WhatsApp (Evolution API)</Typography>
          {config ? chipOrigem(config.origem) : null}
        </Stack>
        <Typography color="text.secondary" variant="body2">
          Instância própria (self-hosted) que conecta o número de WhatsApp do atendimento ao sistema.
        </Typography>
        {erro ? <Alert severity="error">{erro}</Alert> : null}
        <TextField
          label="URL da instância"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={!podeEditar || !config}
          placeholder="https://..."
          fullWidth
        />
        <TextField
          label="Nome da instância"
          value={instancia}
          onChange={(e) => setInstancia(e.target.value)}
          disabled={!podeEditar || !config}
          placeholder="apta"
          fullWidth
        />
        <TextField
          label="Chave de API"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={!podeEditar || !config}
          placeholder={config?.apiKeyMascarada ?? 'Nenhuma chave configurada'}
          helperText="Deixe em branco para manter a chave atual. É a Authentication API Key da instância."
          fullWidth
        />
        {podeEditar ? (
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" disabled={salvando || !config}>
              Salvar
            </Button>
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="caption">
            Apenas administradores e gestores podem alterar.
          </Typography>
        )}
      </Stack>
      <Snackbar open={salvo} autoHideDuration={3000} onClose={() => setSalvo(false)} message="Configuração salva" />
    </Paper>
  );
}

export function AutomacaoView(): React.JSX.Element {
  const { user } = useUser();
  const podeEditar = Boolean(user && PODE_ALTERAR_PRAZOS.has(user.perfil));

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">Agentes e IA</Typography>
        <Typography color="text.secondary" variant="body2">
          Configuração básica das ferramentas de automação e inteligência artificial usadas pelo sistema. Para cadastrar os
          agentes em si (instruções, setor), veja Configurações → Agentes de IA.
        </Typography>
      </Stack>
      <GeminiSection podeEditar={podeEditar} />
      <EvolutionSection podeEditar={podeEditar} />
    </Stack>
  );
}
