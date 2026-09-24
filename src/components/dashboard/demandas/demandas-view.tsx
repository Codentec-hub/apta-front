'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';

import { api } from '@/lib/api';
import type { Cliente, Demanda, Setor, StatusDemanda, UsuarioResumo } from '@/types/domain';

import { DemandaFormDialog } from './demanda-form-dialog';

const COLUNAS: { status: StatusDemanda; titulo: string }[] = [
  { status: 'A_FAZER', titulo: 'A fazer' },
  { status: 'EM_ANDAMENTO', titulo: 'Em andamento' },
  { status: 'CONCLUIDA', titulo: 'Concluída' },
];

export function DemandasView(): React.JSX.Element {
  const [demandas, setDemandas] = React.useState<Demanda[]>([]);
  const [setores, setSetores] = React.useState<Setor[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioResumo[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);

  const [filtroSetorId, setFiltroSetorId] = React.useState('');
  const [colunaSobreposta, setColunaSobreposta] = React.useState<StatusDemanda | null>(null);

  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [demandaEmEdicao, setDemandaEmEdicao] = React.useState<Demanda | null>(null);

  const carregar = React.useCallback(() => {
    Promise.all([
      api<Demanda[]>('/demandas'),
      api<Setor[]>('/setores'),
      api<Cliente[]>('/clientes'),
      api<UsuarioResumo[]>('/usuarios'),
    ])
      .then(([demandasData, setoresData, clientesData, usuariosData]) => {
        setDemandas(demandasData);
        setSetores(setoresData);
        setClientes(clientesData);
        setUsuarios(usuariosData.filter((u) => u.ativo));
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar demandas'));
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  const demandasFiltradas = React.useMemo(
    () => demandas.filter((d) => !filtroSetorId || d.setorId === filtroSetorId),
    [demandas, filtroSetorId]
  );

  function abrirNova(): void {
    setDemandaEmEdicao(null);
    setDialogAberto(true);
  }

  function abrirEdicao(demanda: Demanda): void {
    setDemandaEmEdicao(demanda);
    setDialogAberto(true);
  }

  function aoSalvar(demanda: Demanda): void {
    setDemandas((atual) => {
      const existe = atual.some((d) => d.id === demanda.id);
      return existe ? atual.map((d) => (d.id === demanda.id ? demanda : d)) : [...atual, demanda];
    });
  }

  async function excluir(demanda: Demanda): Promise<void> {
    const anterior = demandas;
    setDemandas((atual) => atual.filter((d) => d.id !== demanda.id));
    try {
      await api(`/demandas/${demanda.id}`, { method: 'DELETE' });
    } catch (error) {
      setDemandas(anterior);
      setErro(error instanceof Error ? error.message : 'Erro ao excluir demanda');
    }
  }

  async function moverPara(demanda: Demanda, status: StatusDemanda): Promise<void> {
    if (demanda.status === status) {
      return;
    }
    const anterior = demandas;
    setDemandas((atual) => atual.map((d) => (d.id === demanda.id ? { ...d, status } : d)));
    try {
      await api<Demanda>(`/demandas/${demanda.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    } catch (error) {
      setDemandas(anterior);
      setErro(error instanceof Error ? error.message : 'Erro ao mover demanda');
    }
  }

  function aoSoltar(event: React.DragEvent<HTMLDivElement>, status: StatusDemanda): void {
    event.preventDefault();
    setColunaSobreposta(null);
    const id = event.dataTransfer.getData('text/plain');
    const demanda = demandas.find((d) => d.id === id);
    if (demanda) {
      moverPara(demanda, status);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h4">Demandas</Typography>
          <Typography color="text.secondary" variant="body2">
            Quadro kanban por setor para tarefas que não são do dia a dia, vinculado ao cadastro de clientes.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<PlusIcon />} onClick={abrirNova}>
          Nova demanda
        </Button>
      </Stack>

      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel id="filtro-demanda-setor-label">Setor</InputLabel>
        <Select
          labelId="filtro-demanda-setor-label"
          label="Setor"
          value={filtroSetorId}
          onChange={(event) => setFiltroSetorId(event.target.value)}
        >
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

      <Grid container spacing={2}>
        {COLUNAS.map((coluna) => {
          const itens = demandasFiltradas.filter((d) => d.status === coluna.status);
          return (
            <Grid key={coluna.status} size={{ xs: 12, md: 4 }}>
              <Paper
                variant="outlined"
                onDragOver={(event) => {
                  event.preventDefault();
                  setColunaSobreposta(coluna.status);
                }}
                onDragLeave={() => setColunaSobreposta((atual) => (atual === coluna.status ? null : atual))}
                onDrop={(event) => aoSoltar(event, coluna.status)}
                sx={{
                  p: 2,
                  minHeight: 400,
                  bgcolor: colunaSobreposta === coluna.status ? 'action.hover' : 'background.paper',
                  transition: 'background-color 0.15s',
                }}
              >
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1">{coluna.titulo}</Typography>
                  <Chip label={itens.length} size="small" />
                </Stack>
                <Stack spacing={1.5}>
                  {itens.map((demanda) => (
                    <Paper
                      key={demanda.id}
                      variant="outlined"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', demanda.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      sx={{ p: 1.5, cursor: 'grab' }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {demanda.titulo}
                          </Typography>
                          <Stack direction="row" spacing={0}>
                            <IconButton size="small" onClick={() => abrirEdicao(demanda)}>
                              <PencilSimpleIcon fontSize="var(--icon-fontSize-sm)" />
                            </IconButton>
                            <IconButton size="small" onClick={() => excluir(demanda)}>
                              <TrashIcon fontSize="var(--icon-fontSize-sm)" />
                            </IconButton>
                          </Stack>
                        </Stack>
                        {demanda.descricao ? (
                          <Typography color="text.secondary" variant="caption">
                            {demanda.descricao}
                          </Typography>
                        ) : null}
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip label={demanda.setor.nome} size="small" variant="outlined" />
                          {demanda.cliente ? (
                            <Chip label={demanda.cliente.razaoSocial} size="small" variant="outlined" color="primary" />
                          ) : null}
                          {demanda.responsavel ? (
                            <Chip label={demanda.responsavel.nome} size="small" variant="outlined" />
                          ) : null}
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                  {itens.length === 0 ? (
                    <Typography color="text.secondary" variant="caption" sx={{ fontStyle: 'italic' }}>
                      Arraste um card para cá.
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <DemandaFormDialog
        open={dialogAberto}
        demanda={demandaEmEdicao}
        setores={setores}
        clientes={clientes}
        usuarios={usuarios}
        onClose={() => setDialogAberto(false)}
        onSaved={aoSalvar}
      />

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
