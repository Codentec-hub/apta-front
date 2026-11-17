'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { CaretLeftIcon } from '@phosphor-icons/react/dist/ssr/CaretLeft';
import { CaretRightIcon } from '@phosphor-icons/react/dist/ssr/CaretRight';
import dayjs, { type Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';

import { paths } from '@/paths';
import { api } from '@/lib/api';
import { DIAS_CURTOS, STATUS_AGENDAMENTO, type Agendamento } from '@/lib/leads';

interface Faixa {
  diaSemana: number;
  inicio: string;
  fim: string;
}

interface Bloqueio {
  id: string;
  inicio: string;
  fim: string;
  motivo: string | null;
}

interface Semana {
  agendamentos: Agendamento[];
  bloqueios: Bloqueio[];
  grade: Faixa[];
}

const PX_HORA = 56;
const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const minDoDia = (d: Dayjs) => d.hour() * 60 + d.minute();

export function SemanaAgenda({ versao }: { versao: number }): React.JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const [inicio, setInicio] = React.useState(() => dayjs().startOf('week').add(1, 'day'));
  const [dados, setDados] = React.useState<Semana | null>(null);

  React.useEffect(() => {
    api<Semana>(`/agenda/semana?de=${inicio.format('YYYY-MM-DD')}&dias=7`)
      .then(setDados)
      .catch(() => setDados(null));
  }, [inicio, versao]);

  const dias = Array.from({ length: 7 }, (_v, i) => inicio.add(i, 'day'));
  const grade = dados?.grade ?? [];
  const eventosMin = (dados?.agendamentos ?? []).map((a) => minDoDia(dayjs(a.inicio)));
  const de = Math.floor(Math.min(8 * 60, ...grade.map((g) => minutos(g.inicio)), ...eventosMin) / 60) * 60;
  const ate = Math.ceil(Math.max(18 * 60, ...grade.map((g) => minutos(g.fim)), ...eventosMin.map((m) => m + 60)) / 60) * 60;
  const altura = ((ate - de) / 60) * PX_HORA;
  const topo = (m: number) => ((m - de) / 60) * PX_HORA;
  const hoje = dayjs();

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <IconButton onClick={() => setInicio((d) => d.subtract(7, 'day'))} aria-label="Semana anterior">
          <CaretLeftIcon />
        </IconButton>
        <Button variant="outlined" size="small" onClick={() => setInicio(dayjs().startOf('week').add(1, 'day'))}>
          Esta semana
        </Button>
        <IconButton onClick={() => setInicio((d) => d.add(7, 'day'))} aria-label="Próxima semana">
          <CaretRightIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ ml: 1 }}>
          {inicio.format('DD/MM')} a {inicio.add(6, 'day').format('DD/MM/YYYY')}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          {[
            { cor: theme.palette.warning.main, t: 'Pré-reservado' },
            { cor: theme.palette.success.main, t: 'Confirmado' },
            { cor: theme.palette.action.disabled, t: 'Bloqueado' },
          ].map((l) => (
            <Stack key={l.t} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: l.cor }} />
              <Typography variant="caption">{l.t}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '48px repeat(7, minmax(110px, 1fr))', minWidth: 820 }}>
          <Box />
          {dias.map((d) => (
            <Box
              key={d.toString()}
              sx={{ py: 1, textAlign: 'center', borderLeft: 1, borderBottom: 1, borderColor: 'divider', bgcolor: d.isSame(hoje, 'day') ? alpha(theme.palette.primary.main, 0.06) : undefined }}
            >
              <Typography variant="caption" color="text.secondary">
                {DIAS_CURTOS[d.day()]}
              </Typography>
              <Typography variant="subtitle2" color={d.isSame(hoje, 'day') ? 'primary.main' : undefined}>
                {d.format('DD/MM')}
              </Typography>
            </Box>
          ))}

          <Box sx={{ position: 'relative', height: altura }}>
            {Array.from({ length: (ate - de) / 60 }, (_v, i) => (
              <Typography key={i} variant="caption" color="text.secondary" sx={{ position: 'absolute', top: i * PX_HORA - 8, right: 6 }}>
                {String(de / 60 + i).padStart(2, '0')}h
              </Typography>
            ))}
          </Box>
          {dias.map((d) => {
            const faixas = grade.filter((g) => g.diaSemana === d.day());
            const ags = (dados?.agendamentos ?? []).filter((a) => dayjs(a.inicio).isSame(d, 'day'));
            const blq = (dados?.bloqueios ?? []).filter((b) => dayjs(b.inicio).isBefore(d.endOf('day')) && dayjs(b.fim).isAfter(d.startOf('day')));
            return (
              <Box
                key={d.toString()}
                sx={{
                  position: 'relative',
                  height: altura,
                  borderLeft: 1,
                  borderColor: 'divider',
                  backgroundImage: `repeating-linear-gradient(to bottom, ${theme.palette.divider} 0, ${theme.palette.divider} 1px, transparent 1px, transparent ${PX_HORA}px)`,
                }}
              >
                {faixas.map((f) => (
                  <Box
                    key={`${f.inicio}-${f.fim}`}
                    sx={{ position: 'absolute', left: 0, right: 0, top: topo(minutos(f.inicio)), height: topo(minutos(f.fim)) - topo(minutos(f.inicio)), bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                  />
                ))}
                {blq.map((b) => {
                  const ini = dayjs(b.inicio).isBefore(d.startOf('day')) ? de : Math.max(de, minDoDia(dayjs(b.inicio)));
                  const fim = dayjs(b.fim).isAfter(d.endOf('day')) ? ate : Math.min(ate, minDoDia(dayjs(b.fim)));
                  return fim > ini ? (
                    <Tooltip key={b.id} title={b.motivo ?? 'Bloqueado'}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 2,
                          right: 2,
                          top: topo(ini),
                          height: topo(fim) - topo(ini),
                          borderRadius: 1,
                          backgroundImage: `repeating-linear-gradient(135deg, ${theme.palette.action.disabledBackground} 0 6px, transparent 6px 12px)`,
                          border: 1,
                          borderColor: 'divider',
                        }}
                      />
                    </Tooltip>
                  ) : null;
                })}
                {ags.map((a) => {
                  const ini = minDoDia(dayjs(a.inicio));
                  const fim = ini + dayjs(a.fim).diff(dayjs(a.inicio), 'minute');
                  const cor = a.status === 'CONFIRMADO' ? theme.palette.success.main : theme.palette.warning.main;
                  return (
                    <Tooltip key={a.id} title={`${STATUS_AGENDAMENTO[a.status].rotulo} · ${a.lead.nome}`}>
                      <Box
                        onClick={() => router.push(`${paths.dashboard.leads}?lead=${a.lead.id}`)}
                        sx={{
                          position: 'absolute',
                          left: 4,
                          right: 4,
                          top: topo(ini) + 1,
                          height: Math.max(22, topo(fim) - topo(ini) - 2),
                          borderRadius: 1,
                          px: 0.75,
                          py: 0.25,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          bgcolor: alpha(cor, 0.16),
                          borderLeft: 3,
                          borderColor: cor,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.3 }} noWrap>
                          {dayjs(a.inicio).format('HH:mm')} {a.lead.nome}
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Paper>
      {grade.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum horário de atendimento configurado ainda: o assistente não tem o que oferecer. Configure na aba Horários de atendimento.
        </Typography>
      ) : null}
    </Stack>
  );
}
