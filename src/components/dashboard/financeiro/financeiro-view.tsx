'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import { usePaginacao } from '@/hooks/use-paginacao';
import type { Cliente, LancamentoFinanceiro, TipoLancamento } from '@/types/domain';

import { LancamentoFormDialog } from './lancamento-form-dialog';

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type StatusLancamento = 'pendente' | 'atrasado' | 'liquidado';

function statusDoLancamento(lancamento: LancamentoFinanceiro, agora = dayjs()): StatusLancamento {
  if (lancamento.liquidadoEm) {
    return 'liquidado';
  }
  return dayjs(lancamento.vencimento).isBefore(agora, 'day') ? 'atrasado' : 'pendente';
}

const STATUS_LABEL: Record<StatusLancamento, string> = {
  pendente: 'Pendente',
  atrasado: 'Atrasado',
  liquidado: 'Liquidado',
};

const STATUS_COLOR: Record<StatusLancamento, 'default' | 'warning' | 'error' | 'success'> = {
  pendente: 'default',
  atrasado: 'error',
  liquidado: 'success',
};

export function FinanceiroView(): React.JSX.Element {
  const [lancamentos, setLancamentos] = React.useState<LancamentoFinanceiro[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);

  const [filtroTipo, setFiltroTipo] = React.useState<TipoLancamento | ''>('');
  const [filtroStatus, setFiltroStatus] = React.useState<StatusLancamento | ''>('');

  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [tipoPadrao, setTipoPadrao] = React.useState<TipoLancamento>('PAGAR');
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = React.useState<LancamentoFinanceiro | null>(null);

  const carregar = React.useCallback(() => {
    Promise.all([api<LancamentoFinanceiro[]>('/financeiro/lancamentos'), api<Cliente[]>('/clientes')])
      .then(([lancamentosData, clientesData]) => {
        setLancamentos(lancamentosData);
        setClientes(clientesData);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar financeiro'));
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  const agora = React.useMemo(() => dayjs(), []);

  const resumo = React.useMemo(() => {
    let aPagar = 0;
    let aReceber = 0;
    let receitasMes = 0;
    let despesasMes = 0;

    for (const lancamento of lancamentos) {
      const status = statusDoLancamento(lancamento, agora);
      if (status !== 'liquidado') {
        if (lancamento.tipo === 'PAGAR') aPagar += lancamento.valor;
        else aReceber += lancamento.valor;
      } else if (lancamento.liquidadoEm && dayjs(lancamento.liquidadoEm).isSame(agora, 'month')) {
        if (lancamento.tipo === 'RECEBER') receitasMes += lancamento.valor;
        else despesasMes += lancamento.valor;
      }
    }

    return { aPagar, aReceber, saldoMes: receitasMes - despesasMes, receitasMes, despesasMes };
  }, [lancamentos, agora]);

  const dre = React.useMemo(() => {
    const mapa = new Map<string, { categoria: string; receitas: number; despesas: number }>();
    for (const lancamento of lancamentos) {
      if (!lancamento.liquidadoEm || !dayjs(lancamento.liquidadoEm).isSame(agora, 'month')) {
        continue;
      }
      const categoria = lancamento.categoria ?? 'Sem categoria';
      if (!mapa.has(categoria)) {
        mapa.set(categoria, { categoria, receitas: 0, despesas: 0 });
      }
      const linha = mapa.get(categoria)!;
      if (lancamento.tipo === 'RECEBER') linha.receitas += lancamento.valor;
      else linha.despesas += lancamento.valor;
    }
    return [...mapa.values()].sort((a, b) => a.categoria.localeCompare(b.categoria));
  }, [lancamentos, agora]);

  const lancamentosFiltrados = React.useMemo(
    () =>
      lancamentos.filter((l) => {
        if (filtroTipo && l.tipo !== filtroTipo) return false;
        if (filtroStatus && statusDoLancamento(l, agora) !== filtroStatus) return false;
        return true;
      }),
    [lancamentos, filtroTipo, filtroStatus, agora]
  );

  const { pagina, linhasPorPagina, itensPaginados, aoMudarPagina, aoMudarLinhasPorPagina, resetarPagina } =
    usePaginacao(lancamentosFiltrados);

  React.useEffect(() => {
    resetarPagina();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetar só quando os filtros mudam
  }, [filtroTipo, filtroStatus]);

  function abrirNovo(tipo: TipoLancamento): void {
    setLancamentoEmEdicao(null);
    setTipoPadrao(tipo);
    setDialogAberto(true);
  }

  function abrirEdicao(lancamento: LancamentoFinanceiro): void {
    setLancamentoEmEdicao(lancamento);
    setDialogAberto(true);
  }

  function aoSalvar(lancamento: LancamentoFinanceiro): void {
    setLancamentos((atual) => {
      const existe = atual.some((l) => l.id === lancamento.id);
      return existe ? atual.map((l) => (l.id === lancamento.id ? lancamento : l)) : [...atual, lancamento];
    });
  }

  async function alternarLiquidado(lancamento: LancamentoFinanceiro): Promise<void> {
    const acao = lancamento.liquidadoEm ? 'reabrir' : 'liquidar';
    try {
      const atualizado = await api<LancamentoFinanceiro>(`/financeiro/lancamentos/${lancamento.id}/${acao}`, {
        method: 'POST',
      });
      aoSalvar(atualizado);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar lançamento');
    }
  }

  async function excluir(lancamento: LancamentoFinanceiro): Promise<void> {
    const anterior = lancamentos;
    setLancamentos((atual) => atual.filter((l) => l.id !== lancamento.id));
    try {
      await api(`/financeiro/lancamentos/${lancamento.id}`, { method: 'DELETE' });
    } catch (error) {
      setLancamentos(anterior);
      setErro(error instanceof Error ? error.message : 'Erro ao excluir lançamento');
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h4">Financeiro</Typography>
          <Typography color="text.secondary" variant="body2">
            Contas a pagar/receber, DRE e fluxo de caixa do escritório e dos clientes de BPO Financeiro.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<PlusIcon />} onClick={() => abrirNovo('PAGAR')}>
            Conta a pagar
          </Button>
          <Button variant="contained" startIcon={<PlusIcon />} onClick={() => abrirNovo('RECEBER')}>
            Conta a receber
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              A pagar (em aberto)
            </Typography>
            <Typography color="error.main" variant="h5">
              {formatoMoeda.format(resumo.aPagar)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              A receber (em aberto)
            </Typography>
            <Typography color="success.main" variant="h5">
              {formatoMoeda.format(resumo.aReceber)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Saldo do mês (liquidado)
            </Typography>
            <Typography color={resumo.saldoMes >= 0 ? 'success.main' : 'error.main'} variant="h5">
              {formatoMoeda.format(resumo.saldoMes)}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Receitas x despesas do mês
            </Typography>
            <Typography variant="body2">
              {formatoMoeda.format(resumo.receitasMes)} / {formatoMoeda.format(resumo.despesasMes)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Stack spacing={2}>
        <Typography variant="h6">DRE simplificado — {agora.format('MMMM/YYYY')}</Typography>
        {dre.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nenhum lançamento liquidado neste mês ainda.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">Receitas</TableCell>
                  <TableCell align="right">Despesas</TableCell>
                  <TableCell align="right">Resultado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dre.map((linha) => (
                  <TableRow key={linha.categoria}>
                    <TableCell>{linha.categoria}</TableCell>
                    <TableCell align="right">{formatoMoeda.format(linha.receitas)}</TableCell>
                    <TableCell align="right">{formatoMoeda.format(linha.despesas)}</TableCell>
                    <TableCell align="right">
                      <Box
                        component="span"
                        sx={{ color: linha.receitas - linha.despesas >= 0 ? 'success.main' : 'error.main' }}
                      >
                        {formatoMoeda.format(linha.receitas - linha.despesas)}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="filtro-tipo-label">Tipo</InputLabel>
          <Select
            labelId="filtro-tipo-label"
            label="Tipo"
            value={filtroTipo}
            onChange={(event) => setFiltroTipo(event.target.value as TipoLancamento | '')}
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            <MenuItem value="PAGAR">A pagar</MenuItem>
            <MenuItem value="RECEBER">A receber</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="filtro-status-label">Status</InputLabel>
          <Select
            labelId="filtro-status-label"
            label="Status"
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value as StatusLancamento | '')}
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            <MenuItem value="pendente">Pendente</MenuItem>
            <MenuItem value="atrasado">Atrasado</MenuItem>
            <MenuItem value="liquidado">Liquidado</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lancamentosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                    Nenhum lançamento encontrado.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              itensPaginados.map((lancamento) => {
                const status = statusDoLancamento(lancamento, agora);
                return (
                  <TableRow key={lancamento.id} hover>
                    <TableCell>
                      <Chip
                        label={lancamento.tipo === 'PAGAR' ? 'Pagar' : 'Receber'}
                        size="small"
                        color={lancamento.tipo === 'PAGAR' ? 'error' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {lancamento.descricao}
                      {lancamento.categoria ? (
                        <Typography color="text.secondary" variant="caption" sx={{ display: 'block' }}>
                          {lancamento.categoria}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>{lancamento.cliente?.razaoSocial ?? 'Escritório'}</TableCell>
                    <TableCell>{dayjs(lancamento.vencimento).format('DD/MM/YYYY')}</TableCell>
                    <TableCell align="right">{formatoMoeda.format(lancamento.valor)}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_LABEL[status]} color={STATUS_COLOR[status]} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={lancamento.liquidadoEm ? 'Reabrir' : 'Marcar como liquidado'}>
                        <IconButton size="small" onClick={() => alternarLiquidado(lancamento)}>
                          <CheckIcon
                            weight={lancamento.liquidadoEm ? 'fill' : 'regular'}
                            color={lancamento.liquidadoEm ? 'var(--mui-palette-success-main)' : undefined}
                          />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => abrirEdicao(lancamento)}>
                        <PencilSimpleIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => excluir(lancamento)}>
                        <TrashIcon />
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
          count={lancamentosFiltrados.length}
          page={pagina}
          onPageChange={aoMudarPagina}
          rowsPerPage={linhasPorPagina}
          onRowsPerPageChange={aoMudarLinhasPorPagina}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>

      <LancamentoFormDialog
        open={dialogAberto}
        lancamento={lancamentoEmEdicao}
        clientes={clientes}
        tipoPadrao={tipoPadrao}
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
