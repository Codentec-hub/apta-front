'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { BellSlashIcon } from '@phosphor-icons/react/dist/ssr/BellSlash';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { SpeakerHighIcon } from '@phosphor-icons/react/dist/ssr/SpeakerHigh';
import { SpeakerSlashIcon } from '@phosphor-icons/react/dist/ssr/SpeakerSlash';

import { api } from '@/lib/api';
import {
  notificarNavegador,
  prepararSom,
  reivindicar,
  salvarPreferenciasAviso,
  tocarSom,
  usePreferenciasAviso,
} from '@/lib/avisos-locais';
import { useEventos, type EventoTempoReal } from '@/lib/eventos';
import { useUser } from '@/hooks/use-user';
import type { Notificacao, PaginaNotificacoes } from '@/lib/notificacoes';
import { paths } from '@/paths';

import { ItemNotificacao } from './item-notificacao';
import { MAX_TOASTS, ToastsNotificacoes, type AvisoTela } from './toasts-notificacoes';

/** Sino do topo: contador em tempo real, lista rápida e aviso de notificação nova. */
export function SinoNotificacoes(): React.JSX.Element {
  const router = useRouter();
  const ancora = React.useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = React.useState(false);
  const [aba, setAba] = React.useState<'nao_lidas' | 'todas'>('nao_lidas');
  const [naoLidas, setNaoLidas] = React.useState(0);
  const [itens, setItens] = React.useState<Notificacao[] | null>(null);
  const prefs = usePreferenciasAviso();
  const prefsRef = React.useRef(prefs);
  prefsRef.current = prefs;
  // Avisos na tela: os primeiros MAX_TOASTS aparecem, o resto espera a vez.
  const [toasts, setToasts] = React.useState<AvisoTela[]>([]);
  const { user } = useUser();
  const usuarioId = user?.id;
  // IDs já conhecidos: só o que é realmente novo vira aviso (nada de reavisar ao reconectar).
  const conhecidas = React.useRef<Set<string> | null>(null);

  const carregar = React.useCallback(async () => {
    try {
      const r = await api<PaginaNotificacoes>(`/notificacoes?filtro=${aba}&porPagina=8`);
      setNaoLidas(r.naoLidas);
      setItens(r.itens);
    } catch {
      // sem rede: tenta de novo no próximo evento/intervalo
    }
  }, [aba]);

  const verNovas = React.useCallback(async () => {
    try {
      const r = await api<PaginaNotificacoes>('/notificacoes?filtro=nao_lidas&porPagina=15');
      const vistas = conhecidas.current;
      conhecidas.current = new Set([...(vistas ?? []), ...r.itens.map((i) => i.id)]);
      if (!vistas) return; // primeira carga: só registra o que já existia
      const novas = r.itens.filter((i) => !vistas.has(i.id) && recente(i.criadoEm)); // mais nova primeiro
      if (novas.length === 0) return;
      const p = prefsRef.current;
      if (p.toast) setToasts((t) => [...novas, ...t.filter((x) => !novas.some((n) => n.id === x.id))]);
      const maisGrave = novas.reduce((a, b) => (PESO[b.severidade] > PESO[a.severidade] ? b : a));
      if (!reivindicar(maisGrave.id)) return; // outra aba já avisou
      if (p.som) tocarSom(maisGrave.severidade, p.volume);
      if (p.navegador && document.hidden) {
        const ultima = novas[0];
        notificarNavegador(
          novas.length > 1 ? `${novas.length} notificações novas` : ultima.titulo,
          novas.length > 1 ? novas.map((n) => n.titulo).join('\n') : ultima.mensagem,
          () => router.push(novas.length > 1 ? paths.dashboard.notificacoes : (ultima.href ?? paths.dashboard.notificacoes)),
          `apta-${ultima.id}`
        );
      }
    } catch {
      // sem rede
    }
  }, [router]);

  React.useEffect(() => {
    void verNovas();
    return prepararSom();
  }, [verNovas]);

  React.useEffect(() => {
    void carregar();
  }, [carregar]);

  // Tempo real (SSE) + segurança a cada 2 min caso a conexão caia.
  // Mensagem nova de cliente: filtra pelas preferências, agrupa por conversa.
  const aoReceberMensagem = (e: Extract<EventoTempoReal, { tipo: 'mensagem' }>) => {
    const p = prefsRef.current;
    if (!p.mensagens || !usuarioId) return;
    if (e.modo === 'AGENTE' && !p.mensagensComAssistente) return;
    if (p.mensagensDe === 'minhas' && e.responsavelId !== usuarioId) return;
    if (p.mensagensDe === 'minhas_e_livres' && e.responsavelId && e.responsavelId !== usuarioId) return;
    // Conversa aberta na tela: a pessoa já está vendo, não avisa.
    const aqui = globalThis.location;
    const naConversa =
      aqui.pathname.startsWith(paths.dashboard.atendimento) &&
      new URLSearchParams(aqui.search).get('conversa') === e.conversaId;
    if (naConversa && !document.hidden) return;

    const id = `msg:${e.conversaId}`;
    setToasts((t) => {
      const anterior = t.find((x) => x.id === id);
      const quantidade = (anterior?.mensagemCliente?.quantidade ?? 0) + 1;
      const aviso: AvisoTela = {
        id,
        tipo: 'mensagem_cliente',
        categoria: e.lead ? 'lead no WhatsApp' : 'mensagem de cliente',
        severidade: 'info',
        titulo: e.cliente && e.cliente !== e.nome ? `${e.nome} · ${e.cliente}` : e.nome,
        mensagem: e.texto || '📎 Arquivo ou mídia',
        href: `${paths.dashboard.atendimento}?conversa=${e.conversaId}`,
        lidaEm: null,
        arquivadaEm: null,
        emailEnviadoEm: null,
        criadoEm: new Date().toISOString(),
        mensagemCliente: { conversaId: e.conversaId, quantidade, chave: e.mensagemId },
      };
      return p.toast ? [aviso, ...t.filter((x) => x.id !== id)] : t;
    });
    if (!reivindicar(e.mensagemId)) return; // outra aba já avisou
    if (p.somMensagens) tocarSom('mensagem', p.volume);
    if (p.navegador && document.hidden) {
      notificarNavegador(
        e.nome,
        e.texto || 'Arquivo ou mídia',
        () => router.push(`${paths.dashboard.atendimento}?conversa=${e.conversaId}`),
        `apta-msg-${e.conversaId}`
      );
    }
  };

  useEventos((evento) => {
    if (evento.tipo === 'mensagem') aoReceberMensagem(evento);
    if (evento.tipo === 'notificacao') {
      void carregar();
      void verNovas();
    }
  });
  React.useEffect(() => {
    const t = setInterval(() => {
      void carregar();
      void verNovas();
    }, 120_000);
    return () => clearInterval(t);
  }, [carregar, verNovas]);

  // Contador no título da aba do navegador.
  React.useEffect(() => {
    const limpo = document.title.replace(/^\(\d+\+?\) /, '');
    document.title = naoLidas > 0 ? `(${naoLidas > 99 ? '99+' : naoLidas}) ${limpo}` : limpo;
  }, [naoLidas, itens]);

  const lidas = React.useRef(new Set<string>());

  function marcarLida(n: AvisoTela): void {
    setToasts((t) => t.filter((x) => x.id !== n.id));
    if (n.mensagemCliente || n.lidaEm || lidas.current.has(n.id)) return;
    lidas.current.add(n.id);
    setItens((l) => l?.map((i) => (i.id === n.id ? { ...i, lidaEm: new Date().toISOString() } : i)) ?? l);
    setNaoLidas((c) => Math.max(0, c - 1));
    void api('/notificacoes/lidas', { method: 'POST', body: JSON.stringify({ ids: [n.id] }) }).catch(() => {});
  }

  function abrir(n: AvisoTela): void {
    marcarLida(n);
    setAberto(false);
    router.push(n.href ?? paths.dashboard.notificacoes);
  }

  async function arquivar(n: Notificacao): Promise<void> {
    setItens((l) => l?.filter((i) => i.id !== n.id) ?? l);
    if (!n.lidaEm) setNaoLidas((c) => Math.max(0, c - 1));
    await api('/notificacoes/arquivar', { method: 'POST', body: JSON.stringify({ ids: [n.id] }) }).catch(() => {});
  }

  async function lerTodas(): Promise<void> {
    await api('/notificacoes/lidas', { method: 'POST', body: '{}' }).catch(() => {});
    await carregar();
  }

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton ref={ancora} onClick={() => setAberto(true)} aria-label={`Notificações: ${naoLidas} não lidas`}>
          <Badge badgeContent={naoLidas} color="error" max={99}>
            <BellIcon fontSize="var(--icon-fontSize-lg)" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        anchorEl={ancora.current}
        open={aberto}
        onClose={() => setAberto(false)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { width: { xs: 'calc(100vw - 32px)', sm: 420 }, maxWidth: 420 } } }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5 }}>
          <Typography variant="h6">Notificações</Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {naoLidas > 0 ? (
              <Button size="small" onClick={() => void lerTodas()}>
                Marcar todas como lidas
              </Button>
            ) : null}
            <Tooltip title={prefs.som ? 'Som ligado (clique para silenciar)' : 'Som desligado (clique para ligar)'}>
              <IconButton
                size="small"
                aria-label={prefs.som ? 'Silenciar som das notificações' : 'Ligar som das notificações'}
                onClick={() => {
                  salvarPreferenciasAviso({ som: !prefs.som });
                  if (!prefs.som) tocarSom('info', prefs.volume);
                }}
              >
                {prefs.som ? <SpeakerHighIcon /> : <SpeakerSlashIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Preferências">
              <IconButton
                size="small"
                component={RouterLink}
                href={paths.dashboard.preferenciasNotificacoes}
                onClick={() => setAberto(false)}
              >
                <GearSixIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Tabs value={aba} onChange={(_e, v: 'nao_lidas' | 'todas') => setAba(v)} sx={{ px: 2 }}>
          <Tab value="nao_lidas" label={`Não lidas${naoLidas ? ` (${naoLidas})` : ''}`} />
          <Tab value="todas" label="Todas" />
        </Tabs>
        <Divider />
        <Box sx={{ maxHeight: 440, overflowY: 'auto' }}>
          {itens && itens.length === 0 ? (
            <Stack spacing={1} sx={{ alignItems: 'center', py: 5, color: 'text.secondary' }}>
              <BellSlashIcon fontSize="var(--icon-fontSize-lg)" />
              <Typography variant="body2">{aba === 'nao_lidas' ? 'Tudo lido por aqui.' : 'Nenhuma notificação ainda.'}</Typography>
            </Stack>
          ) : (
            (itens ?? []).map((n) => (
              <ItemNotificacao key={n.id} n={n} compacto onAbrir={abrir} onArquivar={(x) => void arquivar(x)} />
            ))
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button component={RouterLink} href={paths.dashboard.notificacoes} onClick={() => setAberto(false)} fullWidth>
            Ver todas as notificações
          </Button>
        </Box>
      </Popover>

      <ToastsNotificacoes
        itens={toasts.slice(0, MAX_TOASTS)}
        extras={Math.max(0, toasts.length - MAX_TOASTS)}
        onAbrir={abrir}
        onLida={marcarLida}
        onFechar={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
        onFecharTodos={() => setToasts([])}
        onVerTodas={() => {
          setToasts([]);
          router.push(paths.dashboard.notificacoes);
        }}
      />
    </>
  );
}

/** Criada nos últimos 3 min (não estoura aviso de coisa antiga ao reconectar). */
function recente(data: string): boolean {
  return Date.now() - new Date(data).getTime() < 180_000;
}

const PESO: Record<Notificacao['severidade'], number> = { info: 0, sucesso: 1, aviso: 2, erro: 3 };
