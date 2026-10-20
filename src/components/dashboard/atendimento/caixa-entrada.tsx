'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ChatsCircleIcon } from '@phosphor-icons/react/dist/ssr/ChatsCircle';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { WhatsappLogoIcon } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import dayjs from 'dayjs';

import type {
  AbaConversa,
  AgenteIA,
  Cliente,
  Conversa,
  ConversaDetalhe,
  MotivoAtendimento,
  Setor,
  StatusWhatsApp,
  UsuarioResumo,
} from '@/types/domain';
import { paths } from '@/paths';
import { api } from '@/lib/api';
import { useEventos } from '@/lib/eventos';
import { useUser } from '@/hooks/use-user';

import { ChatConversa } from './chat-conversa';
import {
  EncaminharDialog,
  FinalizarDialog,
  NovaConversaDialog,
  RegistrarAtendimentoDialog,
  SimularMensagemDialog,
  VincularDialog,
} from './dialogs-conversa';
import { ListaConversas } from './lista-conversas';
import { PainelCliente } from './painel-cliente';
import { abaDa, formatarDuracao } from './util';

const CONTAGEM_VAZIA: Record<AbaConversa, number> = {
  triagem: 0,
  aguardando: 0,
  em_atendimento: 0,
  agente: 0,
  finalizadas: 0,
};
const ATRASO_BUSCA_MS = 300;
const ATRASO_EVENTO_MS = 250;
const RELOGIO_MS = 30_000;
// Preferência de cada pessoa: painel do cliente aberto ou chat mais largo.
const CHAVE_PAINEL = 'apta.atendimento.painelCliente';

function lerPreferenciaPainel(): boolean {
  try {
    return globalThis.localStorage.getItem(CHAVE_PAINEL) !== '0';
  } catch {
    return true;
  }
}

interface Resumo {
  tempoMedioEspera: number | null;
  tempoMedioAtendimento: number | null;
  finalizadosHoje: number;
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }): React.JSX.Element {
  return (
    <Stack sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" noWrap>
        {titulo}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {valor}
      </Typography>
    </Stack>
  );
}

