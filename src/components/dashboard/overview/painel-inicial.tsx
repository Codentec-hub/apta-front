'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { BuildingsIcon } from '@phosphor-icons/react/dist/ssr/Buildings';
import { CalendarCheckIcon } from '@phosphor-icons/react/dist/ssr/CalendarCheck';
import { CalendarDotsIcon } from '@phosphor-icons/react/dist/ssr/CalendarDots';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { EnvelopeOpenIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeOpen';
import { WarningOctagonIcon } from '@phosphor-icons/react/dist/ssr/WarningOctagon';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { paths } from '@/paths';

interface ItemAgenda {
  id: string;
  nome: string;
  prazo: string;
  prazoTecnico: string | null;
  cliente: { id: string; razaoSocial: string; nomeFantasia: string | null };
  setor: string | null;
  responsavel: { id: string; nome: string } | null;
  justificada: boolean;
  situacao: 'atrasada' | 'hoje' | 'semana';
}

interface DadosPainel {
  escopo: 'meu' | 'escritorio';
  podeVerEscritorio: boolean;
  hoje: string;
  kpis: {
    clientesAtivos: number;
    mes: {
      total: number;
      entregues: number;
      entreguesNoPrazo: number;
      entreguesAtrasadas: number;
      pendentesNoPrazo: number;
      vencidasNoMes: number;
      percentualNoPrazo: number | null;
    };
    vencidas: number;
    venceHoje: number;
    venceSemana: number;
    guiasNaoLidas: number;
    atendimentosAbertos: number;
    pendenciasClientes: number;
  };
  agenda: ItemAgenda[];
  porDia: { dia: string; total: number }[];
  semanas: { inicio: string; noPrazo: number; atrasadas: number }[];
  porSetor: { setor: string; total: number; noPrazo: number; atrasadas: number; pendentes: number }[];
  alertas: { severidade: 'error' | 'warning' | 'info'; titulo: string; detalhe: string; href: string }[];
  sieg: { notasNoMes: number; empresas: number; ultimaCaptura: string | null } | null;
}

interface Atividade {
  id: string;
  criadoEm: string;
  usuarioNome: string | null;
  descricao: string;
  acao: string;
}

const COR = {
  ok: 'var(--mui-palette-success-main)',
  atraso: 'var(--mui-palette-error-main)',
  neutro: 'var(--mui-palette-primary-main)',
  trilho: 'var(--mui-palette-neutral-100)',
};

/** "Terça-feira, 17 de novembro de 2026" */
function dataPorExtenso(): string {
  const t = dayjs().format('dddd, D [de] MMMM [de] YYYY');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function saudacao(): string {
  const h = dayjs().hour();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ------------------------------------------------------------------ KPIs

function Kpi({
  titulo,
  valor,
  detalhe,
  icone: Icone,
  cor,
  href,
}: {
  titulo: string;
  valor: React.ReactNode;
  detalhe?: React.ReactNode;
  icone: Icon;
  cor: 'error' | 'warning' | 'success' | 'primary' | 'info' | 'secondary';
  href?: string;
}): React.JSX.Element {
  const conteudo = (
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" variant="overline" sx={{ lineHeight: 1.4 }}>
            {titulo}
          </Typography>
          <Typography variant="h4">{valor}</Typography>
          {detalhe ? (
            <Typography color="text.secondary" variant="caption">
              {detalhe}
            </Typography>
          ) : null}
        </Stack>
        <Avatar sx={{ bgcolor: `var(--mui-palette-${cor}-main)`, height: 44, width: 44 }}>
          <Icone fontSize="var(--icon-fontSize-lg)" />
        </Avatar>
      </Stack>
    </CardContent>
  );
  return (
    <Card sx={{ height: '100%', transition: 'box-shadow .15s', '&:hover': href ? { boxShadow: 6 } : undefined }}>
      {href ? (
        <Box component={RouterLink} href={href} sx={{ color: 'inherit', textDecoration: 'none', display: 'block', height: '100%' }}>
          {conteudo}
        </Box>
      ) : (
        conteudo
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- agenda

const SITUACAO: Record<ItemAgenda['situacao'], { rotulo: string; cor: 'error' | 'warning' | 'default' }> = {
  atrasada: { rotulo: 'Atrasada', cor: 'error' },
  hoje: { rotulo: 'Hoje', cor: 'warning' },
  semana: { rotulo: 'Próximos 7 dias', cor: 'default' },
};

function Agenda({ itens, escopo }: { itens: ItemAgenda[]; escopo: DadosPainel['escopo'] }): React.JSX.Element {
  const grupos = (['atrasada', 'hoje', 'semana'] as const)
    .map((s) => ({ s, itens: itens.filter((i) => i.situacao === s) }))
    .filter((g) => g.itens.length > 0);
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Agenda de prazos"
        subheader={escopo === 'meu' ? 'Entregas sob sua responsabilidade' : 'Entregas de todo o escritório'}
        action={
          <Button component={RouterLink} href={paths.dashboard.obrigacoes} size="small" endIcon={<ArrowRightIcon />}>
            Ver todas
          </Button>
        }
      />
      <Divider />
      {grupos.length === 0 ? (
        <CardContent>
          <Stack spacing={1} sx={{ alignItems: 'center', py: 4, color: 'success.main' }}>
            <CheckCircleIcon fontSize="var(--icon-fontSize-lg)" />
            <Typography variant="body2" color="text.secondary">
              Nada atrasado e nada vencendo nos próximos 7 dias.
            </Typography>
          </Stack>
        </CardContent>
      ) : (
        <Box sx={{ maxHeight: 440, overflowY: 'auto' }}>
          {grupos.map((g) => (
            <Box key={g.s}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', px: 2.5, py: 1, bgcolor: 'var(--mui-palette-background-level1)' }}
              >
                <Chip size="small" color={SITUACAO[g.s].cor} label={SITUACAO[g.s].rotulo} />
                <Typography variant="caption" color="text.secondary">
                  {g.itens.length} entrega(s)
                </Typography>
              </Stack>
              {g.itens.map((i) => (
                <Stack
                  key={i.id}
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: 'center', px: 2.5, py: 1.25, borderBottom: '1px solid var(--mui-palette-divider)' }}
                >
                  <Box sx={{ width: 52, textAlign: 'center', flexShrink: 0 }}>
                    <Typography variant="h6" sx={{ lineHeight: 1 }} color={g.s === 'atrasada' ? 'error.main' : undefined}>
                      {dayjs(i.prazo).format('DD')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                      {dayjs(i.prazo).format('MMM')}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" noWrap>
                      {i.nome}
                    </Typography>
                    <Link
                      component={RouterLink}
                      href={`${paths.dashboard.clientes}/${i.cliente.id}`}
                      variant="body2"
                      color="text.secondary"
                      underline="hover"
                      noWrap
                      sx={{ display: 'block' }}
                    >
                      {i.cliente.nomeFantasia || i.cliente.razaoSocial}
                    </Link>
                  </Box>
                  <Stack spacing={0.5} sx={{ alignItems: 'flex-end', flexShrink: 0, display: { xs: 'none', sm: 'flex' } }}>
                    {i.setor ? <Chip size="small" variant="outlined" label={i.setor} /> : null}
                    {escopo === 'escritorio' ? (
                      <Typography variant="caption" color="text.secondary">
                        {i.responsavel?.nome ?? 'Sem responsável'}
                      </Typography>
                    ) : null}
                  </Stack>
                  {g.s === 'atrasada' && !i.justificada ? (
                    <Tooltip title="Atrasada sem justificativa">
                      <Box sx={{ color: 'error.main', display: 'flex' }}>
                        <WarningOctagonIcon />
                      </Box>
                    </Tooltip>
                  ) : null}
                </Stack>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
}

// --------------------------------------------------------------- gráficos

/** Vencimentos por dia: barras verticais finas, hoje em destaque. */
function VencimentosPorDia({ dias, hoje }: { dias: DadosPainel['porDia']; hoje: string }): React.JSX.Element {
  const max = Math.max(1, ...dias.map((d) => d.total));
  return (
    <Card>
      <CardHeader title="Vencimentos" subheader="Entregas em aberto nos próximos 14 dias" />
      <Divider />
      <CardContent>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-end', height: 160 }}>
          {dias.map((d) => {
            const fimDeSemana = [0, 6].includes(dayjs(d.dia).day());
            return (
              <Tooltip key={d.dia} title={`${dayjs(d.dia).format('ddd, DD/MM')}: ${d.total} vencimento(s)`} arrow>
                <Stack spacing={0.5} sx={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'default' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, minHeight: 14 }}>
                    {d.total > 0 ? d.total : ''}
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 18,
                      height: `${Math.max(d.total > 0 ? 6 : 2, (d.total / max) * 110)}px`,
                      bgcolor: d.total > 0 ? COR.neutro : COR.trilho,
                      opacity: d.dia === hoje ? 1 : 0.75,
                      borderRadius: '4px 4px 0 0',
                      outline: d.dia === hoje ? '2px solid var(--mui-palette-warning-main)' : 'none',
                      outlineOffset: 2,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 10, fontWeight: d.dia === hoje ? 700 : 400 }}
                    color={fimDeSemana ? 'text.disabled' : 'text.secondary'}
                  >
                    {dayjs(d.dia).format('DD')}
                  </Typography>
                </Stack>
              </Tooltip>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }): React.JSX.Element {
  return (
    <Stack direction="row" spacing={2}>
      {itens.map((i) => (
        <Stack key={i.rotulo} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: i.cor }} />
          <Typography variant="caption" color="text.secondary">
            {i.rotulo}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

const alturaBarra = (n: number, max: number) => `${(n / max) * 140}px`;

/** Entregas por semana: barras empilhadas (no prazo embaixo, com atraso em cima). */
function EntregasPorSemana({ semanas }: { semanas: DadosPainel['semanas'] }): React.JSX.Element {
  const max = Math.max(1, ...semanas.map((s) => s.noPrazo + s.atrasadas));
  const total = semanas.reduce((t, s) => t + s.noPrazo + s.atrasadas, 0);
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Entregas por semana"
        subheader="Últimas 8 semanas"
      />
      <Divider />
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Legenda itens={[{ cor: COR.ok, rotulo: 'No prazo' }, { cor: COR.atraso, rotulo: 'Com atraso' }]} />
        </Box>
        {total === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
            Ainda não há entregas concluídas nessas semanas.
          </Typography>
        ) : (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', height: 180 }}>
            {semanas.map((s) => {
              const soma = s.noPrazo + s.atrasadas;
              return (
                <Tooltip
                  key={s.inicio}
                  arrow
                  title={`Semana de ${dayjs(s.inicio).format('DD/MM')}: ${s.noPrazo} no prazo, ${s.atrasadas} com atraso`}
                >
                  <Stack sx={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'default' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, fontSize: 11 }}>
                      {soma || ''}
                    </Typography>
                    <Stack sx={{ width: '100%', maxWidth: 28, gap: '2px' }}>
                      {s.atrasadas > 0 ? (
                        <Box sx={{ height: alturaBarra(s.atrasadas, max), bgcolor: COR.atraso, borderRadius: '4px 4px 0 0' }} />
                      ) : null}
                      {s.noPrazo > 0 ? (
                        <Box
                          sx={{ height: alturaBarra(s.noPrazo, max), bgcolor: COR.ok, borderRadius: s.atrasadas > 0 ? 0 : '4px 4px 0 0' }}
                        />
                      ) : (
                        <Box sx={{ height: 2, bgcolor: COR.trilho }} />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, fontSize: 11 }}>
                      {dayjs(s.inicio).format('DD/MM')}
                    </Typography>
                  </Stack>
                </Tooltip>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/** Cumprimento por setor no mês: barra 100% dividida em no prazo / atraso / pendente. */
function CumprimentoPorSetor({ setores }: { setores: DadosPainel['porSetor'] }): React.JSX.Element {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Prazos do mês por setor"
        subheader="Vencimentos deste mês"
      />
      <Divider />
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Legenda
            itens={[
              { cor: COR.ok, rotulo: 'No prazo' },
              { cor: COR.atraso, rotulo: 'Atraso' },
              { cor: COR.trilho, rotulo: 'A fazer' },
            ]}
          />
        </Box>
        {setores.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
            Nenhuma entrega vence neste mês.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {setores.map((s) => {
              const pct = (n: number) => `${(n / s.total) * 100}%`;
              const comDesfecho = s.noPrazo + s.atrasadas;
              return (
                <Tooltip
                  key={s.setor}
                  arrow
                  title={`${s.noPrazo} no prazo · ${s.atrasadas} com atraso · ${s.pendentes} a fazer`}
                >
                  <Stack spacing={0.75} sx={{ cursor: 'default' }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {s.setor}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {comDesfecho ? `${Math.round((s.noPrazo / comDesfecho) * 100)}% no prazo` : '—'} · {s.total}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ height: 10, borderRadius: '5px', overflow: 'hidden', gap: '2px', bgcolor: COR.trilho }}>
                      {s.noPrazo > 0 ? <Box sx={{ width: pct(s.noPrazo), bgcolor: COR.ok }} /> : null}
                      {s.atrasadas > 0 ? <Box sx={{ width: pct(s.atrasadas), bgcolor: COR.atraso }} /> : null}
                    </Stack>
                  </Stack>
                </Tooltip>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function AtividadeRecente(): React.JSX.Element {
  const [itens, setItens] = React.useState<Atividade[] | null>(null);
  React.useEffect(() => {
    api<{ itens: Atividade[] }>('/auditoria?porPagina=10')
      .then((r) => setItens(r.itens.filter((i) => i.acao !== 'login' && i.acao !== 'login_falhou').slice(0, 7)))
      .catch(() => setItens([]));
  }, []);
  return (
    <Card>
      <CardHeader
        title="Atividade recente"
        action={
          <Button component={RouterLink} href={paths.dashboard.auditoria} size="small" endIcon={<ArrowRightIcon />}>
            Auditoria
          </Button>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        {itens === null ? (
          <Box sx={{ p: 2 }}>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </Box>
        ) : itens.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            Nenhuma alteração registrada ainda.
          </Typography>
        ) : (
          itens.map((i) => (
            <Stack key={i.id} direction="row" spacing={1.5} sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid var(--mui-palette-divider)' }}>
              <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>{(i.usuarioNome ?? 'S').charAt(0)}</Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                  <strong>{i.usuarioNome?.split(' ')[0] ?? 'Sistema'}</strong> · {i.descricao}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(i.criadoEm).format('DD/MM HH:mm')}
                </Typography>
              </Box>
            </Stack>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------- principal

export function PainelInicial(): React.JSX.Element {
  const { user } = useUser();
  const [escopo, setEscopo] = React.useState<'meu' | 'escritorio' | null>(null);
  const [dados, setDados] = React.useState<DadosPainel | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    api<DadosPainel>(`/painel${escopo ? `?escopo=${escopo}` : ''}`)
      .then((d) => {
        setDados(d);
        setErro(null);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar o painel'));
  }, [escopo]);

  const k = dados?.kpis;
  const gestao = Boolean(dados?.podeVerEscritorio);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
        <div>
          <Typography variant="h4">
            {saudacao()}, {user?.nome?.split(' ')[0] ?? ''}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {dataPorExtenso()}
          </Typography>
        </div>
        {gestao ? (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={dados?.escopo ?? 'escritorio'}
            onChange={(_e, v: 'meu' | 'escritorio' | null) => v && setEscopo(v)}
          >
            <ToggleButton value="meu">Minhas entregas</ToggleButton>
            <ToggleButton value="escritorio">Escritório</ToggleButton>
          </ToggleButtonGroup>
        ) : null}
      </Stack>

      {erro ? <Alert severity="error">{erro}</Alert> : null}

      <Grid container spacing={2.5}>
        {k ? (
          <>
            <Grid size={{ xs: 12, sm: 6, md: gestao ? 4 : 6, lg: gestao ? 2.4 : 3 }}>
              <Kpi
                titulo="Atrasadas"
                valor={k.vencidas}
                detalhe={k.vencidas ? 'Prazo legal já passou' : 'Nenhuma em atraso'}
                icone={WarningOctagonIcon}
                cor={k.vencidas ? 'error' : 'success'}
                href={paths.dashboard.obrigacoes}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: gestao ? 4 : 6, lg: gestao ? 2.4 : 3 }}>
              <Kpi
                titulo="Vencem hoje"
                valor={k.venceHoje}
                detalhe={`${k.venceSemana} nos próximos 7 dias`}
                icone={CalendarDotsIcon}
                cor={k.venceHoje ? 'warning' : 'primary'}
                href={paths.dashboard.obrigacoes}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: gestao ? 4 : 6, lg: gestao ? 2.4 : 3 }}>
              <Kpi
                titulo="No prazo no mês"
                valor={k.mes.percentualNoPrazo === null ? '—' : `${k.mes.percentualNoPrazo}%`}
                detalhe={`${k.mes.entregues} de ${k.mes.total} entregues`}
                icone={CalendarCheckIcon}
                cor={k.mes.percentualNoPrazo === null || k.mes.percentualNoPrazo >= 90 ? 'success' : k.mes.percentualNoPrazo >= 70 ? 'warning' : 'error'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: gestao ? 4 : 6, lg: gestao ? 2.4 : 3 }}>
              <Kpi
                titulo="Guias não lidas"
                valor={k.guiasNaoLidas}
                detalhe="Enviadas e ainda não abertas"
                icone={EnvelopeOpenIcon}
                cor={k.guiasNaoLidas ? 'warning' : 'info'}
                href={paths.dashboard.obrigacoes}
              />
            </Grid>
            {gestao ? (
              <Grid size={{ xs: 12, sm: 12, md: 8, lg: 2.4 }}>
                <Kpi
                  titulo="Clientes ativos"
                  valor={k.clientesAtivos}
                  detalhe={`${k.atendimentosAbertos} atendimento(s) em aberto`}
                  icone={BuildingsIcon}
                  cor="secondary"
                  href={paths.dashboard.clientes}
                />
              </Grid>
            ) : null}
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Skeleton variant="rounded" height={118} />
            </Grid>
          ))
        )}
      </Grid>

      {dados && dados.alertas.length > 0 ? (
        <Grid container spacing={2}>
          {dados.alertas.map((a) => (
            <Grid key={a.titulo} size={{ xs: 12, md: dados.alertas.length === 1 ? 12 : 6 }}>
              <Alert
                severity={a.severidade}
                variant="outlined"
                sx={{ height: '100%', bgcolor: 'var(--mui-palette-background-paper)' }}
                action={
                  <Button component={RouterLink} href={a.href} color="inherit" size="small">
                    Ver
                  </Button>
                }
              >
                <AlertTitle sx={{ mb: 0 }}>{a.titulo}</AlertTitle>
                <Typography variant="body2">{a.detalhe}</Typography>
              </Alert>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          {dados ? <Agenda itens={dados.agenda} escopo={dados.escopo} /> : <Skeleton variant="rounded" height={360} />}
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2.5}>
            {dados ? <VencimentosPorDia dias={dados.porDia} hoje={dados.hoje} /> : <Skeleton variant="rounded" height={220} />}
            {gestao ? <AtividadeRecente /> : null}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {dados ? <EntregasPorSemana semanas={dados.semanas} /> : <Skeleton variant="rounded" height={260} />}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {dados ? <CumprimentoPorSetor setores={dados.porSetor} /> : <Skeleton variant="rounded" height={260} />}
        </Grid>
      </Grid>

      {dados?.sieg ? (
        <Typography variant="caption" color="text.secondary">
          SIEG: {dados.sieg.notasNoMes.toLocaleString('pt-BR')} nota(s) capturada(s) neste mês de {dados.sieg.empresas} empresa(s)
          {dados.sieg.ultimaCaptura ? ` · última captura: ${dados.sieg.ultimaCaptura}` : ''}
        </Typography>
      ) : null}
    </Stack>
  );
}
