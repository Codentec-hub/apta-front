'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowCounterClockwise';
import { CalendarDotsIcon } from '@phosphor-icons/react/dist/ssr/CalendarDots';
import { ChatCircleIcon } from '@phosphor-icons/react/dist/ssr/ChatCircle';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { ClockCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ClockCounterClockwise';
import { CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { DotsThreeVerticalIcon } from '@phosphor-icons/react/dist/ssr/DotsThreeVertical';
import { FunnelIcon } from '@phosphor-icons/react/dist/ssr/Funnel';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { ThumbsUpIcon } from '@phosphor-icons/react/dist/ssr/ThumbsUp';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';
import { XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle';
import dayjs, { type Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import { usePaginacao } from '@/hooks/use-paginacao';
import { useUser } from '@/hooks/use-user';
import {
  categoriaDaEntrega,
  competenciaAnual,
  formatarCompetencia,
  PODE_ALTERAR_PRAZOS,
  statusDaObrigacao,
} from '@/lib/obrigacao-status';
import type { Cliente, Obrigacao } from '@/types/domain';

import { AtrasoDialog } from './atraso-dialog';
import { ComentariosDialog } from './comentarios-dialog';
import { ConcluirDialog } from './concluir-dialog';
import { HistoricoDialog } from './historico-dialog';
import { ObrigacaoFormDialog } from './obrigacao-form-dialog';
import type { DadosBase } from './obrigacoes-view';
import { PrazoTecnicoDialog } from './prazo-tecnico-dialog';
import { PrazosEmMassaDialog } from './prazos-em-massa-dialog';

export interface ListaEntregasProps {
  dados: DadosBase;
  onErro: (mensagem: string) => void;
}

// Os quatro status da Lista de Entregas do Acessórias (combináveis).
type StatusFiltro = 'pendentes' | 'justificadas' | 'entregues' | 'dispensadas';

const STATUS_FILTRO: { value: StatusFiltro; label: string; cor: string }[] = [
  { value: 'pendentes', label: 'Pendentes', cor: 'var(--mui-palette-warning-100)' },
  { value: 'justificadas', label: 'Justificadas', cor: 'var(--mui-palette-secondary-100, #ede7f6)' },
  { value: 'entregues', label: 'Entregues', cor: 'var(--mui-palette-primary-100)' },
  { value: 'dispensadas', label: 'Dispensadas', cor: 'var(--mui-palette-neutral-100, #f3f4f6)' },
];

function statusDoFiltro(o: Obrigacao): StatusFiltro {
  const c = categoriaDaEntrega(o);
  if (c === 'entregue') return 'entregues';
  if (c === 'dispensada') return 'dispensadas';
  if (c === 'justificada') return 'justificadas';
  return 'pendentes';
}

interface Intervalos {
  competenciaDe: Dayjs | null;
  competenciaAte: Dayjs | null;
  prazoTecDe: Dayjs | null;
  prazoTecAte: Dayjs | null;
  prazoLegalDe: Dayjs | null;
  prazoLegalAte: Dayjs | null;
  entregaDe: Dayjs | null;
  entregaAte: Dayjs | null;
}

const SEM_INTERVALOS: Intervalos = {
  competenciaDe: null,
  competenciaAte: null,
  prazoTecDe: null,
  prazoTecAte: null,
  prazoLegalDe: null,
  prazoLegalAte: null,
  entregaDe: null,
  entregaAte: null,
};

// Travas da alteração em massa (iguais às do Acessórias): só pendentes /
// justificadas, de uma única competência e de uma única obrigação.
function motivoBloqueioMassa(selecionadas: Obrigacao[]): string | null {
  if (selecionadas.length === 0) return 'Selecione as entregas na tabela';
  if (selecionadas.some((o) => o.concluidaEm || o.dispensada)) {
    return 'Só entregas pendentes ou justificadas (desmarque entregues/dispensadas)';
  }
  if (new Set(selecionadas.map((o) => o.competencia ?? 'avulsa')).size > 1) return 'Selecione uma única competência';
  if (new Set(selecionadas.map((o) => o.tipoId ?? o.nome)).size > 1) return 'Selecione uma única obrigação';
  return null;
}

function formatarData(data: string | null): string {
  return data ? dayjs(data).format('DD/MM/YY') : '—';
}

function finalCnpj(cnpj: string): string {
  const digitos = cnpj.replaceAll(/\D/g, '');
  return digitos.length >= 6 ? `${digitos.slice(-6, -2)}-${digitos.slice(-2)}` : cnpj;
}

export function ListaEntregas({ dados, onErro }: ListaEntregasProps): React.JSX.Element {
  const { user } = useUser();
  const podeAlterarPrazos = Boolean(user && PODE_ALTERAR_PRAZOS.has(user.perfil));

  const [entregas, setEntregas] = React.useState<Obrigacao[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [aviso, setAviso] = React.useState<string | null>(null);

  const [status, setStatus] = React.useState<Set<StatusFiltro>>(new Set(['pendentes']));
  const [filtroCliente, setFiltroCliente] = React.useState<Cliente | null>(null);
  // Operacional abre já filtrado no próprio departamento (como o filtro
  // por departamento do Acessórias); pode remover o filtro.
  const [filtroSetorId, setFiltroSetorId] = React.useState(user?.perfil === 'OPERACIONAL' ? (user.setor?.id ?? '') : '');
  const [filtroTipoId, setFiltroTipoId] = React.useState('');
  const [filtroResponsavelId, setFiltroResponsavelId] = React.useState('');
  const [intervalos, setIntervalos] = React.useState<Intervalos>(SEM_INTERVALOS);
  const [mostrarFiltros, setMostrarFiltros] = React.useState(true);
  const [busca, setBusca] = React.useState('');
  const [selecionados, setSelecionados] = React.useState<Set<string>>(new Set());

  const [selecionada, setSelecionada] = React.useState<Obrigacao | null>(null);
  const [dialog, setDialog] = React.useState<
    'form' | 'atraso' | 'concluir' | 'historico' | 'massa' | 'prazoTecnico' | 'comentarios' | null
  >(null);
  const [menu, setMenu] = React.useState<{ el: HTMLElement; obrigacao: Obrigacao } | null>(null);

  // Filtros de servidor (tudo menos status e busca, que ficam no cliente
  // para os contadores dos quatro status refletirem o recorte).
  const query = React.useMemo(() => {
    const p = new URLSearchParams();
    const dia = (d: Dayjs | null) => (d ? d.format('YYYY-MM-DD') : null);
    const mes = (d: Dayjs | null) => (d ? d.format('YYYY-MM') : null);
    const campos: [string, string | null][] = [
      ['clienteId', filtroCliente?.id ?? null],
      ['setorId', filtroSetorId || null],
      ['tipoId', filtroTipoId || null],
      ['responsavelId', filtroResponsavelId || null],
      ['competenciaDe', mes(intervalos.competenciaDe)],
      ['competenciaAte', mes(intervalos.competenciaAte)],
      ['prazoTecDe', dia(intervalos.prazoTecDe)],
      ['prazoTecAte', dia(intervalos.prazoTecAte)],
      ['prazoLegalDe', dia(intervalos.prazoLegalDe)],
      ['prazoLegalAte', dia(intervalos.prazoLegalAte)],
      ['entregaDe', dia(intervalos.entregaDe)],
      ['entregaAte', dia(intervalos.entregaAte)],
    ];
    for (const [chave, valor] of campos) if (valor) p.set(chave, valor);
    return p.toString();
  }, [filtroCliente, filtroSetorId, filtroTipoId, filtroResponsavelId, intervalos]);

  const carregar = React.useCallback(() => {
    setCarregando(true);
    api<Obrigacao[]>(`/obrigacoes${query ? `?${query}` : ''}`)
      .then((data) => {
        setEntregas(data);
        setSelecionados(new Set());
      })
      .catch((error: unknown) => onErro(error instanceof Error ? error.message : 'Erro ao carregar entregas'))
      .finally(() => setCarregando(false));
  }, [query, onErro]);

  React.useEffect(() => {
    const timer = setTimeout(carregar, 250);
    return () => clearTimeout(timer);
  }, [carregar]);

  const recorte = React.useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return entregas;
    return entregas.filter((o) => o.nome.toLowerCase().includes(termo) || o.cliente.razaoSocial.toLowerCase().includes(termo));
  }, [entregas, busca]);

  const contagem = React.useMemo(() => {
    const c: Record<StatusFiltro, number> = { pendentes: 0, justificadas: 0, entregues: 0, dispensadas: 0 };
    for (const o of recorte) c[statusDoFiltro(o)] += 1;
    return c;
  }, [recorte]);

  const filtradas = React.useMemo(
    () => (status.size === 0 ? recorte : recorte.filter((o) => status.has(statusDoFiltro(o)))),
    [recorte, status]
  );

  const { pagina, linhasPorPagina, itensPaginados, aoMudarPagina, aoMudarLinhasPorPagina, resetarPagina } =
    usePaginacao(filtradas, 25);

  React.useEffect(() => {
    resetarPagina();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetar só quando os filtros mudam
  }, [query, status, busca]);

  const planosVencidos = React.useMemo(
    () => entregas.filter((o) => statusDaObrigacao(o).status === 'plano_vencido').length,
    [entregas]
  );

  const entregasSelecionadas = React.useMemo(() => entregas.filter((o) => selecionados.has(o.id)), [entregas, selecionados]);
  const bloqueioMassa = motivoBloqueioMassa(entregasSelecionadas);

  const tiposDoFiltro = React.useMemo(
    () => dados.tipos.filter((t) => !filtroSetorId || t.setorId === filtroSetorId),
    [dados.tipos, filtroSetorId]
  );

  function substituir(atualizadas: Obrigacao[]): void {
    const porId = new Map(atualizadas.map((o) => [o.id, o]));
    setEntregas((atual) => {
      const existentes = new Set(atual.map((o) => o.id));
      const novas = atualizadas.filter((o) => !existentes.has(o.id));
      return [...atual.map((o) => porId.get(o.id) ?? o), ...novas];
    });
  }

  function abrir(tipo: NonNullable<typeof dialog>, obrigacao: Obrigacao | null): void {
    setMenu(null);
    setSelecionada(obrigacao);
    setDialog(tipo);
  }

  async function acao(obrigacao: Obrigacao, caminho: string, corpo: object | null, mensagem: string): Promise<void> {
    setMenu(null);
    try {
      const atualizada = await api<Obrigacao>(`/obrigacoes/${obrigacao.id}${caminho}`, {
        method: caminho ? 'POST' : 'PUT',
        ...(corpo ? { body: JSON.stringify(corpo) } : {}),
      });
      substituir([atualizada]);
      setAviso(mensagem);
    } catch (error) {
      onErro(error instanceof Error ? error.message : 'Erro ao atualizar entrega');
    }
  }

  function alternarStatus(valor: StatusFiltro): void {
    setStatus((atual) => {
      const novo = new Set(atual);
      if (novo.has(valor)) novo.delete(valor);
      else novo.add(valor);
      return novo;
    });
  }

  function alternarSelecao(id: string): void {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function intervalo<K extends keyof Intervalos>(chave: K, valor: Dayjs | null): void {
    setIntervalos((i) => ({ ...i, [chave]: valor }));
  }

  const filtrosAtivos =
    Object.values(intervalos).filter(Boolean).length +
    [filtroCliente, filtroSetorId, filtroTipoId, filtroResponsavelId].filter(Boolean).length;
  const todasFiltradasSelecionadas = filtradas.length > 0 && filtradas.every((o) => selecionados.has(o.id));
  const setorForcado = dados.setores.find((s) => s.id === filtroSetorId);

  const campoData = (label: string, chave: keyof Intervalos, mesAno = false) => (
    <DatePicker
      label={label}
      value={intervalos[chave]}
      onChange={(v) => intervalo(chave, v)}
      format={mesAno ? 'MM/YYYY' : 'DD/MM/YYYY'}
      views={mesAno ? ['year', 'month'] : undefined}
      openTo={mesAno ? 'month' : undefined}
      slotProps={{ textField: { size: 'small', fullWidth: true }, field: { clearable: true } }}
    />
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Autocomplete
          size="small"
          options={dados.clientes}
          value={filtroCliente}
          getOptionLabel={(c) => c.razaoSocial}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_event, valor) => setFiltroCliente(valor)}
          renderInput={(params) => <TextField {...params} label="Filtrar por Empresa" />}
          sx={{ minWidth: 260 }}
        />
        <Button
          variant={mostrarFiltros ? 'contained' : 'outlined'}
          color="error"
          startIcon={<FunnelIcon />}
          onClick={() => setMostrarFiltros((v) => !v)}
        >
          Filtros{filtrosAtivos ? ` (${filtrosAtivos})` : ''}
        </Button>
        {STATUS_FILTRO.map((s) => (
          <FormControlLabel
            key={s.value}
            sx={{ bgcolor: s.cor, borderRadius: 1, pr: 1.5, mr: 0 }}
            control={<Checkbox size="small" checked={status.has(s.value)} onChange={() => alternarStatus(s.value)} />}
            label={
              <Typography variant="body2">
                {s.label} <strong>({contagem[s.value]})</strong>
              </Typography>
            }
          />
        ))}
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<PlusIcon />} onClick={() => abrir('form', null)}>
          Entrega avulsa
        </Button>
      </Stack>

      {mostrarFiltros ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
            {campoData('Competência de…', 'competenciaDe', true)}
            {campoData('Competência até…', 'competenciaAte', true)}
            {campoData('Prazo téc. de…', 'prazoTecDe')}
            {campoData('Prazo téc. até…', 'prazoTecAte')}
            {campoData('Prazo legal de…', 'prazoLegalDe')}
            {campoData('Prazo legal até…', 'prazoLegalAte')}
            {campoData('Entrega do dia…', 'entregaDe')}
            {campoData('Entrega até dia…', 'entregaAte')}
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <TextField
              label="Buscar obrigação ou empresa"
              size="small"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="filtro-depto">Departamento</InputLabel>
              <Select
                labelId="filtro-depto"
                label="Departamento"
                value={filtroSetorId}
                onChange={(event) => {
                  setFiltroSetorId(event.target.value);
                  setFiltroTipoId('');
                }}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {dados.setores.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="filtro-obrigacao">Obrigação</InputLabel>
              <Select labelId="filtro-obrigacao" label="Obrigação" value={filtroTipoId} onChange={(event) => setFiltroTipoId(event.target.value)}>
                <MenuItem value="">
                  <em>Todas</em>
                </MenuItem>
                {tiposDoFiltro.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="filtro-resp">Responsável</InputLabel>
              <Select
                labelId="filtro-resp"
                label="Responsável"
                value={filtroResponsavelId}
                onChange={(event) => setFiltroResponsavelId(event.target.value)}
              >
                <MenuItem value="">
                  <em>Todos</em>
                </MenuItem>
                {dados.usuarios.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              size="small"
              onClick={() => {
                setIntervalos(SEM_INTERVALOS);
                setFiltroCliente(null);
                setFiltroSetorId('');
                setFiltroTipoId('');
                setFiltroResponsavelId('');
                setBusca('');
              }}
            >
              Limpar filtros
            </Button>
          </Stack>
        </Paper>
      ) : null}

      {setorForcado ? (
        <Box>
          <Chip size="small" label={`Dpto: ${setorForcado.nome}`} onDelete={() => setFiltroSetorId('')} />
        </Box>
      ) : null}

      {planosVencidos > 0 ? (
        <Alert severity="error" icon={<WarningIcon />}>
          <strong>
            {planosVencidos} plano{planosVencidos > 1 ? 's' : ''} de ação vencido{planosVencidos > 1 ? 's' : ''}
          </strong>{' '}
          — prazo que o próprio responsável prometeu ao cliente já passou e ainda não foi confirmado como cumprido.
        </Alert>
      ) : null}

      {selecionados.size > 0 ? (
        <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: 'var(--mui-palette-primary-50)' }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2">
              <strong>{selecionados.size}</strong> selecionada(s)
            </Typography>
            <Tooltip title={podeAlterarPrazos ? (bloqueioMassa ?? '') : 'Sem permissão para alterar prazos'}>
              <span>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CalendarDotsIcon />}
                  disabled={!podeAlterarPrazos || Boolean(bloqueioMassa)}
                  onClick={() => setDialog('massa')}
                >
                  Alterar prazos em massa
                </Button>
              </span>
            </Tooltip>
            {bloqueioMassa && podeAlterarPrazos ? (
              <Typography color="text.secondary" variant="caption">
                {bloqueioMassa}
              </Typography>
            ) : null}
            <Box sx={{ flex: 1 }} />
            <Button size="small" onClick={() => setSelecionados(new Set())}>
              Limpar seleção
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Tooltip title="Selecionar todas as entregas filtradas">
                  <Checkbox
                    size="small"
                    checked={todasFiltradasSelecionadas}
                    indeterminate={selecionados.size > 0 && !todasFiltradasSelecionadas}
                    onChange={() => setSelecionados(todasFiltradasSelecionadas ? new Set() : new Set(filtradas.map((o) => o.id)))}
                  />
                </Tooltip>
              </TableCell>
              <TableCell>
                Obrigação
                <br />
                Empresa [final CNPJ]
              </TableCell>
              <TableCell>
                Prazo · Status entrega
                <br />
                Dpto - Resp. [Prazo/Entrega]
              </TableCell>
              <TableCell>
                Prazo legal
                <br />
                Competência
              </TableCell>
              <TableCell>
                Protocolo de entrega
                <br />
                Comentários
              </TableCell>
              <TableCell align="right">{carregando ? 'Carregando…' : `${filtradas.length} reg`}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregando && filtradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic', py: 2 }}>
                    Nenhuma entrega com esses filtros.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              itensPaginados.map((o) => {
                const info = statusDaObrigacao(o);
                const agora = dayjs();
                const pendente = !o.concluidaEm && !o.dispensada;
                const tecnicoVencido = pendente && o.prazoTecnico && dayjs(o.prazoTecnico).isBefore(agora);
                const legalVencido = pendente && dayjs(o.prazo).isBefore(agora);
                const precisaJustificar =
                  info.status === 'atrasada' ||
                  info.status === 'em_plano_de_acao' ||
                  info.status === 'plano_vencido' ||
                  info.status === 'plano_cumprido' ||
                  (info.status === 'concluida_com_atraso' && !o.atraso);
                const responsavelEntrega = o.entreguePor && o.entreguePor.id !== o.responsavelId ? o.entreguePor.nome : null;
                const comentarios = o._count?.comentarios ?? 0;
                return (
                  <TableRow key={o.id} hover selected={selecionados.has(o.id)} sx={o.dispensada ? { opacity: 0.6 } : undefined}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selecionados.has(o.id)} onChange={() => alternarSelecao(o.id)} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: legalVencido ? 'error.main' : tecnicoVencido ? 'warning.dark' : 'primary.main' }}
                        >
                          {o.nome}
                        </Typography>
                        {o.tipo?.geraMulta ? (
                          <Tooltip title="Passível de multa">
                            <CurrencyDollarIcon color="var(--mui-palette-warning-main)" />
                          </Tooltip>
                        ) : null}
                      </Stack>
                      <Typography variant="caption" noWrap title={o.cliente.razaoSocial} sx={{ display: 'block' }}>
                        {o.cliente.razaoSocial} [{finalCnpj(o.cliente.cnpj)}]
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        {pendente && podeAlterarPrazos ? (
                          <Tooltip title="Alterar o prazo técnico">
                            <IconButton size="small" sx={{ p: 0.25 }} onClick={() => abrir('prazoTecnico', o)}>
                              <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        <Typography variant="body2" sx={{ fontWeight: 600, color: tecnicoVencido ? 'error.main' : undefined }}>
                          {formatarData(o.prazoTecnico ?? o.prazo)}
                        </Typography>
                        <Tooltip
                          title={
                            o.atraso
                              ? `Justificativa: ${o.atraso.justificativa} · plano até ${formatarData(o.atraso.prazoPrometido)}`
                              : ''
                          }
                        >
                          <Chip label={info.label} color={info.color} size="small" variant="outlined" />
                        </Tooltip>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {o.setor.nome} - {o.responsavel?.nome ?? 'sem responsável'}
                        {responsavelEntrega ? ` / ${responsavelEntrega}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: legalVencido ? 'error.main' : undefined }}>
                        {formatarData(o.prazo)}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {formatarCompetencia(o.competencia, competenciaAnual(o.tipo))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {o.concluidaEm ? (
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Entregue {dayjs(o.concluidaEm).format('DD/MM/YY HH:mm')}
                          {o.entreguePor ? ` · ${o.entreguePor.nome}` : ''}
                        </Typography>
                      ) : null}
                      <Link
                        component="button"
                        type="button"
                        variant="caption"
                        onClick={() => abrir('comentarios', o)}
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                      >
                        {comentarios} <ChatCircleIcon />
                      </Link>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {precisaJustificar ? (
                        <Button
                          size="small"
                          color={info.status === 'plano_cumprido' ? 'inherit' : 'error'}
                          onClick={() => abrir('atraso', o)}
                        >
                          {o.atraso ? 'Plano' : 'Justificar'}
                        </Button>
                      ) : null}
                      {pendente ? (
                        <>
                          <Tooltip title="Dispensar entrega">
                            <IconButton size="small" color="error" onClick={() => acao(o, '', { dispensada: true }, 'Entrega dispensada')}>
                              <XCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Entrega Rápida">
                            <IconButton size="small" color="success" onClick={() => acao(o, '/concluir', {}, 'Entregue')}>
                              <ThumbsUpIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : null}
                      <IconButton size="small" onClick={(e) => setMenu({ el: e.currentTarget, obrigacao: o })}>
                        <DotsThreeVerticalIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtradas.length}
          page={pagina}
          onPageChange={aoMudarPagina}
          rowsPerPage={linhasPorPagina}
          onRowsPerPageChange={aoMudarLinhasPorPagina}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>

      <Menu anchorEl={menu?.el} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu && !menu.obrigacao.concluidaEm && !menu.obrigacao.dispensada ? (
          <MenuItem onClick={() => abrir('concluir', menu.obrigacao)}>
            <ListItemIcon>
              <CheckCircleIcon />
            </ListItemIcon>
            Entregar (data, tempo e comentário)
          </MenuItem>
        ) : null}
        {menu?.obrigacao.concluidaEm ? (
          <MenuItem onClick={() => acao(menu.obrigacao, '/reabrir', null, 'Entrega desfeita')}>
            <ListItemIcon>
              <ArrowCounterClockwiseIcon />
            </ListItemIcon>
            Desfazer entrega
          </MenuItem>
        ) : null}
        {menu?.obrigacao.dispensada ? (
          <MenuItem onClick={() => acao(menu.obrigacao, '', { dispensada: false }, 'Dispensa removida')}>
            <ListItemIcon>
              <ArrowCounterClockwiseIcon />
            </ListItemIcon>
            Remover dispensa
          </MenuItem>
        ) : null}
        {menu ? (
          <MenuItem onClick={() => abrir('form', menu.obrigacao)}>
            <ListItemIcon>
              <PencilSimpleIcon />
            </ListItemIcon>
            Editar entrega
          </MenuItem>
        ) : null}
        {menu ? (
          <MenuItem onClick={() => abrir('historico', menu.obrigacao)}>
            <ListItemIcon>
              <ClockCounterClockwiseIcon />
            </ListItemIcon>
            Histórico
          </MenuItem>
        ) : null}
      </Menu>

      <ObrigacaoFormDialog
        open={dialog === 'form'}
        obrigacao={selecionada}
        clientes={dados.clientes}
        setores={dados.setores}
        tipos={dados.tipos}
        usuarios={dados.usuarios}
        podeAlterarPrazos={podeAlterarPrazos}
        onClose={() => setDialog(null)}
        onSaved={(o) => substituir([o])}
      />
      <AtrasoDialog open={dialog === 'atraso'} obrigacao={selecionada} onClose={() => setDialog(null)} onSaved={(o) => substituir([o])} />
      <ConcluirDialog
        open={dialog === 'concluir'}
        obrigacao={selecionada}
        onClose={() => setDialog(null)}
        onSaved={(o) => substituir([o])}
      />
      <HistoricoDialog open={dialog === 'historico'} obrigacao={selecionada} onClose={() => setDialog(null)} />
      <PrazoTecnicoDialog
        open={dialog === 'prazoTecnico'}
        obrigacao={selecionada}
        onClose={() => setDialog(null)}
        onSaved={(o) => {
          substituir([o]);
          setAviso('Prazo técnico alterado');
        }}
      />
      <ComentariosDialog
        open={dialog === 'comentarios'}
        obrigacao={selecionada}
        onClose={() => setDialog(null)}
        onChange={(id, total) =>
          setEntregas((atual) => atual.map((o) => (o.id === id ? { ...o, _count: { comentarios: total } } : o)))
        }
      />
      <PrazosEmMassaDialog
        open={dialog === 'massa'}
        entregas={entregasSelecionadas}
        onClose={() => setDialog(null)}
        onSaved={(atualizadas) => {
          substituir(atualizadas);
          setSelecionados(new Set());
          setAviso(`Prazos de ${atualizadas.length} entrega(s) atualizados`);
        }}
      />

      <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => setAviso(null)}>
        <Alert onClose={() => setAviso(null)} severity="success" sx={{ width: '100%' }}>
          {aviso}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
