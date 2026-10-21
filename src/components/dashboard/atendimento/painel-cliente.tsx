'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { LinkBreakIcon } from '@phosphor-icons/react/dist/ssr/LinkBreak';
import { LinkIcon } from '@phosphor-icons/react/dist/ssr/Link';
import dayjs from 'dayjs';

import type { Cliente, ConversaDetalhe, Obrigacao } from '@/types/domain';
import { paths } from '@/paths';
import { api } from '@/lib/api';
import { formatarCodigo, formatarDocumento } from '@/lib/empresa';

import { formatarTelefone } from './util';

const MAX_OBRIGACOES = 5;

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        {titulo}
      </Typography>
      {children}
    </Stack>
  );
}

export interface PainelClienteProps {
  conversa: ConversaDetalhe;
  onVincular: () => void;
}

// O que o atendente precisa para responder sem sair da conversa.
export function PainelCliente({ conversa, onVincular }: PainelClienteProps): React.JSX.Element {
  const clienteId = conversa.clienteId;
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [abertas, setAbertas] = React.useState<Obrigacao[]>([]);
  const [naoLidas, setNaoLidas] = React.useState<Obrigacao[]>([]);

  React.useEffect(() => {
    setCliente(null);
    setAbertas([]);
    setNaoLidas([]);
    if (!clienteId) return;
    let ativo = true;
    Promise.all([
      api<Cliente>(`/clientes/${clienteId}`),
      api<Obrigacao[]>(`/obrigacoes?clienteId=${clienteId}&status=pendentes,justificadas`),
      api<Obrigacao[]>(`/obrigacoes?clienteId=${clienteId}&docs=nao_lidos`),
    ])
      .then(([c, a, n]) => {
        if (!ativo) return;
        setCliente(c);
        setAbertas([...a].sort((x, y) => x.prazo.localeCompare(y.prazo)));
        setNaoLidas(n);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [clienteId]);

  if (!clienteId) {
    return (
      <Stack spacing={2} sx={{ p: 2 }}>
        <Typography variant="subtitle1">Número não identificado</Typography>
        <Typography variant="body2" color="text.secondary">
          {formatarTelefone(conversa.telefone)} não está no cadastro de contatos de nenhuma empresa.
        </Typography>
        <Button variant="outlined" startIcon={<LinkIcon />} onClick={onVincular}>
          Vincular a um cliente
        </Button>
      </Stack>
    );
  }

  const hoje = dayjs().startOf('day');

  async function desvincular(): Promise<void> {
    if (!globalThis.confirm('Desvincular esta conversa do cliente? O telefone continua no histórico, só o vínculo de cadastro some.')) {
      return;
    }
    await api(`/conversas/${conversa.id}/desvincular`, { method: 'PUT' }).catch(() => {});
  }

  return (
    <Stack spacing={2.5} sx={{ p: 2 }}>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Link
            component={RouterLink}
            href={`${paths.dashboard.clientes}/${clienteId}`}
            variant="subtitle1"
            underline="hover"
          >
            {conversa.cliente?.razaoSocial}
          </Link>
          <Tooltip title="Desvincular do cliente">
            <IconButton size="small" onClick={desvincular}>
              <LinkBreakIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          ID {formatarCodigo(conversa.cliente?.codigo ?? 0)} · {formatarDocumento(conversa.cliente?.cnpj ?? '')}
          {cliente?.regimeTributario ? ` · ${cliente.regimeTributario}` : ''}
        </Typography>
        {conversa.contato ? (
          <Typography variant="body2">
            Falando com <b>{conversa.contato.nome}</b>
            {conversa.contato.cargo ? ` (${conversa.contato.cargo})` : ''}
          </Typography>
        ) : (
          <Button size="small" sx={{ alignSelf: 'flex-start' }} onClick={onVincular}>
            Definir quem é o contato
          </Button>
        )}
      </Stack>
      <Divider />

      <Secao titulo="Responsáveis por setor">
        {cliente && cliente.responsaveis.length > 0 ? (
          cliente.responsaveis.map((r) => (
            <Stack key={r.id} direction="row" sx={{ justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {r.setor.nome}
              </Typography>
              <Typography variant="body2">{r.usuario.nome}</Typography>
            </Stack>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            {cliente ? 'Nenhum responsável definido.' : 'Carregando…'}
          </Typography>
        )}
      </Secao>

      <Secao titulo={`Obrigações em aberto (${abertas.length})`}>
        {abertas.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nada pendente.
          </Typography>
        ) : (
          abertas.slice(0, MAX_OBRIGACOES).map((o) => {
            const atrasada = dayjs(o.prazo).isBefore(hoje);
            return (
              <Stack key={o.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                  {o.tipo?.nome ?? o.nome}
                </Typography>
                <Chip
                  size="small"
                  label={dayjs(o.prazo).format('DD/MM')}
                  color={atrasada ? 'error' : 'default'}
                  variant="outlined"
                />
              </Stack>
            );
          })
        )}
      </Secao>

      <Secao titulo="Guias enviadas e não lidas">
        {naoLidas.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma.
          </Typography>
        ) : (
          naoLidas.slice(0, MAX_OBRIGACOES).map((o) => (
            <Typography key={o.id} variant="body2" color="warning.main">
              ⚠ {o.tipo?.nome ?? o.nome}
              {o.competencia ? ` · ${dayjs(o.competencia).format('MM/YYYY')}` : ''}
            </Typography>
          ))
        )}
      </Secao>

      <Box>
        <Typography variant="caption" color="text.secondary">
          {conversa.totalAtendimentos} atendimento(s) nesta conversa
        </Typography>
      </Box>
    </Stack>
  );
}
