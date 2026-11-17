'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { BellSlashIcon } from '@phosphor-icons/react/dist/ssr/BellSlash';

import { api } from '@/lib/api';
import { useEventos } from '@/lib/eventos';
import type { Notificacao, PaginaNotificacoes, PreferenciaTipo } from '@/lib/notificacoes';

import { ItemNotificacao } from './item-notificacao';

type Filtro = 'nao_lidas' | 'todas' | 'arquivadas';

const CATEGORIAS = ['obrigações', 'entregas ao cliente', 'atendimento', 'clientes', 'SIEG e certificados', 'conta'];

function Caixa(): React.JSX.Element {
  const router = useRouter();
  const [filtro, setFiltro] = React.useState<Filtro>('nao_lidas');
  const [categoria, setCategoria] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [porPagina, setPorPagina] = React.useState(20);
  const [dados, setDados] = React.useState<PaginaNotificacoes | null>(null);
  const [selecionadas, setSelecionadas] = React.useState<Set<string>>(new Set());
  const [erro, setErro] = React.useState<string | null>(null);

  const carregar = React.useCallback(() => {
    const p = new URLSearchParams({ filtro, pagina: String(pagina + 1), porPagina: String(porPagina) });
    if (categoria) p.set('categoria', categoria);
    api<PaginaNotificacoes>(`/notificacoes?${p.toString()}`)
      .then((r) => {
        setDados(r);
        setErro(null);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar'));
  }, [filtro, categoria, pagina, porPagina]);

  React.useEffect(() => {
    carregar();
  }, [carregar]);
  React.useEffect(() => {
    setPagina(0);
    setSelecionadas(new Set());
  }, [filtro, categoria]);
  useEventos((evento) => {
    if (evento.tipo === 'notificacao') carregar();
  });

  const itens = dados?.itens ?? [];
  const todasMarcadas = itens.length > 0 && itens.every((i) => selecionadas.has(i.id));

  async function acao(caminho: string, corpo: Record<string, unknown>): Promise<void> {
    try {
      await api(caminho, { method: 'POST', body: JSON.stringify(corpo) });
      setSelecionadas(new Set());
      carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir');
    }
  }

  function abrir(n: Notificacao): void {
    if (!n.lidaEm) void api('/notificacoes/lidas', { method: 'POST', body: JSON.stringify({ ids: [n.id] }) }).catch(() => {});
    if (n.href) router.push(n.href);
    else carregar();
  }

  const ids = [...selecionadas];

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {(
            [
              ['nao_lidas', `Não lidas${dados?.naoLidas ? ` (${dados.naoLidas})` : ''}`],
              ['todas', 'Todas'],
              ['arquivadas', 'Arquivadas'],
            ] as const
          ).map(([v, r]) => (
            <Chip key={v} label={r} color={filtro === v ? 'primary' : 'default'} variant={filtro === v ? 'filled' : 'outlined'} onClick={() => setFiltro(v)} />
          ))}
        </Stack>
        <TextField select size="small" label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="">Todas</MenuItem>
          {CATEGORIAS.map((c) => (
            <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>
              {c}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {erro ? <Alert severity="error">{erro}</Alert> : null}

      <Card>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 1, py: 0.5, minHeight: 52, flexWrap: 'wrap' }}>
          <Checkbox
            checked={todasMarcadas}
            indeterminate={selecionadas.size > 0 && !todasMarcadas}
            onChange={() => setSelecionadas(todasMarcadas ? new Set() : new Set(itens.map((i) => i.id)))}
            inputProps={{ 'aria-label': 'Selecionar todas desta página' }}
          />
          {selecionadas.size > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary">
                {selecionadas.size} selecionada(s)
              </Typography>
              {filtro === 'arquivadas' ? (
                <Button size="small" onClick={() => void acao('/notificacoes/arquivar', { ids, desfazer: true })}>
                  Desarquivar
                </Button>
              ) : (
                <>
                  <Button size="small" onClick={() => void acao('/notificacoes/lidas', { ids })}>
                    Marcar como lidas
                  </Button>
                  <Button size="small" onClick={() => void acao('/notificacoes/nao-lidas', { ids })}>
                    Marcar como não lidas
                  </Button>
                  <Button size="small" onClick={() => void acao('/notificacoes/arquivar', { ids })}>
                    Arquivar
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              {dados?.naoLidas ? (
                <Button size="small" onClick={() => void acao('/notificacoes/lidas', {})}>
                  Marcar todas como lidas
                </Button>
              ) : null}
              {filtro === 'arquivadas' ? null : (
                <Button size="small" color="secondary" onClick={() => void acao('/notificacoes/arquivar', { todasLidas: true })}>
                  Arquivar as lidas
                </Button>
              )}
            </>
          )}
        </Stack>
        <Divider />
        {dados && itens.length === 0 ? (
          <Stack spacing={1} sx={{ alignItems: 'center', py: 8, color: 'text.secondary' }}>
            <BellSlashIcon fontSize="var(--icon-fontSize-lg)" />
            <Typography variant="body2">
              {filtro === 'nao_lidas' ? 'Nenhuma notificação não lida.' : filtro === 'arquivadas' ? 'Nada arquivado.' : 'Nenhuma notificação.'}
            </Typography>
          </Stack>
        ) : (
          itens.map((n) => (
            <ItemNotificacao
              key={n.id}
              n={n}
              onAbrir={abrir}
              onArquivar={(x) => void acao('/notificacoes/arquivar', { ids: [x.id] })}
              selecao={
                <Checkbox
                  size="small"
                  sx={{ mt: -0.75, ml: -1 }}
                  checked={selecionadas.has(n.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    setSelecionadas((s) => {
                      const novo = new Set(s);
                      if (novo.has(n.id)) novo.delete(n.id);
                      else novo.add(n.id);
                      return novo;
                    })
                  }
                />
              }
            />
          ))
        )}
        <TablePagination
          component="div"
          count={dados?.total ?? 0}
          page={pagina}
          onPageChange={(_e, p) => setPagina(p)}
          rowsPerPage={porPagina}
          onRowsPerPageChange={(e) => setPorPagina(Number(e.target.value))}
          rowsPerPageOptions={[20, 50, 100]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Card>
      <Typography variant="caption" color="text.secondary">
        Notificações lidas somem depois de 90 dias, e as arquivadas depois de 30.
      </Typography>
    </Stack>
  );
}

function Preferencias(): React.JSX.Element {
  const [tipos, setTipos] = React.useState<PreferenciaTipo[] | null>(null);
  const [emailDisponivel, setEmailDisponivel] = React.useState(false);
  const [alterado, setAlterado] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);
  const [msg, setMsg] = React.useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  React.useEffect(() => {
    api<{ emailDisponivel: boolean; tipos: PreferenciaTipo[] }>('/notificacoes/preferencias')
      .then((r) => {
        setTipos(r.tipos);
        setEmailDisponivel(r.emailDisponivel);
      })
      .catch((error: unknown) => setMsg({ tipo: 'error', texto: error instanceof Error ? error.message : 'Erro ao carregar' }));
  }, []);

  const mudar = (tipo: string, campo: 'app' | 'email', valor: boolean) => {
    setAlterado(true);
    setMsg(null);
    setTipos((l) => l?.map((t) => (t.tipo === tipo ? { ...t, [campo]: valor } : t)) ?? l);
  };

  async function salvar(): Promise<void> {
    if (!tipos) return;
    setSalvando(true);
    try {
      await api('/notificacoes/preferencias', {
        method: 'PUT',
        body: JSON.stringify({ preferencias: tipos.map(({ tipo, app, email }) => ({ tipo, app, email })) }),
      });
      setAlterado(false);
      setMsg({ tipo: 'success', texto: 'Preferências salvas.' });
    } catch (error) {
      setMsg({ tipo: 'error', texto: error instanceof Error ? error.message : 'Não foi possível salvar' });
    } finally {
      setSalvando(false);
    }
  }

  const categorias = [...new Set((tipos ?? []).map((t) => t.categoria))];

  return (
    <Stack spacing={2}>
      {emailDisponivel ? null : (
        <Alert severity="info">
          O envio de e-mails ainda não está ligado no servidor. Você já pode escolher o que quer receber por e-mail: vale assim
          que for configurado.
        </Alert>
      )}
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Aviso</TableCell>
              <TableCell align="center" sx={{ width: 110 }}>
                No sistema
              </TableCell>
              <TableCell align="center" sx={{ width: 110 }}>
                Por e-mail
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categorias.map((c) => (
              <React.Fragment key={c}>
                <TableRow>
                  <TableCell colSpan={3} sx={{ bgcolor: 'var(--mui-palette-background-level1)', py: 1 }}>
                    <Typography variant="overline" color="text.secondary">
                      {c}
                    </Typography>
                  </TableCell>
                </TableRow>
                {(tipos ?? [])
                  .filter((t) => t.categoria === c)
                  .map((t) => (
                    <TableRow key={t.tipo} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{t.rotulo}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t.descricao}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Switch checked={t.app} onChange={(e) => mudar(t.tipo, 'app', e.target.checked)} inputProps={{ 'aria-label': `${t.rotulo} no sistema` }} />
                      </TableCell>
                      <TableCell align="center">
                        <Switch checked={t.email} onChange={(e) => mudar(t.tipo, 'email', e.target.checked)} inputProps={{ 'aria-label': `${t.rotulo} por e-mail` }} />
                      </TableCell>
                    </TableRow>
                  ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Typography variant="caption" color="text.secondary">
        Desligar &quot;No sistema&quot; também desliga o e-mail daquele aviso.
      </Typography>
      {msg ? <Alert severity={msg.tipo}>{msg.texto}</Alert> : null}
      <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
        <Button variant="contained" disabled={!alterado || salvando} onClick={() => void salvar()}>
          {salvando ? 'Salvando…' : 'Salvar preferências'}
        </Button>
      </Stack>
    </Stack>
  );
}

export function NotificacoesView(): React.JSX.Element {
  const [aba, setAba] = React.useState<'caixa' | 'preferencias'>('caixa');
  React.useEffect(() => {
    if (new URLSearchParams(globalThis.location.search).get('aba') === 'preferencias') setAba('preferencias');
  }, []);
  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Notificações</Typography>
        <Typography color="text.secondary" variant="body2">
          Avisos de prazos, entregas, clientes, SIEG e da sua conta. Escolha em Preferências o que receber no sistema e por e-mail.
        </Typography>
      </div>
      <Tabs value={aba} onChange={(_e, v: 'caixa' | 'preferencias') => setAba(v)}>
        <Tab value="caixa" label="Caixa de entrada" />
        <Tab value="preferencias" label="Preferências" />
      </Tabs>
      {aba === 'caixa' ? <Caixa /> : <Preferencias />}
    </Stack>
  );
}