export function CaixaEntrada(): React.JSX.Element {
  const { user } = useUser();
  const router = useRouter();
  const params = useSearchParams();

  const [aba, setAba] = React.useState<AbaConversa>('aguardando');
  const [busca, setBusca] = React.useState('');
  const [buscaAplicada, setBuscaAplicada] = React.useState('');
  const [setorId, setSetorId] = React.useState('');
  const [minhas, setMinhas] = React.useState(false);

  const [conversas, setConversas] = React.useState<Conversa[]>([]);
  const [contagem, setContagem] = React.useState(CONTAGEM_VAZIA);
  const [carregando, setCarregando] = React.useState(true);
  const [selecionadaId, setSelecionadaId] = React.useState<string | null>(null);
  const [detalhe, setDetalhe] = React.useState<ConversaDetalhe | null>(null);

  const [setores, setSetores] = React.useState<Setor[]>([]);
  const [usuarios, setUsuarios] = React.useState<UsuarioResumo[]>([]);
  const [clientes, setClientes] = React.useState<Cliente[]>([]);
  const [motivos, setMotivos] = React.useState<MotivoAtendimento[]>([]);
  const [agentes, setAgentes] = React.useState<AgenteIA[]>([]);
  const [whatsapp, setWhatsapp] = React.useState<StatusWhatsApp | null>(null);
  const [resumo, setResumo] = React.useState<Resumo | null>(null);

  const [dialogo, setDialogo] = React.useState<
    null | 'encaminhar' | 'vincular' | 'finalizar' | 'nova' | 'simular' | 'registrar'
  >(null);
  const [clienteNovaConversa, setClienteNovaConversa] = React.useState<string | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);

  // Telas largas: o painel é uma coluna (preferência lembrada). Menores: gaveta
  // que só abre quando pedida.
  const telaLarga = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const [painelColuna, setPainelColuna] = React.useState(true);
  const [painelGaveta, setPainelGaveta] = React.useState(false);
  React.useEffect(() => {
    setPainelColuna(lerPreferenciaPainel());
  }, []);

  function alternarPainel(): void {
    if (!telaLarga) {
      setPainelGaveta((aberto) => !aberto);
      return;
    }
    setPainelColuna((aberto) => {
      try {
        globalThis.localStorage.setItem(CHAVE_PAINEL, aberto ? '0' : '1');
      } catch {
        // sem armazenamento: vale só nesta visita
      }
      return !aberto;
    });
  }
  const [agora, setAgora] = React.useState(() => dayjs());

  const reportarErro = React.useCallback((error: unknown, padrao: string) => {
    setErro(error instanceof Error ? error.message : padrao);
  }, []);

  // Cadastros de apoio (uma vez).
  React.useEffect(() => {
    Promise.all([
      api<Setor[]>('/setores'),
      api<UsuarioResumo[]>('/usuarios'),
      api<Cliente[]>('/clientes'),
      api<MotivoAtendimento[]>('/motivos-atendimento'),
      api<AgenteIA[]>('/agentes'),
      api<StatusWhatsApp>('/whatsapp/status'),
    ])
      .then(([s, u, c, m, a, w]) => {
        setSetores(s);
        setUsuarios(u.filter((x) => x.ativo));
        setClientes(c);
        setMotivos(m);
        setAgentes(a);
        setWhatsapp(w);
      })
      .catch((error: unknown) => reportarErro(error, 'Erro ao carregar cadastros'));
  }, [reportarErro]);

  React.useEffect(() => {
    const intervalo = setInterval(() => setAgora(dayjs()), RELOGIO_MS);
    return () => clearInterval(intervalo);
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), ATRASO_BUSCA_MS);
    return () => clearTimeout(t);
  }, [busca]);

  const carregarLista = React.useCallback(() => {
    const qs = new URLSearchParams({ aba });
    if (buscaAplicada) qs.set('busca', buscaAplicada);
    if (setorId) qs.set('setorId', setorId);
    if (minhas) qs.set('minhas', '1');
    api<{ conversas: Conversa[]; contagem: Record<AbaConversa, number> }>(`/conversas?${qs.toString()}`)
      .then((r) => {
        setConversas(r.conversas);
        setContagem(r.contagem);
      })
      .catch((error: unknown) => reportarErro(error, 'Erro ao carregar conversas'))
      .finally(() => setCarregando(false));
  }, [aba, buscaAplicada, setorId, minhas, reportarErro]);

  const carregarResumo = React.useCallback(() => {
    api<Resumo>('/atendimentos/resumo?dias=30')
      .then(setResumo)
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  React.useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  const selecionadaRef = React.useRef(selecionadaId);
  selecionadaRef.current = selecionadaId;

  const carregarDetalhe = React.useCallback(
    (id: string) => {
      api<ConversaDetalhe>(`/conversas/${id}`)
        // Ignora a resposta se, enquanto carregava, outra conversa foi aberta.
        .then((d) => {
          if (selecionadaRef.current === id) setDetalhe(d);
        })
        .catch((error: unknown) => reportarErro(error, 'Erro ao abrir conversa'));
    },
    [reportarErro]
  );

  React.useEffect(() => {
    if (selecionadaId) {
      carregarDetalhe(selecionadaId);
    } else {
      setDetalhe(null);
    }
  }, [selecionadaId, carregarDetalhe]);

  // Tempo real: junta rajadas de eventos numa recarga só.
  const pendente = React.useRef<{ lista: boolean; detalhe: boolean; timer: ReturnType<typeof setTimeout> | null }>({
    lista: false,
    detalhe: false,
    timer: null,
  });
  const recarregar = React.useRef({ carregarLista, carregarDetalhe, carregarResumo });
  recarregar.current = { carregarLista, carregarDetalhe, carregarResumo };

  useEventos((evento) => {
    const p = pendente.current;
    p.lista = true;
    if (evento.conversaId === selecionadaRef.current) p.detalhe = true;
    if (p.timer) return;
    p.timer = setTimeout(() => {
      const { carregarLista: lista, carregarDetalhe: det, carregarResumo: res } = recarregar.current;
      if (p.lista) {
        lista();
        res();
      }
      if (p.detalhe && selecionadaRef.current) det(selecionadaRef.current);
      p.lista = false;
      p.detalhe = false;
      p.timer = null;
    }, ATRASO_EVENTO_MS);
  });

  // A aba acompanha a conversa aberta (ao abrir e quando ela muda de etapa,
  // ex.: respondeu e saiu da fila), para ela não sumir da lista.
  const ultimaAbaSincronizada = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!detalhe) return;
    const chave = `${detalhe.id}:${abaDa(detalhe)}`;
    if (ultimaAbaSincronizada.current === chave) return;
    ultimaAbaSincronizada.current = chave;
    setAba(abaDa(detalhe));
  }, [detalhe]);

  // Links vindos de fora: ?conversa=<id> abre a conversa; ?cliente=<id> abre "Nova conversa".
  const conversaParam = params.get('conversa');
  const clienteParam = params.get('cliente');
  React.useEffect(() => {
    if (conversaParam) setSelecionadaId(conversaParam);
  }, [conversaParam]);
  React.useEffect(() => {
    if (clienteParam) {
      setClienteNovaConversa(clienteParam);
      setDialogo('nova');
    }
  }, [clienteParam]);

  function selecionar(id: string | null): void {
    setSelecionadaId(id);
    router.replace(id ? `${paths.dashboard.atendimento}?conversa=${id}` : paths.dashboard.atendimento, {
      scroll: false,
    });
  }

  function fecharDialogo(): void {
    setDialogo(null);
    if (clienteParam) router.replace(paths.dashboard.atendimento, { scroll: false });
  }

  const colunas = {
    xs: '1fr',
    md: '340px minmax(0, 1fr)',
    lg: painelColuna ? '340px minmax(0, 1fr) 300px' : '340px minmax(0, 1fr)',
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4">Atendimento</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <WhatsappLogoIcon color="var(--mui-palette-success-main)" />
            <Typography color="text.secondary" variant="body2">
              {whatsapp?.simulador
                ? 'WhatsApp em modo simulador (sem número conectado)'
                : whatsapp
                  ? `WhatsApp conectado (${whatsapp.provedor})`
                  : 'Conversas do WhatsApp'}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={3} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Tooltip title="Últimos 30 dias">
            <Stack direction="row" spacing={3}>
              <Indicador
                titulo="Espera média"
                valor={resumo?.tempoMedioEspera == null ? '—' : formatarDuracao(resumo.tempoMedioEspera)}
              />
              <Indicador
                titulo="Duração média"
                valor={resumo?.tempoMedioAtendimento == null ? '—' : formatarDuracao(resumo.tempoMedioAtendimento)}
              />
              <Indicador titulo="Finalizados hoje" valor={String(resumo?.finalizadosHoje ?? '—')} />
            </Stack>
          </Tooltip>
          {whatsapp?.simulador ? (
            <Tooltip title="Faz o papel do cliente mandando mensagem, enquanto o WhatsApp não está conectado">
              <Button startIcon={<ChatsCircleIcon />} onClick={() => setDialogo('simular')}>
                Simular mensagem
              </Button>
            </Tooltip>
          ) : null}
          <Button
            variant="outlined"
            startIcon={<WhatsappLogoIcon />}
            onClick={() => {
              setClienteNovaConversa(null);
              setDialogo('nova');
            }}
          >
            Nova conversa
          </Button>
          <Button variant="contained" startIcon={<PlusIcon />} onClick={() => setDialogo('registrar')}>
            Registrar atendimento
          </Button>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          display: 'grid',
          gridTemplateColumns: colunas,
          height: { xs: 'calc(100vh - 220px)', md: 'calc(100vh - 230px)' },
          minHeight: 560,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            borderRight: { md: '1px solid var(--mui-palette-divider)' },
            minHeight: 0,
            display: { xs: selecionadaId ? 'none' : 'block', md: 'block' },
          }}
        >
          <ListaConversas
            aba={aba}
            onAba={setAba}
            contagem={contagem}
            conversas={conversas}
            carregando={carregando}
            selecionadaId={selecionadaId}
            onSelecionar={selecionar}
            busca={busca}
            onBusca={setBusca}
            setores={setores}
            setorId={setorId}
            onSetorId={setSetorId}
            minhas={minhas}
            onMinhas={setMinhas}
            agora={agora}
          />
        </Box>
        <Box sx={{ minHeight: 0, minWidth: 0, display: { xs: selecionadaId ? 'block' : 'none', md: 'block' } }}>
          {detalhe ? (
            <ChatConversa
              conversa={detalhe}
              usuarioId={user?.id ?? null}
              agentes={agentes}
              whatsapp={whatsapp}
              onVoltar={() => selecionar(null)}
              onVincular={() => setDialogo('vincular')}
              onEncaminhar={() => setDialogo('encaminhar')}
              onFinalizar={() => setDialogo('finalizar')}
              painelVisivel={telaLarga ? painelColuna : painelGaveta}
              onAlternarPainel={alternarPainel}
              onErro={setErro}
            />
          ) : (
            <Stack spacing={1} sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <ChatsCircleIcon size={48} color="var(--mui-palette-text-secondary)" />
              <Typography color="text.secondary">Escolha uma conversa para abrir o chat.</Typography>
            </Stack>
          )}
        </Box>
        <Box
          sx={{
            display: { xs: 'none', lg: painelColuna ? 'block' : 'none' },
            borderLeft: '1px solid var(--mui-palette-divider)',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {detalhe ? <PainelCliente conversa={detalhe} onVincular={() => setDialogo('vincular')} /> : null}
        </Box>
      </Paper>
      <Drawer
        anchor="right"
        open={!telaLarga && painelGaveta && Boolean(detalhe)}
        onClose={() => setPainelGaveta(false)}
        slotProps={{ paper: { sx: { width: 320, maxWidth: '90vw' } } }}
      >
        {detalhe ? <PainelCliente conversa={detalhe} onVincular={() => setDialogo('vincular')} /> : null}
      </Drawer>

      <EncaminharDialog
        open={dialogo === 'encaminhar'}
        conversa={detalhe}
        setores={setores}
        usuarios={usuarios}
        clientes={clientes}
        onClose={fecharDialogo}
      />
      <VincularDialog open={dialogo === 'vincular'} conversa={detalhe} clientes={clientes} onClose={fecharDialogo} />
      <FinalizarDialog open={dialogo === 'finalizar'} conversa={detalhe} motivos={motivos} onClose={fecharDialogo} />
      <NovaConversaDialog
        open={dialogo === 'nova'}
        clientes={clientes}
        setores={setores}
        clienteInicialId={clienteNovaConversa}
        setorPadraoId={user?.setor?.id ?? null}
        onClose={fecharDialogo}
        onCriada={(id) => {
          setDialogo(null);
          ultimaAbaSincronizada.current = null;
          selecionar(id);
        }}
      />
      <RegistrarAtendimentoDialog
        open={dialogo === 'registrar'}
        clientes={clientes}
        setores={setores}
        usuarios={usuarios}
        motivos={motivos}
        clienteInicialId={null}
        setorPadraoId={user?.setor?.id ?? null}
        onClose={fecharDialogo}
        onRegistrado={(id) => {
          setDialogo(null);
          ultimaAbaSincronizada.current = null;
          selecionar(id);
        }}
      />
      <SimularMensagemDialog
        open={dialogo === 'simular'}
        clientes={clientes}
        onClose={fecharDialogo}
        onSimulada={(id) => {
          setDialogo(null);
          ultimaAbaSincronizada.current = null;
          selecionar(id);
        }}
      />

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
