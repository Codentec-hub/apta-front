'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ChatCircleTextIcon } from '@phosphor-icons/react/dist/ssr/ChatCircleText';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import dayjs from 'dayjs';
import RouterLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { paths } from '@/paths';
import { api } from '@/lib/api';
import { useEventos } from '@/lib/eventos';
import {
  GRUPOS_LEAD,
  STATUS_LEAD,
  horarioCurto,
  relativo,
  type CampoPerfil,
  type Lead,
  type SituacaoFila,
  type StatusLead,
} from '@/lib/leads';
import { useUser } from '@/hooks/use-user';
import { formatarTelefone } from '@/components/dashboard/atendimento/util';

import { LeadDetalheDrawer } from './lead-detalhe';
import { LeadFormDialog } from './lead-form-dialog';

interface Resposta {
  leads: Lead[];
  total: number;
  contagem: Record<StatusLead, number>;
}

interface ConfigResumo {
  disparoAutomatico: boolean;
  enviarConfirmacao: boolean;
  nomeIndicador: string;
}

function proximoPasso(lead: Lead): string {
  const ag = lead.agendamentos[0];
  if (ag) return `${ag.status === 'CONFIRMADO' ? 'Agendado' : 'Reservado'}: ${horarioCurto(ag.inicio)}`;
  switch (lead.status) {
    case 'NOVO': {
      return 'Enviar ao assistente';
    }
    case 'NA_FILA': {
      return lead.naFilaEm ? `Na fila ${relativo(lead.naFilaEm)}` : 'Na fila';
    }
    case 'EM_CONVERSA': {
      return lead.ultimaRespostaEm ? `Respondeu ${relativo(lead.ultimaRespostaEm)}` : 'Aguardando resposta';
    }
    case 'DADOS_COLETADOS': {
      return 'Escolhendo horário';
    }
    default: {
      return lead.motivoEncerramento ?? '—';
    }
  }
}

