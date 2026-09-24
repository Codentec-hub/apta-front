'use client';

import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { api } from '@/lib/api';
import { datasDeEntrega } from '@/lib/obrigacao-status';
import type {
  Cliente,
  ClienteObrigacao,
  ConjuntoObrigacoes,
  ContadoresObrigacao,
  TipoObrigacao,
  UsuarioResumo,
} from '@/types/domain';

// Contadores do cadastro da empresa no Acessórias (verde, vermelho, laranja, azul).
const CONTADORES: { chave: keyof ContadoresObrigacao; titulo: string; cor: string }[] = [
  { chave: 'entregues', titulo: 'Entregues/Resolvidas', cor: 'var(--mui-palette-success-main)' },
  { chave: 'atrasoTecnico', titulo: 'Atraso téc.', cor: 'var(--mui-palette-error-main)' },
  { chave: 'proximos30', titulo: 'Próx. 30 dias', cor: 'var(--mui-palette-warning-main)' },
  { chave: 'futuras', titulo: 'Futuras 30d+', cor: 'var(--mui-palette-info-main)' },
];

function Contadores({ valores }: { valores: ContadoresObrigacao }): React.JSX.Element {
  return (
    <Stack direction="row" spacing={0.5}>
      {CONTADORES.map((c) => (
        <Tooltip key={c.chave} title={c.titulo}>
          <Box
            sx={{
              bgcolor: c.cor,
              color: '#fff',
              borderRadius: 0.5,
              minWidth: 44,
              px: 0.75,
              textAlign: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {valores[c.chave]}
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
}

function somar(itens: ClienteObrigacao[]): ContadoresObrigacao {
  const total: ContadoresObrigacao = { entregues: 0, atrasoTecnico: 0, proximos30: 0, futuras: 0 };
  for (const i of itens) {
    if (!i.contadores) continue;
    for (const c of CONTADORES) total[c.chave] += i.contadores[c.chave];
  }
  return total;
}

export interface ObrigacoesDaEmpresaProps {
  cliente: Cliente;
  usuarios: UsuarioResumo[];
  onClienteChange: (cliente: Cliente) => void;
  // Chamado quando as obrigações mudam (as pendências são geradas/removidas
  // automaticamente), para a ficha recarregar a lista de entregas.
  onEntregasAlteradas: () => void;
}

const CHAVE_EXPANDIDOS = 'apta.obrigacoesEmpresa.expandidos';

function lerExpandidos(): Set<string> {
  try {
    return new Set(JSON.parse(globalThis.localStorage.getItem(CHAVE_EXPANDIDOS) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

// Obrigações alocadas na empresa, agrupadas por departamento (como no
// cadastro da empresa no Acessórias). Só as ativas geram entregas.
export function ObrigacoesDaEmpresa({
  cliente,
  usuarios,
  onClienteChange,
  onEntregasAlteradas,
}: ObrigacoesDaEmpresaProps): React.JSX.Element {
  const [itens, setItens] = React.useState<ClienteObrigacao[]>([]);
  const [tipos, setTipos] = React.useState<TipoObrigacao[]>([]);
  const [regimes, setRegimes] = React.useState<ConjuntoObrigacoes[]>([]);
  const [grupos, setGrupos] = React.useState<ConjuntoObrigacoes[]>([]);
  const [ocultarInativas, setOcultarInativas] = React.useState(true);
  const [expandidos, setExpandidos] = React.useState<Set<string>>(new Set());
  const [adicionando, setAdicionando] = React.useState<TipoObrigacao[]>([]);
  const [menu, setMenu] = React.useState<{ el: HTMLElement; tipo: 'regime' | 'grupo' } | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);

  React.useEffect(() => {
    setExpandidos(lerExpandidos());
    Promise.all([
      api<ClienteObrigacao[]>(`/clientes/${cliente.id}/obrigacoes`),
      api<TipoObrigacao[]>('/tipos-obrigacao'),
      api<ConjuntoObrigacoes[]>('/regimes'),
      api<ConjuntoObrigacoes[]>('/grupos-obrigacao'),
    ])
      .then(([itensData, tiposData, regimesData, gruposData]) => {
        setItens(itensData);
        setTipos(tiposData.filter((t) => t.ativo));
        setRegimes(regimesData);
        setGrupos(gruposData);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar obrigações'));
  }, [cliente.id]);

  const porSetor = React.useMemo(() => {
    const mapa = new Map<string, { nome: string; itens: ClienteObrigacao[]; ativas: number }>();
    for (const item of itens) {
      const g = mapa.get(item.tipo.setorId) ?? { nome: item.tipo.setor.nome, itens: [], ativas: 0 };
      if (item.ativa) g.ativas += 1;
      if (item.ativa || !ocultarInativas) g.itens.push(item);
      mapa.set(item.tipo.setorId, g);
    }
    return [...mapa.entries()].sort(([, a], [, b]) => a.nome.localeCompare(b.nome));
  }, [itens, ocultarInativas]);

  const responsavelDoSetor = React.useMemo(
    () => new Map(cliente.responsaveis.map((r) => [r.setorId, r.usuario.nome])),
    [cliente.responsaveis]
  );

  const tiposDisponiveis = React.useMemo(() => {
    const ativos = new Set(itens.filter((i) => i.ativa).map((i) => i.tipoId));
    return tipos.filter((t) => !ativos.has(t.id));
  }, [tipos, itens]);

  function alternarExpandido(setorId: string): void {
    setExpandidos((atual) => {
      const novo = new Set(atual);
      if (novo.has(setorId)) novo.delete(setorId);
      else novo.add(setorId);
      try {
        globalThis.localStorage.setItem(CHAVE_EXPANDIDOS, JSON.stringify([...novo]));
      } catch {
        // preferência de layout; sem storage, só não persiste
      }
      return novo;
    });
  }

  async function executar(acao: () => Promise<ClienteObrigacao[]>, mensagem: string): Promise<void> {
    setErro(null);
    try {
      setItens(await acao());
      setAviso(mensagem);
      onEntregasAlteradas();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar obrigações');
    }
  }

  async function aplicar(conjunto: ConjuntoObrigacoes, tipo: 'regime' | 'grupo'): Promise<void> {
    setMenu(null);
    await executar(
      () =>
        api<ClienteObrigacao[]>(`/clientes/${cliente.id}/${tipo === 'regime' ? 'aplicar-regime' : 'aplicar-grupo'}`, {
          method: 'POST',
          body: JSON.stringify(tipo === 'regime' ? { regimeId: conjunto.id } : { grupoId: conjunto.id }),
        }),
      tipo === 'regime'
        ? `Regime ${conjunto.nome} aplicado — obrigações substituídas`
        : `Grupo ${conjunto.nome} adicionado`
    );
    if (tipo === 'regime') onClienteChange({ ...cliente, regimeTributario: conjunto.nome });
  }

  async function adicionar(): Promise<void> {
    if (adicionando.length === 0) return;
    await executar(
      () =>
        api<ClienteObrigacao[]>(`/clientes/${cliente.id}/obrigacoes`, {
          method: 'POST',
          body: JSON.stringify({ tipoIds: adicionando.map((t) => t.id) }),
        }),
      `${adicionando.length} obrigação(ões) alocada(s)`
    );
    setAdicionando([]);
  }

  async function atualizarItem(
    item: ClienteObrigacao,
    dados: { ativa?: boolean; responsavelId?: string | null; tempoPrevistoMinutos?: number | null }
  ): Promise<void> {
    try {
      const atualizado = await api<ClienteObrigacao>(`/cliente-obrigacoes/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(dados),
      });
      setItens((atual) => atual.map((i) => (i.id === item.id ? atualizado : i)));
      if (dados.ativa !== undefined || dados.responsavelId !== undefined) onEntregasAlteradas();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar obrigação');
    }
  }

  const totalAtivas = itens.filter((i) => i.ativa).length;

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Stack>
          <Typography variant="h6">Obrigações da empresa</Typography>
          <Typography color="text.secondary" variant="caption">
            {totalAtivas} ativa(s) · regime {cliente.regimeTributario ?? 'não definido'}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" onClick={(e) => setMenu({ el: e.currentTarget, tipo: 'regime' })}>
            Aplicar regime
          </Button>
          <Button size="small" variant="outlined" onClick={(e) => setMenu({ el: e.currentTarget, tipo: 'grupo' })}>
            Adicionar grupo
          </Button>
        </Stack>
      </Stack>

      <Menu anchorEl={menu?.el} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu
          ? (menu.tipo === 'regime' ? regimes : grupos).map((c) => (
              <MenuItem key={c.id} onClick={() => aplicar(c, menu.tipo)}>
                <Stack>
                  <span>{c.nome}</span>
                  <Typography color="text.secondary" variant="caption">
                    {menu.tipo === 'regime' ? 'Substitui' : 'Adiciona'} {c.tipoIds.length} obrigação(ões)
                  </Typography>
                </Stack>
              </MenuItem>
            ))
          : null}
      </Menu>

      {erro ? (
        <Alert severity="error" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      ) : null}
      {aviso ? (
        <Alert severity="success" onClose={() => setAviso(null)}>
          {aviso}
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Autocomplete
          multiple
          size="small"
          options={tiposDisponiveis}
          value={adicionando}
          groupBy={(t) => t.setor.nome}
          getOptionLabel={(t) => t.nome}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_e, valor) => setAdicionando(valor)}
          renderInput={(params) => <TextField {...params} label="Alocar obrigações avulsas" />}
          sx={{ minWidth: 320, flex: 1 }}
        />
        <Button size="small" variant="contained" startIcon={<PlusIcon />} disabled={adicionando.length === 0} onClick={adicionar}>
          Alocar
        </Button>
        <FormControlLabel
          control={<Switch size="small" checked={ocultarInativas} onChange={(e) => setOcultarInativas(e.target.checked)} />}
          label="Ocultar inativas"
        />
      </Stack>

      {porSetor.length === 0 ? (
        <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
          Nenhuma obrigação alocada. Aplique o regime tributário da empresa para começar.
        </Typography>
      ) : (
        <Stack>
          {porSetor.map(([setorId, grupo]) => (
            <Accordion
              key={setorId}
              disableGutters
              variant="outlined"
              expanded={expandidos.has(setorId)}
              onChange={() => alternarExpandido(setorId)}
            >
              <AccordionSummary expandIcon={<CaretDownIcon />}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', flex: 1, mr: 1 }}>
                  <Typography variant="subtitle2">{grupo.nome}</Typography>
                  <Chip label={`${grupo.ativas} ativa(s)`} size="small" />
                  <Typography color="text.secondary" variant="caption">
                    Responsável: {responsavelDoSetor.get(setorId) ?? '—'}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Contadores valores={somar(grupo.itens.filter((i) => i.ativa))} />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Table size="small">
                  <TableBody>
                    {grupo.itens.map((item) => (
                      <TableRow key={item.id} sx={item.ativa ? undefined : { opacity: 0.5 }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'primary.main' }}>
                            {item.tipo.nome}
                          </Typography>
                          <Typography color="text.secondary" variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {datasDeEntrega(item.tipo.entregasPorMes).join(' ') || 'Sem datas (avulsa)'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ width: 220 }}>
                          {item.contadores ? <Contadores valores={item.contadores} /> : null}
                        </TableCell>
                        <TableCell sx={{ width: 130 }}>
                          <TextField
                            size="small"
                            type="number"
                            label="Tempo (min)"
                            key={`${item.id}-${item.tempoPrevistoMinutos ?? ''}`}
                            defaultValue={item.tempoPrevistoMinutos ?? ''}
                            placeholder={item.tipo.tempoPrevistoMinutos?.toString() ?? ''}
                            onBlur={(e) => {
                              const valor = e.target.value === '' ? null : Number(e.target.value);
                              if (valor !== item.tempoPrevistoMinutos) atualizarItem(item, { tempoPrevistoMinutos: valor });
                            }}
                            slotProps={{ inputLabel: { shrink: true } }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 240 }}>
                          <Select
                            size="small"
                            fullWidth
                            displayEmpty
                            value={item.responsavelId ?? ''}
                            onChange={(e) => atualizarItem(item, { responsavelId: e.target.value || null })}
                          >
                            <MenuItem value="">
                              <em>Do departamento ({responsavelDoSetor.get(setorId) ?? 'nenhum'})</em>
                            </MenuItem>
                            {usuarios.map((u) => (
                              <MenuItem key={u.id} value={u.id}>
                                {u.nome}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell align="right" sx={{ width: 130 }}>
                          <Select
                            size="small"
                            fullWidth
                            value={item.ativa ? 'S' : 'N'}
                            onChange={(e) => atualizarItem(item, { ativa: e.target.value === 'S' })}
                          >
                            <MenuItem value="S">Ativa? Sim</MenuItem>
                            <MenuItem value="N">Ativa? Não</MenuItem>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
