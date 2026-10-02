'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { paths } from '@/paths';
import { pontualidadeDaObrigacao, statusDaObrigacao } from '@/lib/obrigacao-status';
import type { Obrigacao } from '@/types/domain';

interface Cliente {
  id: string;
  razaoSocial: string;
  cnpj: string;
  ativo: boolean;
}

type ApiStatus = 'verificando' | 'online' | 'offline';

const STATUS_COLOR: Record<ApiStatus, 'default' | 'success' | 'error'> = {
  verificando: 'default',
  online: 'success',
  offline: 'error',
};

export function Overview(): React.JSX.Element {
  const { user } = useUser();
  const [apiStatus, setApiStatus] = React.useState<ApiStatus>('verificando');
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [obrigacoes, setObrigacoes] = React.useState<Obrigacao[]>([]);

  React.useEffect(() => {
    api('/health')
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));

    api<Cliente[]>('/clientes')
      .then(setClientes)
      .catch(() => setClientes([]));

    api<Obrigacao[]>('/obrigacoes')
      .then(setObrigacoes)
      .catch(() => setObrigacoes([]));
  }, []);

  const agora = React.useMemo(() => dayjs(), []);
  const fimDaSemana = React.useMemo(() => agora.add(7, 'day'), [agora]);

  // As pendências dos próximos 12 meses já ficam geradas (modelo Acessórias);
  // o painel olha só até 30 dias à frente para não inflar "Pendentes".
  const relevantes = React.useMemo(() => {
    const limite = agora.add(30, 'day');
    return obrigacoes.filter((o) => o.concluidaEm || dayjs(o.prazoTecnico ?? o.prazo).isBefore(limite));
  }, [obrigacoes, agora]);

  const minhas = React.useMemo(
    () => obrigacoes.filter((o) => o.responsavelId === user?.id && !o.concluidaEm),
    [obrigacoes, user?.id]
  );

  const minhasVencendoEmBreve = React.useMemo(
    () =>
      minhas.filter((o) => {
        const info = statusDaObrigacao(o, agora.toDate());
        if (info.status !== 'pendente') return false;
        const prazo = dayjs(o.prazo);
        return prazo.isBefore(fimDaSemana);
      }),
    [minhas, agora, fimDaSemana]
  );

  const clientesAtivos = clientes.filter((c) => c.ativo).length;

  const resumoEscritorio = React.useMemo(() => {
    let planosVencidos = 0;
    let atrasadasSemJustificativa = 0;
    let obrigacoesDaSemana = 0;
    for (const obrigacao of obrigacoes) {
      const status = statusDaObrigacao(obrigacao, agora.toDate()).status;
      if (status === 'plano_vencido') planosVencidos += 1;
      if (status === 'atrasada') atrasadasSemJustificativa += 1;
      if (!obrigacao.concluidaEm && dayjs(obrigacao.prazo).isBefore(fimDaSemana)) obrigacoesDaSemana += 1;
    }
    return { planosVencidos, atrasadasSemJustificativa, obrigacoesDaSemana };
  }, [obrigacoes, agora, fimDaSemana]);

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
      <Stack spacing={1}>
        <Typography variant="h4">Painel geral</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography color="text.secondary" variant="body2">
            API:
          </Typography>
          <Chip color={STATUS_COLOR[apiStatus]} label={apiStatus} size="small" variant="outlined" />
        </Stack>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">O que precisa de você</Typography>
        {minhas.length === 0 ? (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            Nenhuma obrigação pendente atribuída a você no momento.
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {minhas
              .map((o) => ({ obrigacao: o, info: statusDaObrigacao(o, agora.toDate()) }))
              .filter(({ info }) => info.status === 'plano_vencido' || info.status === 'atrasada')
              .map(({ obrigacao, info }) => (
                <Alert
                  key={obrigacao.id}
                  severity="error"
                  icon={<WarningIcon />}
                  action={
                    <Button component={RouterLink} href={paths.dashboard.obrigacoes} color="inherit" size="small">
                      Resolver
                    </Button>
                  }
                >
                  <strong>{obrigacao.cliente.razaoSocial}</strong> — {obrigacao.nome} · {info.label}
                </Alert>
              ))}

            {minhasVencendoEmBreve.length > 0 ? (
              <Alert
                severity="warning"
                action={
                  <Button component={RouterLink} href={paths.dashboard.obrigacoes} color="inherit" size="small">
                    Ver
                  </Button>
                }
              >
                Você tem <strong>{minhasVencendoEmBreve.length}</strong> obrigaç
                {minhasVencendoEmBreve.length > 1 ? 'ões vencendo' : 'ão vencendo'} nos próximos 7 dias.
              </Alert>
            ) : null}
          </Stack>
        )}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Clientes ativos
            </Typography>
            <Typography variant="h4">{clientesAtivos}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Obrigações nos próximos 7 dias
            </Typography>
            <Typography variant="h4">{resumoEscritorio.obrigacoesDaSemana}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Planos de ação vencidos
            </Typography>
            <Typography color="error.main" variant="h4">
              {resumoEscritorio.planosVencidos}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Atrasadas sem justificativa
            </Typography>
            <Typography color="warning.main" variant="h4">
              {resumoEscritorio.atrasadasSemJustificativa}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

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
                  <TableCell align="center">No prazo</TableCell>
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
    </Stack>
  );
}
