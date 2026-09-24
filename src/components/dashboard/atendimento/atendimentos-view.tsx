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
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import type { Atendimento, Cliente, Setor, StatusAtendimento, UsuarioResumo } from '@/types/domain';

import { AtendimentoFormDialog } from './atendimento-form-dialog';

const COLUNAS: { status: StatusAtendimento; titulo: string }[] = [
  { status: 'AGUARDANDO', titulo: 'Aguardando' },
  { status: 'EM_ATENDIMENTO', titulo: 'Em atendimento' },
  { status: 'FINALIZADO', titulo: 'Finalizado' },
];

const AGORA_INTERVALO_MS = 30_000;

function formatarDuracao(minutos: number): string {
  if (minutos < 60) {
    return `${Math.round(minutos)} min`;
  }
  const horas = Math.floor(minutos / 60);
  const resto = Math.round(minutos % 60);
  return resto > 0 ? `${horas}h ${resto}min` : `${horas}h`;
}

export function AtendimentosView(): React.JSX.Element {
  const [atendimentos, setAtendimentos] = React.useState<Atendimento[]>([]);
  const [setores, setSetores] = React.useState<Setor[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioResumo[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);
  const [agora, setAgora] = React.useState(() => dayjs());

  const [filtroSetorId, setFiltroSetorId] = React.useState('');
  const [colunaSobreposta, setColunaSobreposta] = React.useState<StatusAtendimento | null>(null);

  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [atendimentoEmEdicao, setAtendimentoEmEdicao] = React.useState<Atendimento | null>(null);

  const carregar = React.useCallback(() => {
    Promise.all([
      api<Atendimento[]>('/atendimentos'),
      api<Setor[]>('/setores'),
      api<Cliente[]>('/clientes'),
      api<UsuarioResumo[]>('/usuarios'),
    ])
      .then(([atendimentosData, setoresData, clientesData, usuariosData]) => {
        setAtendimentos(atendimentosData);
        setSetores(setoresData);
        setClientes(clientesData);
        setUsuarios(usuariosData.filter((u) => u.ativo));
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar atendimentos'));
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  React.useEffect(() => {
    const intervalo = setInterval(() => setAgora(dayjs()), AGORA_INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  const atendimentosFiltrados = React.useMemo(
    () => atendimentos.filter((a) => !filtroSetorId || a.setorId === filtroSetorId),
    [atendimentos, filtroSetorId]
  );

  const estatisticas = React.useMemo(() => {
    const finalizados = atendimentos.filter((a) => a.status === 'FINALIZADO' && a.iniciadoEm && a.finalizadoEm);
    const temposEspera = atendimentos
      .filter((a) => a.iniciadoEm)
      .map((a) => dayjs(a.iniciadoEm).diff(dayjs(a.abertoEm), 'minute'));
    const temposAtendimento = finalizados.map((a) => dayjs(a.finalizadoEm).diff(dayjs(a.iniciadoEm), 'minute'));

    const media = (valores: number[]): number | null =>
      valores.length === 0 ? null : valores.reduce((soma, v) => soma + v, 0) / valores.length;

    return {
      tempoMedioEspera: media(temposEspera),
      tempoMedioAtendimento: media(temposAtendimento),
      finalizadosHoje: atendimentos.filter(
        (a) => a.finalizadoEm && dayjs(a.finalizadoEm).isSame(agora, 'day')
      ).length,
    };
  }, [atendimentos, agora]);

  function abrirNovo(): void {
    setAtendimentoEmEdicao(null);
    setDialogAberto(true);
  }

  function abrirEdicao(atendimento: Atendimento): void {
    setAtendimentoEmEdicao(atendimento);
    setDialogAberto(true);
  }

  function aoSalvar(atendimento: Atendimento): void {
    setAtendimentos((atual) => {
      const existe = atual.some((a) => a.id === atendimento.id);
      return existe ? atual.map((a) => (a.id === atendimento.id ? atendimento : a)) : [...atual, atendimento];
    });
  }

  async function excluir(atendimento: Atendimento): Promise<void> {
    const anterior = atendimentos;
    setAtendimentos((atual) => atual.filter((a) => a.id !== atendimento.id));
    try {
      await api(`/atendimentos/${atendimento.id}`, { method: 'DELETE' });
    } catch (error) {
      setAtendimentos(anterior);
      setErro(error instanceof Error ? error.message : 'Erro ao excluir atendimento');
    }
  }

  async function moverPara(atendimento: Atendimento, status: StatusAtendimento): Promise<void> {
    if (atendimento.status === status) {
      return;
    }
    const acao = status === 'AGUARDANDO' ? 'reabrir' : status === 'EM_ATENDIMENTO' ? 'iniciar' : 'finalizar';
    try {
      const atualizado = await api<Atendimento>(`/atendimentos/${atendimento.id}/${acao}`, { method: 'POST' });
      aoSalvar(atualizado);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao mover atendimento');
    }
  }

  function aoSoltar(event: React.DragEvent<HTMLDivElement>, status: StatusAtendimento): void {
    event.preventDefault();
    setColunaSobreposta(null);
    const id = event.dataTransfer.getData('text/plain');
    const atendimento = atendimentos.find((a) => a.id === id);
    if (atendimento) {
      moverPara(atendimento, status);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h4">Atendimento</Typography>
          <Typography color="text.secondary" variant="body2">
            Fila de atendimento com direcionamento automático para o responsável de cada cliente por setor.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<PlusIcon />} onClick={abrirNovo}>
          Novo atendimento
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Tempo médio de espera
            </Typography>
            <Typography variant="h4">
              {estatisticas.tempoMedioEspera === null ? '—' : formatarDuracao(estatisticas.tempoMedioEspera)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Tempo médio de atendimento
            </Typography>
            <Typography variant="h4">
              {estatisticas.tempoMedioAtendimento === null ? '—' : formatarDuracao(estatisticas.tempoMedioAtendimento)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Finalizados hoje
            </Typography>
            <Typography variant="h4">{estatisticas.finalizadosHoje}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel id="filtro-atendimento-setor-label">Setor</InputLabel>
        <Select
          labelId="filtro-atendimento-setor-label"
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
          const itens = atendimentosFiltrados.filter((a) => a.status === coluna.status);
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
                  {itens.map((atendimento) => (
                    <Paper
                      key={atendimento.id}
                      variant="outlined"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', atendimento.id);
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                      sx={{ p: 1.5, cursor: 'grab' }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {atendimento.cliente.razaoSocial}
                          </Typography>
                          <Stack direction="row" spacing={0}>
                            <IconButton size="small" onClick={() => abrirEdicao(atendimento)}>
                              <PencilSimpleIcon fontSize="var(--icon-fontSize-sm)" />
                            </IconButton>
                            <IconButton size="small" onClick={() => excluir(atendimento)}>
                              <TrashIcon fontSize="var(--icon-fontSize-sm)" />
                            </IconButton>
                          </Stack>
                        </Stack>
                        <Typography color="text.secondary" variant="caption">
                          {atendimento.motivo}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip label={atendimento.setor.nome} size="small" variant="outlined" />
                          {atendimento.responsavel ? (
                            <Chip label={atendimento.responsavel.nome} size="small" variant="outlined" color="primary" />
                          ) : (
                            <Chip label="Sem responsável" size="small" variant="outlined" color="warning" />
                          )}
                        </Stack>
                        <Tooltip title={dayjs(atendimento.abertoEm).format('DD/MM/YYYY HH:mm')}>
                          <Typography color="text.secondary" variant="caption">
                            {atendimento.status === 'FINALIZADO' && atendimento.iniciadoEm && atendimento.finalizadoEm
                              ? `Atendido em ${formatarDuracao(dayjs(atendimento.finalizadoEm).diff(dayjs(atendimento.iniciadoEm), 'minute'))}`
                              : `Aberto há ${formatarDuracao(agora.diff(dayjs(atendimento.abertoEm), 'minute'))}`}
                          </Typography>
                        </Tooltip>
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

      <AtendimentoFormDialog
        open={dialogAberto}
        atendimento={atendimentoEmEdicao}
        clientes={clientes}
        setores={setores}
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