export function LeadsView(): React.JSX.Element {
  const { user } = useUser();
  const gestao = user?.perfil === 'ADMIN' || user?.perfil === 'GESTOR';
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const leadAberto = params.get('lead');

  const [grupo, setGrupo] = React.useState('ativos');
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [porPagina, setPorPagina] = React.useState(10);
  const [dados, setDados] = React.useState<Resposta | null>(null);
  const [fila, setFila] = React.useState<SituacaoFila | null>(null);
  const [campos, setCampos] = React.useState<CampoPerfil[]>([]);
  const [config, setConfig] = React.useState<ConfigResumo | null>(null);
  const [versao, setVersao] = React.useState(0);
  const [form, setForm] = React.useState<{ aberto: boolean; lead: Lead | null }>({ aberto: false, lead: null });
  const [aviso, setAviso] = React.useState<{ texto: string; erro?: boolean } | null>(null);

  const status = GRUPOS_LEAD.find((g) => g.valor === grupo)?.status ?? [];

  const carregar = React.useCallback(() => {
    const q = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) });
    if (status.length > 0) q.set('status', status.join(','));
    if (busca.trim()) q.set('busca', busca.trim());
    api<Resposta>(`/leads?${q.toString()}`)
      .then(setDados)
      .catch((error: unknown) => setAviso({ texto: error instanceof Error ? error.message : 'Erro ao carregar', erro: true }));
    api<SituacaoFila>('/leads/fila')
      .then(setFila)
      .catch(() => setFila(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- status deriva de grupo
  }, [grupo, busca, pagina, porPagina]);

  React.useEffect(() => {
    const t = setTimeout(carregar, busca ? 250 : 0);
    return () => clearTimeout(t);
  }, [carregar, busca, versao]);

  React.useEffect(() => {
    api<{ campos: CampoPerfil[] }>('/leads/campos')
      .then((r) => setCampos(r.campos))
      .catch(() => setCampos([]));
    api<ConfigResumo>('/configuracoes/leads')
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  useEventos((evento) => {
    if (evento.tipo === 'leads') setVersao((v) => v + 1);
  });

  const abrirLead = (id: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (id) q.set('lead', id);
    else q.delete('lead');
    router.replace(q.size > 0 ? `${pathname}?${q.toString()}` : pathname, { scroll: false });
  };

  async function enviar(lead: Lead): Promise<void> {
    try {
      await api(`/leads/${lead.id}/enviar`, { method: 'POST' });
      setAviso({ texto: `${lead.nome} entrou na fila do assistente.` });
      setVersao((v) => v + 1);
    } catch (error) {
      setAviso({ texto: error instanceof Error ? error.message : 'Erro', erro: true });
    }
  }

  const contagemGrupo = (g: (typeof GRUPOS_LEAD)[number]) =>
    dados ? (g.status.length > 0 ? g.status : (Object.keys(dados.contagem) as StatusLead[])).reduce((s, st) => s + (dados.contagem[st] ?? 0), 0) : 0;

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h4">Leads</Typography>
          <Typography color="text.secondary" variant="body2">
            Contatos passados pelo comercial. O assistente chama no WhatsApp, confere o perfil e pré-reserva a conversa; a equipe confirma
            na Agenda.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          {gestao ? (
            <Tooltip title="Configurar assistente e fila">
              <IconButton component={RouterLink} href={paths.dashboard.leadsConfiguracao}>
                <GearSixIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setForm({ aberto: true, lead: null })}>
            Novo lead
          </Button>
        </Stack>
      </Stack>

      {fila && (fila.naFila > 0 || fila.lembretesPendentes > 0 || fila.enviadosHoje > 0 || fila.pausa) ? (
        <Alert severity={fila.pausa && fila.naFila > 0 ? 'warning' : 'info'} variant="outlined">
          <strong>Fila do assistente:</strong> {fila.naFila} aguardando · {fila.enviadosHoje} de {fila.tetoDiario} envios hoje
          {fila.lembretesPendentes ? ` · ${fila.lembretesPendentes} lembrete(s) pendente(s)` : ''}
          {fila.pausa
            ? ` · ${fila.pausa}`
            : fila.naFila > 0 && fila.proximoEnvioEm
              ? ` · próximo envio ${dayjs(fila.proximoEnvioEm).isBefore(dayjs().add(1, 'minute')) ? 'em instantes' : `às ${dayjs(fila.proximoEnvioEm).format('HH:mm')}`}`
              : ''}
        </Alert>
      ) : null}

      <Paper variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ px: 2, pt: 1, gap: 1, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Tabs
            value={grupo}
            onChange={(_e, v: string) => {
              setGrupo(v);
              setPagina(0);
            }}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {GRUPOS_LEAD.map((g) => (
              <Tab key={g.valor} value={g.valor} label={`${g.titulo} (${contagemGrupo(g)})`} />
            ))}
          </Tabs>
          <TextField
            size="small"
            placeholder="Buscar por nome, telefone ou origem"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(0);
            }}
            sx={{ minWidth: { md: 300 }, pb: { xs: 1, md: 0 } }}
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
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Lead</TableCell>
                <TableCell>WhatsApp</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Próximo passo</TableCell>
                <TableCell>Cadastro</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {dados && dados.leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic', py: 2 }}>
                      {busca ? 'Nenhum lead encontrado.' : 'Nenhum lead aqui. Cadastre com "Novo lead" (dá para colar a mensagem do anúncio).'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (dados?.leads ?? []).map((lead) => (
                  <TableRow key={lead.id} hover sx={{ cursor: 'pointer' }} onClick={() => abrirLead(lead.id)}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {lead.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[lead.origem, lead.qualificacao?.split('—')[0]?.trim()].filter(Boolean).join(' · ') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatarTelefone(lead.telefone)}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_LEAD[lead.status].rotulo} color={STATUS_LEAD[lead.status].cor} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{proximoPasso(lead)}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2">{dayjs(lead.createdAt).format('DD/MM HH:mm')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lead.cadastradoPor?.nome ?? ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      {lead.status === 'NOVO' ? (
                        <Button size="small" variant="contained" startIcon={<PaperPlaneTiltIcon />} onClick={() => void enviar(lead)}>
                          Enviar ao assistente
                        </Button>
                      ) : null}
                      {lead.conversaId ? (
                        <Tooltip title="Abrir conversa">
                          <IconButton size="small" component={RouterLink} href={`${paths.dashboard.atendimento}?conversa=${lead.conversaId}`}>
                            <ChatCircleTextIcon />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={dados?.total ?? 0}
          page={pagina}
          rowsPerPage={porPagina}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_e, p) => setPagina(p)}
          onRowsPerPageChange={(e) => {
            setPorPagina(Number(e.target.value));
            setPagina(0);
          }}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>

      <LeadFormDialog
        open={form.aberto}
        lead={form.lead}
        campos={campos}
        disparoAutomatico={Boolean(config?.disparoAutomatico)}
        onClose={() => setForm({ aberto: false, lead: null })}
        onSaved={(lead, enviado) => {
          setForm({ aberto: false, lead: null });
          setAviso({ texto: enviado ? `${lead.nome} cadastrado e na fila do assistente.` : 'Lead salvo.' });
          setVersao((v) => v + 1);
        }}
      />
      <LeadDetalheDrawer
        leadId={leadAberto}
        campos={campos}
        versao={versao}
        podeExcluir={gestao}
        enviarConfirmacao={config?.enviarConfirmacao ?? true}
        onClose={() => abrirLead(null)}
        onEditar={(l) => setForm({ aberto: true, lead: { ...l, agendamentos: [] } })}
        onAviso={(texto, erro) => {
          setAviso({ texto, erro });
          setVersao((v) => v + 1);
        }}
      />

      <Snackbar open={Boolean(aviso)} autoHideDuration={5000} onClose={() => setAviso(null)}>
        <Alert onClose={() => setAviso(null)} severity={aviso?.erro ? 'error' : 'success'} sx={{ width: '100%' }}>
          {aviso?.texto}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
