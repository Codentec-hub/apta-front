'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import { paths } from '@/paths';
import { competenciaAnual, formatarCompetencia, statusDaObrigacao } from '@/lib/obrigacao-status';
import type {
  Atendimento,
  Cliente,
  Demanda,
  LancamentoFinanceiro,
  Obrigacao,
  Setor,
  TipoObrigacao,
  UsuarioResumo,
} from '@/types/domain';

import { ClienteFormDialog } from './cliente-form-dialog';
import { ContatosEmpresa } from './contatos-empresa';
import { ObrigacaoFormDialog } from '../obrigacoes/obrigacao-form-dialog';
import { ObrigacoesDaEmpresa } from '../obrigacoes/obrigacoes-da-empresa';
import { DemandaFormDialog } from '../demandas/demanda-form-dialog';
import { AtendimentoFormDialog } from '../atendimento/atendimento-form-dialog';
import { LancamentoFormDialog } from '../financeiro/lancamento-form-dialog';

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_DEMANDA_LABEL: Record<Demanda['status'], string> = {
  A_FAZER: 'A fazer',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
};

const STATUS_ATENDIMENTO_LABEL: Record<Atendimento['status'], string> = {
  AGUARDANDO: 'Aguardando',
  EM_ATENDIMENTO: 'Em atendimento',
  FINALIZADO: 'Finalizado',
};

export interface ClienteDetalheViewProps {
  clienteId: string;
}

