'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import { DIAS_SEMANA } from '@/lib/leads';

interface Faixa {
  diaSemana: number;
  inicio: string;
  fim: string;
  duracaoMin: number;
}

interface Bloqueio {
  id: string;
  inicio: string;
  fim: string;
  motivo: string | null;
}

const DURACOES = [15, 20, 30, 45, 60, 90];
const ORDEM = [1, 2, 3, 4, 5, 6, 0];

interface Props {
  podeEditar: boolean;
  versao: number;
  onAviso: (texto: string, erro?: boolean) => void;
}

export function HorariosAtendimento({ podeEditar, versao, onAviso }: Props): React.JSX.Element {
  const [faixas, setFaixas] = React.useState<Faixa[]>([]);
  const [alterado, setAlterado] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);
  const [bloqueios, setBloqueios] = React.useState<Bloqueio[]>([]);
  const [novo, setNovo] = React.useState({ data: dayjs().add(1, 'day').format('YYYY-MM-DD'), diaInteiro: true, de: '09:00', ate: '12:00', motivo: '' });

  const carregarBloqueios = React.useCallback(() => {
    api<Bloqueio[]>('/agenda/bloqueios')
      .then(setBloqueios)
      .catch(() => setBloqueios([]));
  }, []);

  React.useEffect(() => {
    if (alterado) return;
    api<Faixa[]>('/agenda/disponibilidades')
      .then((l) => setFaixas(l.map(({ diaSemana, inicio, fim, duracaoMin }) => ({ diaSemana, inicio, fim, duracaoMin }))))
      .catch(() => setFaixas([]));
    carregarBloqueios();
  }, [versao, alterado, carregarBloqueios]);

  const mudar = (lista: Faixa[]) => {
    setFaixas(lista);
    setAlterado(true);
  };

  const duracaoPadrao = faixas[0]?.duracaoMin ?? 30;

  async function salvar(): Promise<void> {
    setSalvando(true);
    try {
      await api('/agenda/disponibilidades', { method: 'PUT', body: JSON.stringify({ faixas }) });
      setAlterado(false);
      onAviso('Horários de atendimento salvos.');
    } catch (error) {
      onAviso(error instanceof Error ? error.message : 'Erro ao salvar', true);
    } finally {
      setSalvando(false);
    }
  }

  async function bloquear(): Promise<void> {
    const inicio = dayjs(`${novo.data}T${novo.diaInteiro ? '00:00' : novo.de}`);
    const fim = novo.diaInteiro ? inicio.add(1, 'day') : dayjs(`${novo.data}T${novo.ate}`);
    try {
      const r = await api<{ conflitos: number }>('/agenda/bloqueios', {
        method: 'POST',
        body: JSON.stringify({ inicio: inicio.toISOString(), fim: fim.toISOString(), motivo: novo.motivo || null }),
      });
      setNovo((n) => ({ ...n, motivo: '' }));
      carregarBloqueios();
      onAviso(
        r.conflitos
          ? `Bloqueio salvo. Atenção: já há ${r.conflitos} agendamento(s) nesse período, que continuam valendo.`
          : 'Bloqueio salvo: o assistente não oferece esse período.'
      );
    } catch (error) {
      onAviso(error instanceof Error ? error.message : 'Erro ao bloquear', true);
    }
  }

  async function removerBloqueio(id: string): Promise<void> {
    try {
      await api(`/agenda/bloqueios/${id}`, { method: 'DELETE' });
      carregarBloqueios();
    } catch (error) {
      onAviso(error instanceof Error ? error.message : 'Erro', true);
    }
  }

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader
          title="Horários de atendimento"
          subheader="A grade semanal que o assistente usa para oferecer horários. Feriados nacionais e os cadastrados ficam de fora sozinhos."
          action={
            podeEditar ? (
              <Button variant="contained" disabled={!alterado || salvando} onClick={() => void salvar()}>
                Salvar horários
              </Button>
            ) : null
          }
        />
        <Divider />
        <CardContent>
          {podeEditar ? null : (
            <Alert severity="info" sx={{ mb: 2 }}>
              Só gestores e administradores alteram a grade.
            </Alert>
          )}
          <Stack spacing={1.5} divider={<Divider flexItem />}>
            {ORDEM.map((dia) => {
              const doDia = faixas.map((f, i) => ({ f, i })).filter(({ f }) => f.diaSemana === dia);
              return (
                <Stack key={dia} direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
                  <Typography variant="subtitle2" sx={{ width: 90, flexShrink: 0 }}>
                    {DIAS_SEMANA[dia]}
                  </Typography>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    {doDia.length === 0 ? (
                      <Typography variant="body2" color="text.disabled">
                        Sem atendimento
                      </Typography>
                    ) : null}
                    {doDia.map(({ f, i }) => (
                      <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                        <TextField
                          type="time"
                          size="small"
                          label="Das"
                          value={f.inicio}
                          disabled={!podeEditar}
                          onChange={(e) => mudar(faixas.map((x, j) => (j === i ? { ...x, inicio: e.target.value } : x)))}
                          sx={{ width: 120 }}
                        />
                        <TextField
                          type="time"
                          size="small"
                          label="Até"
                          value={f.fim}
                          disabled={!podeEditar}
                          onChange={(e) => mudar(faixas.map((x, j) => (j === i ? { ...x, fim: e.target.value } : x)))}
                          sx={{ width: 120 }}
                        />
                        <TextField
                          select
                          size="small"
                          label="Reunião"
                          value={f.duracaoMin}
                          disabled={!podeEditar}
                          onChange={(e) => mudar(faixas.map((x, j) => (j === i ? { ...x, duracaoMin: Number(e.target.value) } : x)))}
                          sx={{ width: 120 }}
                        >
                          {DURACOES.map((d) => (
                            <MenuItem key={d} value={d}>
                              {d} min
                            </MenuItem>
                          ))}
                        </TextField>
                        {podeEditar ? (
                          <IconButton aria-label="Remover faixa" onClick={() => mudar(faixas.filter((_x, j) => j !== i))}>
                            <TrashIcon />
                          </IconButton>
                        ) : null}
                      </Stack>
                    ))}
                  </Stack>
                  {podeEditar ? (
                    <Button
                      size="small"
                      startIcon={<PlusIcon />}
                      onClick={() => {
                        const ultima = doDia.at(-1)?.f;
                        mudar([
                          ...faixas,
                          ultima
                            ? { diaSemana: dia, inicio: ultima.fim.localeCompare('14:00') > 0 ? ultima.fim : '14:00', fim: '18:00', duracaoMin: ultima.duracaoMin }
                            : { diaSemana: dia, inicio: '09:00', fim: '12:00', duracaoMin: duracaoPadrao },
                        ]);
                      }}
                    >
                      Faixa
                    </Button>
                  ) : null}
                </Stack>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Bloqueios" subheader="Folgas, compromissos e dias sem atendimento. O assistente não oferece esses períodos." />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
              <TextField type="date" size="small" label="Data" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} sx={{ width: 170 }} />
              <FormControlLabel
                control={<Checkbox checked={novo.diaInteiro} onChange={(e) => setNovo({ ...novo, diaInteiro: e.target.checked })} />}
                label="Dia inteiro"
              />
              {novo.diaInteiro ? null : (
                <>
                  <TextField type="time" size="small" label="Das" value={novo.de} onChange={(e) => setNovo({ ...novo, de: e.target.value })} sx={{ width: 120 }} />
                  <TextField type="time" size="small" label="Até" value={novo.ate} onChange={(e) => setNovo({ ...novo, ate: e.target.value })} sx={{ width: 120 }} />
                </>
              )}
              <TextField size="small" label="Motivo" value={novo.motivo} onChange={(e) => setNovo({ ...novo, motivo: e.target.value })} sx={{ flex: 1, minWidth: 160 }} />
              <Button variant="outlined" onClick={() => void bloquear()} disabled={!novo.data}>
                Bloquear
              </Button>
            </Stack>
            {bloqueios.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhum bloqueio à frente.
              </Typography>
            ) : (
              <Stack divider={<Divider flexItem />}>
                {bloqueios.map((b) => {
                  const ini = dayjs(b.inicio);
                  const fim = dayjs(b.fim);
                  const diaInteiro = ini.hour() === 0 && ini.minute() === 0 && fim.diff(ini, 'hour') % 24 === 0;
                  return (
                    <Stack key={b.id} direction="row" spacing={2} sx={{ alignItems: 'center', py: 0.75 }}>
                      <Typography variant="body2" sx={{ minWidth: 220, fontWeight: 500 }}>
                        {diaInteiro
                          ? fim.diff(ini, 'day') > 1
                            ? `${ini.format('DD/MM')} a ${fim.subtract(1, 'day').format('DD/MM/YYYY')}`
                            : `${ini.format('DD/MM/YYYY')} (dia inteiro)`
                          : `${ini.format('DD/MM/YYYY')} · ${ini.format('HH:mm')}–${fim.format('HH:mm')}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        {b.motivo ?? ''}
                      </Typography>
                      <IconButton size="small" aria-label="Remover bloqueio" onClick={() => void removerBloqueio(b.id)}>
                        <TrashIcon />
                      </IconButton>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
