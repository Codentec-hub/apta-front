'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ChatCircleTextIcon } from '@phosphor-icons/react/dist/ssr/ChatCircleText';
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import dayjs from 'dayjs';
import RouterLink from 'next/link';

import { paths } from '@/paths';
import { api } from '@/lib/api';
import { horarioLongo, relativo, type Agendamento, type CampoPerfil } from '@/lib/leads';
import { formatarTelefone } from '@/components/dashboard/atendimento/util';

import { CancelarAgendamentoDialog, ConfirmarAgendamentoDialog } from './dialogs-agendamento';

interface Props {
  versao: number;
  campos: CampoPerfil[];
  enviarConfirmacao: boolean;
  onAviso: (texto: string, erro?: boolean) => void;
}

export function Confirmacoes({ versao, campos, enviarConfirmacao, onAviso }: Props): React.JSX.Element {
  const [pendentes, setPendentes] = React.useState<Agendamento[] | null>(null);
  const [proximos, setProximos] = React.useState<Agendamento[]>([]);
  const [confirmar, setConfirmar] = React.useState<Agendamento | null>(null);
  const [cancelar, setCancelar] = React.useState<Agendamento | null>(null);
  const [recarga, setRecarga] = React.useState(0);

  React.useEffect(() => {
    api<Agendamento[]>('/agendamentos?status=PRE_RESERVADO&futuros=1')
      .then((l) => setPendentes(l.filter((a) => !a.expiraEm || dayjs(a.expiraEm).isAfter(dayjs()))))
      .catch((error: unknown) => onAviso(error instanceof Error ? error.message : 'Erro ao carregar', true));
    api<Agendamento[]>('/agendamentos?status=CONFIRMADO&futuros=1')
      .then((l) => setProximos(l.slice(0, 10)))
      .catch(() => setProximos([]));
  }, [versao, recarga, onAviso]);

  const feito = (texto: string) => {
    setConfirmar(null);
    setCancelar(null);
    onAviso(texto);
    setRecarga((r) => r + 1);
  };

  const rotulo = (chave: string) => campos.find((c) => c.chave === chave)?.rotulo ?? chave;

  return (
    <Stack spacing={3}>
      <Stack spacing={1.5}>
        <Typography variant="h6">Para confirmar {pendentes ? `(${pendentes.length})` : ''}</Typography>
        {pendentes && pendentes.length === 0 ? (
          <Alert severity="success" variant="outlined">
            Nenhuma pré-reserva esperando. Quando o assistente reservar um horário, ele aparece aqui e você recebe um aviso.
          </Alert>
        ) : null}
        <Grid container spacing={2}>
          {(pendentes ?? []).map((a) => {
            const urgente = a.expiraEm ? dayjs(a.expiraEm).diff(dayjs(), 'hour') < 3 : false;
            const perfil = Object.entries(a.lead.perfil ?? {}).slice(0, 5);
            return (
              <Grid key={a.id} size={{ xs: 12, md: 6, xl: 4 }}>
                <Card variant="outlined" sx={{ height: '100%', borderColor: urgente ? 'warning.main' : undefined }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <div>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {a.lead.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[formatarTelefone(a.lead.telefone), a.lead.origem].filter(Boolean).join(' · ')}
                          </Typography>
                        </div>
                        {a.expiraEm ? (
                          <Chip
                            icon={<ClockIcon />}
                            label={`Expira ${relativo(a.expiraEm)}`}
                            color={urgente ? 'warning' : 'default'}
                            size="small"
                            variant={urgente ? 'filled' : 'outlined'}
                          />
                        ) : null}
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {horarioLongo(a.inicio)}
                      </Typography>
                      {a.lead.qualificacao ? (
                        <Typography variant="body2" color="secondary.main">
                          {a.lead.qualificacao}
                        </Typography>
                      ) : null}
                      {perfil.length > 0 ? (
                        <Stack spacing={0.25}>
                          {perfil.map(([k, v]) => (
                            <Typography key={k} variant="body2">
                              <Typography component="span" variant="body2" color="text.secondary">
                                {rotulo(k)}:
                              </Typography>{' '}
                              {v}
                            </Typography>
                          ))}
                        </Stack>
                      ) : null}
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, pt: 0.5 }}>
                        <Button variant="contained" color="success" onClick={() => setConfirmar(a)}>
                          Confirmar
                        </Button>
                        <Button variant="outlined" color="error" onClick={() => setCancelar(a)}>
                          Cancelar
                        </Button>
                        {a.lead.conversaId ? (
                          <Button startIcon={<ChatCircleTextIcon />} component={RouterLink} href={`${paths.dashboard.atendimento}?conversa=${a.lead.conversaId}`}>
                            Conversa
                          </Button>
                        ) : null}
                        <Button component={RouterLink} href={`${paths.dashboard.leads}?lead=${a.lead.id}`}>
                          Ver lead
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="h6">Próximos confirmados</Typography>
        {proximos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum atendimento confirmado à frente.
          </Typography>
        ) : (
          <Card variant="outlined">
            {proximos.map((a, i) => (
              <Stack
                key={a.id}
                direction="row"
                sx={{ px: 2, py: 1.25, alignItems: 'center', gap: 2, borderTop: i ? 1 : 0, borderColor: 'divider', flexWrap: 'wrap' }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 220 }}>
                  {horarioLongo(a.inicio)}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {a.lead.nome}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {a.confirmadoPor ? `confirmado por ${a.confirmadoPor.nome}` : ''}
                </Typography>
                <Button size="small" color="error" onClick={() => setCancelar(a)}>
                  Cancelar
                </Button>
              </Stack>
            ))}
          </Card>
        )}
      </Stack>

      <ConfirmarAgendamentoDialog alvo={confirmar} enviarPadrao={enviarConfirmacao} onClose={() => setConfirmar(null)} onFeito={feito} />
      <CancelarAgendamentoDialog alvo={cancelar} onClose={() => setCancelar(null)} onFeito={feito} />
    </Stack>
  );
}