export function ClienteDetalheView({ clienteId }: ClienteDetalheViewProps): React.JSX.Element {
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [setores, setSetores] = React.useState<Setor[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioResumo[]>([]);
  const [obrigacoes, setObrigacoes] = React.useState<Obrigacao[]>([]);
  const [tipos, setTipos] = React.useState<TipoObrigacao[]>([]);
  const [demandas, setDemandas] = React.useState<Demanda[]>([]);
  const [atendimentos, setAtendimentos] = React.useState<Atendimento[]>([]);
  const [lancamentos, setLancamentos] = React.useState<LancamentoFinanceiro[]>([]);
  const [erro, setErro] = React.useState<string | null>(null);
  const [carregando, setCarregando] = React.useState(true);

  const [dialogClienteAberto, setDialogClienteAberto] = React.useState(false);
  const [dialogObrigacaoAberto, setDialogObrigacaoAberto] = React.useState(false);
  const [dialogDemandaAberto, setDialogDemandaAberto] = React.useState(false);
  const [dialogAtendimentoAberto, setDialogAtendimentoAberto] = React.useState(false);
  const [dialogLancamentoAberto, setDialogLancamentoAberto] = React.useState(false);

  const carregar = React.useCallback(() => {
    setCarregando(true);
    Promise.all([
      api<Cliente>(`/clientes/${clienteId}`),
      api<Setor[]>('/setores'),
      api<UsuarioResumo[]>('/usuarios'),
      api<Obrigacao[]>(`/obrigacoes?clienteId=${clienteId}`),
      api<Demanda[]>(`/demandas?clienteId=${clienteId}`),
      api<Atendimento[]>(`/atendimentos?clienteId=${clienteId}`),
      api<LancamentoFinanceiro[]>(`/financeiro/lancamentos?clienteId=${clienteId}`),
      api<TipoObrigacao[]>('/tipos-obrigacao'),
    ])
      .then(([clienteData, setoresData, usuariosData, obrigacoesData, demandasData, atendimentosData, lancamentosData, tiposData]) => {
        setTipos(tiposData);
        setCliente(clienteData);
        setSetores(setoresData);
        setUsuarios(usuariosData.filter((u) => u.ativo));
        setObrigacoes(obrigacoesData);
        setDemandas(demandasData);
        setAtendimentos(atendimentosData);
        setLancamentos(lancamentosData);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar cliente'))
      .finally(() => setCarregando(false));
  }, [clienteId]);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  const recarregarEntregas = React.useCallback(() => {
    api<Obrigacao[]>(`/obrigacoes?clienteId=${clienteId}`)
      .then(setObrigacoes)
      .catch(() => null);
  }, [clienteId]);

  // As pendências dos próximos 12 meses já existem (como no Acessórias);
  // na ficha mostramos até 30 dias à frente, da mais recente para a mais
  // antiga. O restante fica na Lista de Entregas.
  const limiteFuturo = React.useMemo(() => dayjs().add(30, 'day'), []);
  const entregasOrdenadas = React.useMemo(
    () =>
      obrigacoes
        .filter((o) => dayjs(o.prazoTecnico ?? o.prazo).isBefore(limiteFuturo))
        .sort((a, b) => b.prazo.localeCompare(a.prazo)),
    [obrigacoes, limiteFuturo]
  );
  const futurasOcultas = obrigacoes.length - entregasOrdenadas.length;

  if (carregando) {
    return <Typography color="text.secondary">Carregando…</Typography>;
  }

  if (!cliente) {
    return <Alert severity="error">Cliente não encontrado.</Alert>;
  }

  const clientesParaDialog = [cliente];

  const resumoFinanceiro = lancamentos.reduce(
    (acc, l) => {
      if (l.liquidadoEm) return acc;
      if (l.tipo === 'PAGAR') acc.aPagar += l.valor;
      else acc.aReceber += l.valor;
      return acc;
    },
    { aPagar: 0, aReceber: 0 }
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Link
          component={RouterLink}
          href={paths.dashboard.clientes}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          variant="body2"
        >
          <ArrowLeftIcon fontSize="var(--icon-fontSize-sm)" /> Clientes
        </Link>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="h4">
                [{cliente.codigo}] {cliente.razaoSocial}
              </Typography>
              <Chip
                label={cliente.ativo ? 'Ativo' : 'Inativo'}
                color={cliente.ativo ? 'success' : 'default'}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Typography color="text.secondary" variant="body2">
              {cliente.cnpj} {cliente.regimeTributario ? `· ${cliente.regimeTributario}` : ''}
              {cliente.nomeFantasia ? ` · ${cliente.nomeFantasia}` : ''}
              {cliente.cidade ? ` · ${cliente.cidade}${cliente.uf ? `/${cliente.uf}` : ''}` : ''}
            </Typography>
          </Stack>
          <Button variant="outlined" startIcon={<PencilSimpleIcon />} onClick={() => setDialogClienteAberto(true)}>
            Editar cliente
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle1">Responsáveis por setor</Typography>
        {cliente.responsaveis.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nenhum responsável atribuído ainda.
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {cliente.responsaveis.map((r) => (
              <Tooltip key={r.id} title={r.usuario.nome}>
                <Chip label={`${r.setor.nome}: ${r.usuario.nome}`} size="small" variant="outlined" />
              </Tooltip>
            ))}
          </Stack>
        )}
      </Stack>

      <ContatosEmpresa clienteId={cliente.id} setores={setores} />

      <ObrigacoesDaEmpresa
        cliente={cliente}
        usuarios={usuarios}
        onClienteChange={setCliente}
        onEntregasAlteradas={recarregarEntregas}
      />

      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack>
            <Typography variant="h6">Entregas</Typography>
            {futurasOcultas > 0 ? (
              <Typography color="text.secondary" variant="caption">
                Até 30 dias à frente · {futurasOcultas} pendência(s) futura(s) na Lista de Entregas
              </Typography>
            ) : null}
          </Stack>
          <Button size="small" startIcon={<PlusIcon />} onClick={() => setDialogObrigacaoAberto(true)}>
            Entrega avulsa
          </Button>
        </Stack>
        {obrigacoes.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nenhuma entrega para este cliente.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Obrigação</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Competência</TableCell>
                  <TableCell>Prazo legal</TableCell>
                  <TableCell>Entregue em</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entregasOrdenadas.map((obrigacao) => {
                  const info = statusDaObrigacao(obrigacao);
                  return (
                    <TableRow key={obrigacao.id}>
                      <TableCell>{obrigacao.nome}</TableCell>
                      <TableCell>{obrigacao.setor.nome}</TableCell>
                      <TableCell>{formatarCompetencia(obrigacao.competencia, competenciaAnual(obrigacao.tipo))}</TableCell>
                      <TableCell>{dayjs(obrigacao.prazo).format('DD/MM/YYYY')}</TableCell>
                      <TableCell>{obrigacao.concluidaEm ? dayjs(obrigacao.concluidaEm).format('DD/MM/YYYY') : '—'}</TableCell>
                      <TableCell>
                        <Chip label={info.label} color={info.color} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Demandas</Typography>
          <Button size="small" startIcon={<PlusIcon />} onClick={() => setDialogDemandaAberto(true)}>
            Nova demanda
          </Button>
        </Stack>
        {demandas.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nenhuma demanda cadastrada para este cliente.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Setor</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {demandas.map((demanda) => (
                  <TableRow key={demanda.id}>
                    <TableCell>{demanda.titulo}</TableCell>
                    <TableCell>{demanda.setor.nome}</TableCell>
                    <TableCell>{demanda.responsavel?.nome ?? '—'}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_DEMANDA_LABEL[demanda.status]} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Atendimentos</Typography>
          <Button size="small" startIcon={<PlusIcon />} onClick={() => setDialogAtendimentoAberto(true)}>
            Novo atendimento
          </Button>
        </Stack>
        {atendimentos.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nenhum atendimento registrado para este cliente.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Responsável</TableCell>
                  <TableCell>Aberto em</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {atendimentos.map((atendimento) => (
                  <TableRow key={atendimento.id}>
                    <TableCell>{atendimento.motivo}</TableCell>
                    <TableCell>{atendimento.responsavel?.nome ?? '—'}</TableCell>
                    <TableCell>{dayjs(atendimento.abertoEm).format('DD/MM/YYYY HH:mm')}</TableCell>
                    <TableCell>
                      <Chip label={STATUS_ATENDIMENTO_LABEL[atendimento.status]} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Stack spacing={2}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Financeiro</Typography>
          <Button size="small" startIcon={<PlusIcon />} onClick={() => setDialogLancamentoAberto(true)}>
            Novo lançamento
          </Button>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Typography variant="body2">
            A pagar em aberto: <strong>{formatoMoeda.format(resumoFinanceiro.aPagar)}</strong>
          </Typography>
          <Typography variant="body2">
            A receber em aberto: <strong>{formatoMoeda.format(resumoFinanceiro.aReceber)}</strong>
          </Typography>
        </Stack>
        {lancamentos.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
            Nenhum lançamento financeiro para este cliente.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Vencimento</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lancamentos.map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell>
                      <Chip
                        label={lancamento.tipo === 'PAGAR' ? 'Pagar' : 'Receber'}
                        color={lancamento.tipo === 'PAGAR' ? 'error' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{lancamento.descricao}</TableCell>
                    <TableCell>{dayjs(lancamento.vencimento).format('DD/MM/YYYY')}</TableCell>
                    <TableCell align="right">{formatoMoeda.format(lancamento.valor)}</TableCell>
                    <TableCell>
                      <Chip
                        label={lancamento.liquidadoEm ? 'Liquidado' : 'Pendente'}
                        color={lancamento.liquidadoEm ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <ClienteFormDialog
        open={dialogClienteAberto}
        cliente={cliente}
        setores={setores}
        usuarios={usuarios}
        onClose={() => setDialogClienteAberto(false)}
        onSaved={(atualizado) => setCliente(atualizado)}
      />

      <ObrigacaoFormDialog
        open={dialogObrigacaoAberto}
        obrigacao={null}
        clientes={clientesParaDialog}
        setores={setores}
        tipos={tipos}
        usuarios={usuarios}
        clientePreSelecionado={cliente}
        onClose={() => setDialogObrigacaoAberto(false)}
        onSaved={(obrigacao) => setObrigacoes((atual) => [...atual, obrigacao])}
      />

      <DemandaFormDialog
        open={dialogDemandaAberto}
        demanda={null}
        clientes={clientesParaDialog}
        setores={setores}
        usuarios={usuarios}
        clientePreSelecionado={cliente}
        onClose={() => setDialogDemandaAberto(false)}
        onSaved={(demanda) => setDemandas((atual) => [...atual, demanda])}
      />

      <AtendimentoFormDialog
        open={dialogAtendimentoAberto}
        atendimento={null}
        clientes={clientesParaDialog}
        setores={setores}
        usuarios={usuarios}
        clientePreSelecionado={cliente}
        onClose={() => setDialogAtendimentoAberto(false)}
        onSaved={(atendimento) => setAtendimentos((atual) => [...atual, atendimento])}
      />

      <LancamentoFormDialog
        open={dialogLancamentoAberto}
        lancamento={null}
        clientes={clientesParaDialog}
        clientePreSelecionado={cliente}
        onClose={() => setDialogLancamentoAberto(false)}
        onSaved={(lancamento) => setLancamentos((atual) => [...atual, lancamento])}
      />

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
