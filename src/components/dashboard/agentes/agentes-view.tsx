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
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import type { AgenteIA, Setor } from '@/types/domain';
import { api } from '@/lib/api';
import { PODE_ALTERAR_PRAZOS } from '@/lib/obrigacao-status';
import { useUser } from '@/hooks/use-user';

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
