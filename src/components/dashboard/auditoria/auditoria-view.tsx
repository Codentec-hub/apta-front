'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import dayjs from 'dayjs';

import { api } from '@/lib/api';

export interface RegistroAuditoria {
  id: string;
  criadoEm: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  ip: string | null;
  acao: string;
  modulo: string;
  entidade: string | null;
  entidadeId: string | null;
  descricao: string;
  clienteId: string | null;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
}

const ACOES: Record<string, { rotulo: string; cor: 'success' | 'info' | 'error' | 'default' | 'warning' }> = {
  criar: { rotulo: 'Criou', cor: 'success' },
  alterar: { rotulo: 'Alterou', cor: 'info' },
  excluir: { rotulo: 'Excluiu', cor: 'error' },
  login: { rotulo: 'Entrou', cor: 'default' },
  login_falhou: { rotulo: 'Login falhou', cor: 'warning' },
};

/** Nome legível do campo: "nomeFantasia" → "Nome fantasia". */
function nomeCampo(campo: string): string {
  const s = campo.replace(/Id$/, '').replaceAll(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function valor(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return dayjs(v).format('DD/MM/YYYY HH:mm');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function Detalhe({ r }: { r: RegistroAuditoria }): React.JSX.Element {
  const antes = r.antes ?? {};
  const depois = r.depois ?? {};
  const camposLista = [...new Set([...Object.keys(antes), ...Object.keys(depois)])].filter((c) => c !== 'id');
  return (
    <Box sx={{ py: 1.5, px: 2, bgcolor: 'var(--mui-palette-background-level1)' }}>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
        {r.entidade ? `${r.entidade}${r.entidadeId ? ` · ${r.entidadeId}` : ''}` : null}
        {r.ip ? ` · IP ${r.ip}` : null}
      </Typography>
      {camposLista.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Sem detalhes de campos.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Campo</TableCell>
              {r.acao === 'alterar' || r.acao === 'excluir' ? <TableCell>Antes</TableCell> : null}
              {r.acao === 'excluir' ? null : <TableCell>{r.acao === 'alterar' ? 'Depois' : 'Valor'}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {camposLista.map((c) => (
              <TableRow key={c}>
                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{nomeCampo(c)}</TableCell>
                {r.acao === 'alterar' || r.acao === 'excluir' ? (
                  <TableCell sx={{ color: r.acao === 'alterar' ? 'error.main' : undefined, wordBreak: 'break-word' }}>
                    {valor(antes[c])}
                  </TableCell>
                ) : null}
                {r.acao === 'excluir' ? null : (
                  <TableCell sx={{ color: r.acao === 'alterar' ? 'success.main' : undefined, wordBreak: 'break-word' }}>
                    {valor(depois[c])}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

function Linha({ r, mostrarModulo }: { r: RegistroAuditoria; mostrarModulo: boolean }): React.JSX.Element {
  const [aberto, setAberto] = React.useState(false);
  const temDetalhe = Object.keys(r.antes ?? {}).length > 0 || Object.keys(r.depois ?? {}).length > 0;
  const acao = ACOES[r.acao] ?? { rotulo: r.acao, cor: 'default' as const };
  return (
    <>
      <TableRow hover sx={{ '& > td': { borderBottom: aberto ? 'none' : undefined } }}>
        <TableCell padding="checkbox">
          {temDetalhe ? (
            <IconButton size="small" onClick={() => setAberto((a) => !a)} aria-label="Ver detalhes">
              {aberto ? <CaretDownIcon /> : <CaretRightIcon />}
            </IconButton>
          ) : null}
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2">{dayjs(r.criadoEm).format('DD/MM/YYYY')}</Typography>
          <Typography variant="caption" color="text.secondary">
            {dayjs(r.criadoEm).format('HH:mm:ss')}
          </Typography>
        </TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.usuarioNome ?? 'Sistema'}</TableCell>
        <TableCell>
          <Chip size="small" label={acao.rotulo} color={acao.cor} variant="outlined" />
        </TableCell>
        {mostrarModulo ? <TableCell sx={{ textTransform: 'capitalize' }}>{r.modulo}</TableCell> : null}
        <TableCell>{r.descricao}</TableCell>
      </TableRow>
      {temDetalhe ? (
        <TableRow>
          <TableCell colSpan={mostrarModulo ? 6 : 5} sx={{ p: 0 }}>
            <Collapse in={aberto} unmountOnExit>
              <Detalhe r={r} />
            </Collapse>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

interface Opcoes {
  modulos: string[];
  usuarios: { usuarioId: string; usuarioNome: string | null }[];
}

/**
 * Trilha de auditoria com filtros. Com `clienteId`, mostra só o histórico
 * daquele cliente (usado na ficha do cliente) e esconde os filtros de módulo.
 */
export function AuditoriaView({ clienteId, compacto = false }: { clienteId?: string; compacto?: boolean }): React.JSX.Element {
  const [itens, setItens] = React.useState<RegistroAuditoria[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pagina, setPagina] = React.useState(0);
  const [porPagina, setPorPagina] = React.useState(compacto ? 10 : 50);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);
  const [opcoes, setOpcoes] = React.useState<Opcoes>({ modulos: [], usuarios: [] });

  const [busca, setBusca] = React.useState('');
  const [buscaAplicada, setBuscaAplicada] = React.useState('');
  const [usuarioId, setUsuarioId] = React.useState('');
  const [modulo, setModulo] = React.useState('');
  const [acao, setAcao] = React.useState('');
  const [de, setDe] = React.useState(compacto ? '' : dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [ate, setAte] = React.useState('');

  React.useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 400);
    return () => clearTimeout(t);
  }, [busca]);

  React.useEffect(() => {
    if (compacto) return;
    api<Opcoes>('/auditoria/opcoes')
      .then(setOpcoes)
      .catch(() => {});
  }, [compacto]);

  React.useEffect(() => {
    setPagina(0);
  }, [buscaAplicada, usuarioId, modulo, acao, de, ate]);

  React.useEffect(() => {
    const p = new URLSearchParams({ pagina: String(pagina + 1), porPagina: String(porPagina) });
    if (clienteId) p.set('clienteId', clienteId);
    if (buscaAplicada) p.set('busca', buscaAplicada);
    if (usuarioId) p.set('usuarioId', usuarioId);
    if (modulo) p.set('modulo', modulo);
    if (acao) p.set('acao', acao);
    if (de) p.set('de', de);
    if (ate) p.set('ate', ate);
    setCarregando(true);
    api<{ total: number; itens: RegistroAuditoria[] }>(`/auditoria?${p.toString()}`)
      .then((r) => {
        setItens(r.itens);
        setTotal(r.total);
        setErro(null);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar a auditoria'))
      .finally(() => setCarregando(false));
  }, [clienteId, pagina, porPagina, buscaAplicada, usuarioId, modulo, acao, de, ate]);

  const mostrarModulo = !clienteId;

  return (
    <Stack spacing={2}>
      {compacto ? null : (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              size="small"
              label="Buscar"
              placeholder="Cliente, campo, usuário…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              sx={{ minWidth: 240, flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MagnifyingGlassIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField select size="small" label="Usuário" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="">Todos</MenuItem>
              {opcoes.usuarios.map((u) => (
                <MenuItem key={u.usuarioId} value={u.usuarioId}>
                  {u.usuarioNome ?? u.usuarioId}
                </MenuItem>
              ))}
            </TextField>
            {mostrarModulo ? (
              <TextField select size="small" label="Módulo" value={modulo} onChange={(e) => setModulo(e.target.value)} sx={{ minWidth: 180 }}>
                <MenuItem value="">Todos</MenuItem>
                {opcoes.modulos.map((m) => (
                  <MenuItem key={m} value={m} sx={{ textTransform: 'capitalize' }}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
            <TextField select size="small" label="Ação" value={acao} onChange={(e) => setAcao(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">Todas</MenuItem>
              {Object.entries(ACOES).map(([v, a]) => (
                <MenuItem key={v} value={v}>
                  {a.rotulo}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" type="date" label="De" value={de} onChange={(e) => setDe(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" type="date" label="Até" value={ate} onChange={(e) => setAte(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
        </Paper>
      )}

      {erro ? <Alert severity="error">{erro}</Alert> : null}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Quando</TableCell>
              <TableCell>Quem</TableCell>
              <TableCell>Ação</TableCell>
              {mostrarModulo ? <TableCell>Módulo</TableCell> : null}
              <TableCell>O que</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itens.map((r) => (
              <Linha key={r.id} r={r} mostrarModulo={mostrarModulo} />
            ))}
            {!carregando && itens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Nenhum registro {clienteId ? 'para este cliente' : 'com esses filtros'}.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={pagina}
          onPageChange={(_e, p) => setPagina(p)}
          rowsPerPage={porPagina}
          onRowsPerPageChange={(e) => setPorPagina(Number(e.target.value))}
          rowsPerPageOptions={compacto ? [10, 25, 50] : [25, 50, 100]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </TableContainer>
    </Stack>
  );
}
