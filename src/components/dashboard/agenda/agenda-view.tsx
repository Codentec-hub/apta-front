'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { api } from '@/lib/api';
import { useEventos } from '@/lib/eventos';
import type { CampoPerfil } from '@/lib/leads';
import { useUser } from '@/hooks/use-user';

import { Confirmacoes } from './confirmacoes';
import { HorariosAtendimento } from './horarios';
import { SemanaAgenda } from './semana';

type Aba = 'confirmacoes' | 'semana' | 'horarios';
const ABAS = new Set<Aba>(['confirmacoes', 'semana', 'horarios']);

export function AgendaView(): React.JSX.Element {
  const { user } = useUser();
  const gestao = user?.perfil === 'ADMIN' || user?.perfil === 'GESTOR';
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const aba: Aba = ABAS.has(params.get('aba') as Aba) ? (params.get('aba') as Aba) : 'confirmacoes';

  const [versao, setVersao] = React.useState(0);
  const [pendentes, setPendentes] = React.useState(0);
  const [campos, setCampos] = React.useState<CampoPerfil[]>([]);
  const [enviarConfirmacao, setEnviarConfirmacao] = React.useState(true);
  const [aviso, setAviso] = React.useState<{ texto: string; erro?: boolean } | null>(null);

  React.useEffect(() => {
    api<{ campos: CampoPerfil[] }>('/leads/campos')
      .then((r) => setCampos(r.campos))
      .catch(() => setCampos([]));
    api<{ enviarConfirmacao: boolean }>('/configuracoes/leads')
      .then((c) => setEnviarConfirmacao(c.enviarConfirmacao))
      .catch(() => setEnviarConfirmacao(true));
  }, []);

  React.useEffect(() => {
    api<{ pendentes: number }>('/agendamentos/contagem')
      .then((c) => setPendentes(c.pendentes))
      .catch(() => setPendentes(0));
  }, [versao]);

  useEventos((evento) => {
    if (evento.tipo === 'leads') setVersao((v) => v + 1);
  });

  const onAviso = React.useCallback((texto: string, erro?: boolean) => {
    setAviso({ texto, erro });
    setVersao((v) => v + 1);
  }, []);

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h4">Agenda</Typography>
        <Typography color="text.secondary" variant="body2">
          Conversas com leads marcadas pelo assistente. Pré-reservas precisam de confirmação da equipe antes de virarem agendamento.
        </Typography>
      </Stack>
      <Tabs value={aba} onChange={(_e, v: Aba) => router.replace(`${pathname}?aba=${v}`, { scroll: false })} variant="scrollable" allowScrollButtonsMobile>
        <Tab
          value="confirmacoes"
          label={
            <Badge color="warning" badgeContent={pendentes} sx={{ '& .MuiBadge-badge': { right: -14 } }}>
              Confirmações
            </Badge>
          }
        />
        <Tab value="semana" label="Semana" />
        <Tab value="horarios" label="Horários de atendimento" />
      </Tabs>
      {aba === 'confirmacoes' ? <Confirmacoes versao={versao} campos={campos} enviarConfirmacao={enviarConfirmacao} onAviso={onAviso} /> : null}
      {aba === 'semana' ? <SemanaAgenda versao={versao} /> : null}
      {aba === 'horarios' ? <HorariosAtendimento podeEditar={gestao} versao={versao} onAviso={onAviso} /> : null}

      <Snackbar open={Boolean(aviso)} autoHideDuration={6000} onClose={() => setAviso(null)}>
        <Alert onClose={() => setAviso(null)} severity={aviso?.erro ? 'error' : 'success'} sx={{ width: '100%' }}>
          {aviso?.texto}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
