'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { pontualidadeDaObrigacao } from '@/lib/obrigacao-status';
import type { Indicadores, Obrigacao } from '@/types/domain';

import { PainelInicial } from './painel-inicial';
import { PrimeirosPassos } from './primeiros-passos';

function percentual(parte: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((parte / total) * 100)}%`;
}

/** Indicadores no modelo do Acessórias (abaixo do painel, para a gestão). */
export function IndicadoresDetalhados(): React.JSX.Element {
  const [obrigacoes, setObrigacoes] = React.useState<Obrigacao[]>([]);
  const [periodoIndicadores, setPeriodoIndicadores] = React.useState<'semana' | 'mes'>('semana');
  const [indicadores, setIndicadores] = React.useState<Indicadores | null>(null);

  React.useEffect(() => {
    api<Obrigacao[]>('/obrigacoes')
      .then(setObrigacoes)
      .catch(() => setObrigacoes([]));
  }, []);

  React.useEffect(() => {
    api<Indicadores>(`/indicadores?periodo=${periodoIndicadores}`)
      .then(setIndicadores)
      .catch(() => setIndicadores(null));
  }, [periodoIndicadores]);

  const agora = React.useMemo(() => dayjs(), []);

  // As pendências dos próximos 12 meses já ficam geradas (modelo Acessórias);
  // o painel olha só até 30 dias à frente para não inflar "Pendentes".
  const relevantes = React.useMemo(() => {
    const limite = agora.add(30, 'day');
    return obrigacoes.filter((o) => o.concluidaEm || dayjs(o.prazoTecnico ?? o.prazo).isBefore(limite));
  }, [obrigacoes, agora]);

  const performancePorResponsavel = React.useMemo(() => {
    const mapa = new Map<
      string,
      {
        nome: string;
        antecipadas: number;
        noPrazo: number;
        atrasoLegal: number;
        atrasoJustificado: number;
        semJustificativa: number;
        dispensadas: number;
        pendentes: number;
      }
    >();

    for (const obrigacao of relevantes) {
      const chave = obrigacao.responsavel?.id ?? 'sem-responsavel';
      const nome = obrigacao.responsavel?.nome ?? 'Sem responsável';
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          nome,
          antecipadas: 0,
          noPrazo: 0,
          atrasoLegal: 0,
          atrasoJustificado: 0,
          semJustificativa: 0,
          dispensadas: 0,
          pendentes: 0,
        });
      }
      const linha = mapa.get(chave)!;

      switch (pontualidadeDaObrigacao(obrigacao, agora.toDate())) {
        case 'antecipada': {
          linha.antecipadas += 1;
          break;
        }
        case 'no_prazo': {
          linha.noPrazo += 1;
          break;
        }
        case 'atraso_legal': {
          linha.atrasoLegal += 1;
          break;
        }
        case 'atraso_justificado': {
          linha.atrasoJustificado += 1;
          break;
        }
        case 'atraso_sem_justificativa': {
          linha.semJustificativa += 1;
          break;
        }
        case 'dispensada': {
          linha.dispensadas += 1;
          break;
        }
        case 'pendente': {
          linha.pendentes += 1;
          break;
        }
        default: {
          break;
        }
      }
    }

    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [relevantes, agora]);

  return (
    <Stack spacing={4}>
      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Painel de Indicadores</Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label="Semana"
              size="small"
              color={periodoIndicadores === 'semana' ? 'primary' : 'default'}
              variant={periodoIndicadores === 'semana' ? 'filled' : 'outlined'}
              onClick={() => setPeriodoIndicadores('semana')}
            />
            <Chip
              label="Mês"
              size="small"
              color={periodoIndicadores === 'mes' ? 'primary' : 'default'}
              variant={periodoIndicadores === 'mes' ? 'filled' : 'outlined'}
              onClick={() => setPeriodoIndicadores('mes')}
            />
          </Stack>
        </Stack>

        {indicadores ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography color="text.secondary" variant="body2">
                  Entregas
                </Typography>
                <Typography variant="h4">{indicadores.entregas.total}</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="body2">Antecipadas: {indicadores.entregas.antecipadas}</Typography>
                  <Typography variant="body2">Prazo técnico: {indicadores.entregas.prazoTecnico}</Typography>
                  <Typography color={indicadores.entregas.atrasadas > 0 ? 'error.main' : undefined} variant="body2">
                    Atrasadas: {indicadores.entregas.atrasadas}
                    {indicadores.entregas.atrasadasComMulta > 0
                      ? ` (${indicadores.entregas.atrasadasComMulta} com multa)`
                      : ''}
                  </Typography>
                  <Typography color={indicadores.entregas.atrasoJustificado > 0 ? 'warning.main' : undefined} variant="body2">
                    Atraso justificado: {indicadores.entregas.atrasoJustificado}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography color="text.secondary" variant="body2">
                  A realizar
                </Typography>
                <Typography variant="h4">{indicadores.aRealizar.total}</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="body2">Prazo antecipado: {indicadores.aRealizar.prazoAntecipado}</Typography>
                  <Typography variant="body2">Prazo técnico: {indicadores.aRealizar.prazoTecnico}</Typography>
                  <Typography color={indicadores.aRealizar.atrasoLegal > 0 ? 'error.main' : undefined} variant="body2">
                    Atraso legal: {indicadores.aRealizar.atrasoLegal}
                    {indicadores.aRealizar.atrasoLegalComMulta > 0
                      ? ` (${indicadores.aRealizar.atrasoLegalComMulta} com multa)`
                      : ''}
                  </Typography>
                  <Typography color={indicadores.aRealizar.atrasoJustificado > 0 ? 'warning.main' : undefined} variant="body2">
                    Atraso justificado: {indicadores.aRealizar.atrasoJustificado}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography color="text.secondary" variant="body2">
                  Docs
                </Typography>
                <Typography variant="h4">{indicadores.docs.total}</Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography color="success.main" variant="body2">
                    Lidos: {indicadores.docs.lidos}/{percentual(indicadores.docs.lidos, indicadores.docs.total)}
                  </Typography>
                  <Typography color={indicadores.docs.naoLidos > 0 ? 'error.main' : undefined} variant="body2">
                    Não lidos: {indicadores.docs.naoLidos}/{percentual(indicadores.docs.naoLidos, indicadores.docs.total)}
                  </Typography>
                  <Typography variant="body2">Aguardando envio: {indicadores.docs.aguardandoEnvio}</Typography>
                  <Typography color={indicadores.docs.falhaNoEnvio > 0 ? 'error.main' : undefined} variant="body2">
                    Falha no envio: {indicadores.docs.falhaNoEnvio}/{percentual(indicadores.docs.falhaNoEnvio, indicadores.docs.total)}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Carregando indicadores…
          </Typography>
        )}
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">Performance por responsável</Typography>
        {performancePorResponsavel.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nenhuma obrigação cadastrada ainda.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Responsável</TableCell>
                  <TableCell align="center">Antecipadas</TableCell>
                  <TableCell align="center">Prazo técnico</TableCell>
                  <TableCell align="center">Atraso legal</TableCell>
                  <TableCell align="center">Atraso justificado</TableCell>
                  <TableCell align="center">Atraso sem justificativa</TableCell>
                  <TableCell align="center">Dispensadas</TableCell>
                  <TableCell align="center">Pendentes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performancePorResponsavel.map((linha) => (
                  <TableRow key={linha.nome}>
                    <TableCell>{linha.nome}</TableCell>
                    <TableCell align="center">{linha.antecipadas}</TableCell>
                    <TableCell align="center">{linha.noPrazo}</TableCell>
                    <TableCell align="center">
                      <Box component="span" sx={linha.atrasoLegal > 0 ? { color: 'warning.main', fontWeight: 600 } : undefined}>
                        {linha.atrasoLegal}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{linha.atrasoJustificado}</TableCell>
                    <TableCell align="center">
                      <Box component="span" sx={linha.semJustificativa > 0 ? { color: 'error.main', fontWeight: 600 } : undefined}>
                        {linha.semJustificativa}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{linha.dispensadas}</TableCell>
                    <TableCell align="center">{linha.pendentes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      {performancePorResponsavel.length > 0 ? <CumprimentoDePrazos linhas={performancePorResponsavel} /> : null}
    </Stack>
  );
}

interface LinhaCumprimento {
  nome: string;
  antecipadas: number;
  noPrazo: number;
  atrasoLegal: number;
  atrasoJustificado: number;
  semJustificativa: number;
}

// "Cumprimento de Prazos" do Acessórias: % das entregas que já têm desfecho
// (entregues ou vencidas) e que saíram dentro do prazo legal. Dispensadas e
// pendentes ainda no prazo ficam fora da conta.
function CumprimentoDePrazos({ linhas }: { linhas: LinhaCumprimento[] }): React.JSX.Element {
  const dados = linhas.map((l) => {
    const noPrazo = l.antecipadas + l.noPrazo;
    const atrasadas = l.atrasoLegal + l.atrasoJustificado + l.semJustificativa;
    const total = noPrazo + atrasadas;
    return { ...l, noPrazoTotal: noPrazo, atrasadas, total, pct: total === 0 ? null : Math.round((noPrazo / total) * 100) };
  });

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h6">Cumprimento de prazos</Typography>
        <Typography color="text.secondary" variant="body2">
          Entregas dentro do prazo legal sobre o total que já venceu ou foi entregue (sem dispensadas).
        </Typography>
      </Stack>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={1.25}>
          {dados.map((d) => (
            <Tooltip
              key={d.nome}
              placement="top"
              title={
                d.total === 0 ? (
                  'Nenhuma entrega com prazo vencido ainda'
                ) : (
                  <span>
                    {d.noPrazoTotal} no prazo ({d.antecipadas} antecipadas, {d.noPrazo} prazo técnico)
                    <br />
                    {d.atrasadas} com atraso ({d.atrasoLegal} legal, {d.atrasoJustificado} justificado, {d.semJustificativa} sem
                    justificativa)
                  </span>
                )
              }
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '110px 1fr 48px', sm: '180px 1fr 48px' }, gap: 2, alignItems: 'center', py: 0.5 }}>
                <Typography variant="body2" noWrap>
                  {d.nome}
                </Typography>
                <Box sx={{ height: 12, bgcolor: 'var(--mui-palette-action-hover)', borderRadius: '0 4px 4px 0' }}>
                  {d.pct ? (
                    <Box sx={{ height: '100%', width: `${d.pct}%`, bgcolor: 'primary.main', borderRadius: '0 4px 4px 0' }} />
                  ) : null}
                </Box>
                <Typography variant="body2" color={d.pct === null ? 'text.secondary' : 'text.primary'} sx={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {d.pct === null ? '—' : `${d.pct}%`}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

/** Tela inicial: painel novo para todos e, para a gestão, os indicadores detalhados. */
export function Overview(): React.JSX.Element {
  const { user } = useUser();
  const gestao = user?.perfil === 'ADMIN' || user?.perfil === 'GESTOR';
  return (
    <Stack spacing={4}>
      <PrimeirosPassos />
      <PainelInicial />
      {gestao ? (
        <Stack spacing={3}>
          <Divider />
          <div>
            <Typography variant="h5">Indicadores detalhados</Typography>
            <Typography variant="body2" color="text.secondary">
              Entregas, pendências e documentos no período, e o desempenho de cada responsável.
            </Typography>
          </div>
          <IndicadoresDetalhados />
        </Stack>
      ) : null}
    </Stack>
  );
}
