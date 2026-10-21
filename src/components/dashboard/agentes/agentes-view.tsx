'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { ArrowSquareOutIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import type { AgenteIA, ConfiguracaoEvolution, ConfiguracaoGemini, Setor } from '@/types/domain';
import { api } from '@/lib/api';
import { PODE_ALTERAR_PRAZOS } from '@/lib/obrigacao-status';
import { useUser } from '@/hooks/use-user';

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
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack component="form" spacing={3} onSubmit={salvar}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="h6">Agente Apta (Gemini)</Typography>
          {config ? chipOrigem(config.origem) : null}
        </Stack>
        <Typography color="text.secondary" variant="body2">
          Motor de resposta automática do atendimento por WhatsApp. Usa a API do Gemini (Google) com as instruções de cada
          agente, cadastradas abaixo.
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
  const [urlPainel, setUrlPainel] = React.useState('');
  const [erro, setErro] = React.useState<string | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [salvo, setSalvo] = React.useState(false);

  const carregar = React.useCallback(() => {
    api<ConfiguracaoEvolution>('/configuracoes/evolution')
      .then((c) => {
        setConfig(c);
        setUrl(c.url ?? '');
        setInstancia(c.instancia ?? '');
        setUrlPainel(c.urlPainel ?? '');
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
          urlPainel: urlPainel.trim() || undefined,
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

  const baseUrlPainel = urlPainel.trim() || url.trim();

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack component="form" spacing={3} onSubmit={salvar}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="h6">WhatsApp (Evolution API)</Typography>
            {config ? chipOrigem(config.origem) : null}
          </Stack>
          <Button
            component="a"
            href={baseUrlPainel ? `${baseUrlPainel.replace(/\/+$/, '')}/manager` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            startIcon={<ArrowSquareOutIcon />}
            disabled={!baseUrlPainel}
          >
            Abrir painel
          </Button>
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
          helperText="Usada pelo sistema pra enviar mensagens. Pode ser um endereço interno (ex.: rede do servidor), que não abre no navegador."
          fullWidth
        />
        <TextField
          label="URL do painel (Manager)"
          value={urlPainel}
          onChange={(e) => setUrlPainel(e.target.value)}
          disabled={!podeEditar || !config}
          placeholder="https://..."
          helperText="Endereço público, só pra abrir o painel de administração (botão acima). Deixe em branco se a URL da instância já for pública."
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

interface AgenteFormDialogProps {
  open: boolean;
  agente: AgenteIA | null;
  setores: Setor[];
  onClose: () => void;
  onSaved: () => void;
}

function AgenteFormDialog({ open, agente, setores, onClose, onSaved }: AgenteFormDialogProps): React.JSX.Element {
  const [nome, setNome] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [setorId, setSetorId] = React.useState('');
  const [instrucoes, setInstrucoes] = React.useState('');
  const [ativo, setAtivo] = React.useState(true);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setNome(agente?.nome ?? '');
    setDescricao(agente?.descricao ?? '');
    setSetorId(agente?.setorId ?? '');
    setInstrucoes(agente?.instrucoes ?? '');
    setAtivo(agente?.ativo ?? true);
    setErro(null);
  }, [open, agente]);

  async function salvar(): Promise<void> {
    setSalvando(true);
    setErro(null);
    try {
      await api(agente ? `/agentes/${agente.id}` : '/agentes', {
        method: agente ? 'PUT' : 'POST',
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          setorId: setorId || null,
          instrucoes,
          ativo,
        }),
      });
      onSaved();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar agente');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{agente ? 'Editar agente' : 'Novo agente'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Nome"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              fullWidth
              placeholder="Ex.: Contador"
            />
            <FormControl fullWidth>
              <InputLabel id="agente-setor">Setor</InputLabel>
              <Select labelId="agente-setor" label="Setor" value={setorId} onChange={(e) => setSetorId(e.target.value)}>
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {setores.map((setor) => (
                  <MenuItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <TextField
            label="Descrição curta"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Aparece na hora de escolher o agente na conversa"
          />
          <TextField
            label="Instruções do agente"
            multiline
            minRows={10}
            value={instrucoes}
            onChange={(e) => setInstrucoes(e.target.value)}
            placeholder="Quem é o agente, como deve falar com o cliente, o que pode e o que não pode responder, quando passar para um humano…"
            slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 13 } } }}
          />
          <FormControlLabel
            control={<Switch checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />}
            label="Ativo"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!nome.trim() || salvando} onClick={() => void salvar()}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AgentesView(): React.JSX.Element {
  const { user } = useUser();
  const podeEditar = Boolean(user && PODE_ALTERAR_PRAZOS.has(user.perfil));

  const [agentes, setAgentes] = React.useState<AgenteIA[]>([]);
  const [setores, setSetores] = React.useState<Setor[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [editando, setEditando] = React.useState<AgenteIA | null>(null);

  const carregar = React.useCallback(() => {
    setCarregando(true);
    Promise.all([api<AgenteIA[]>('/agentes'), api<Setor[]>('/setores')])
      .then(([a, s]) => {
        setAgentes(a);
        setSetores(s);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar agentes'))
      .finally(() => setCarregando(false));
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h4">Agentes de IA</Typography>
          <Typography color="text.secondary" variant="body2">
            Os agentes do &quot;Agente Apta&quot; que podem assumir conversas do WhatsApp no lugar de um atendente.
          </Typography>
        </Stack>
        {podeEditar ? (
          <Button
            variant="contained"
            startIcon={<PlusIcon />}
            onClick={() => {
              setEditando(null);
              setDialogAberto(true);
            }}
          >
            Novo agente
          </Button>
        ) : null}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">Configuração do motor</Typography>
        <GeminiSection podeEditar={podeEditar} />
        <EvolutionSection podeEditar={podeEditar} />
      </Stack>

      <Alert severity="info">
        O cadastro já vale para escolher o agente na conversa. As respostas automáticas começam quando o motor do Agente
        Apta for ligado.
      </Alert>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Setor</TableCell>
              <TableCell>Situação</TableCell>
              {podeEditar ? <TableCell align="right" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {agentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" variant="body2">
                    {carregando ? 'Carregando…' : 'Nenhum agente cadastrado.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              agentes.map((agente) => (
                <TableRow key={agente.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{agente.nome}</TableCell>
                  <TableCell>{agente.descricao ?? '—'}</TableCell>
                  <TableCell>{agente.setor?.nome ?? 'Todos'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={agente.ativo ? 'Ativo' : 'Inativo'}
                      color={agente.ativo ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  {podeEditar ? (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditando(agente);
                          setDialogAberto(true);
                        }}
                      >
                        <PencilSimpleIcon />
                      </IconButton>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AgenteFormDialog
        open={dialogAberto}
        agente={editando}
        setores={setores}
        onClose={() => setDialogAberto(false)}
        onSaved={() => {
          setDialogAberto(false);
          carregar();
        }}
      />

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
