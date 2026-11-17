'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { BellSlashIcon } from '@phosphor-icons/react/dist/ssr/BellSlash';
import { GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';

import { api } from '@/lib/api';
import { useEventos } from '@/lib/eventos';
import type { Notificacao, PaginaNotificacoes } from '@/lib/notificacoes';
import { paths } from '@/paths';

import { ItemNotificacao } from './item-notificacao';

/** Sino do topo: contador em tempo real, lista rápida e aviso de notificação nova. */
export function SinoNotificacoes(): React.JSX.Element {
  const router = useRouter();
  const ancora = React.useRef<HTMLButtonElement>(null);
  const [aberto, setAberto] = React.useState(false);
  const [aba, setAba] = React.useState<'nao_lidas' | 'todas'>('nao_lidas');
  const [naoLidas, setNaoLidas] = React.useState(0);
  const [itens, setItens] = React.useState<Notificacao[] | null>(null);
  const [nova, setNova] = React.useState<Notificacao | null>(null);
  const ultimaVista = React.useRef<string | null>(null);

  const carregar = React.useCallback(
    async (avisarNova = false) => {
      try {
        const r = await api<PaginaNotificacoes>(`/notificacoes?filtro=${aba}&porPagina=8`);
        setNaoLidas(r.naoLidas);
        setItens(r.itens);
        // Aviso flutuante só para a notificação nova (não lida) que acabou de chegar.
        const recente = r.itens.find((i) => !i.lidaEm);
        if (avisarNova && recente && recente.id !== ultimaVista.current && dayjsRecente(recente.criadoEm)) {
          setNova(recente);
        }
        if (recente) ultimaVista.current = recente.id;
      } catch {
        // sem rede: tenta de novo no próximo evento/intervalo
      }
    },
    [aba]
  );

  React.useEffect(() => {
    void carregar();
  }, [carregar]);

  // Tempo real (SSE) + segurança a cada 2 min caso a conexão caia.
  useEventos((evento) => {
    if (evento.tipo === 'notificacao') void carregar(true);
  });
  React.useEffect(() => {
    const t = setInterval(() => void carregar(), 120_000);
    return () => clearInterval(t);
  }, [carregar]);

  // Contador no título da aba do navegador.
  React.useEffect(() => {
    const limpo = document.title.replace(/^\(\d+\+?\) /, '');
    document.title = naoLidas > 0 ? `(${naoLidas > 99 ? '99+' : naoLidas}) ${limpo}` : limpo;
  }, [naoLidas, itens]);

  async function abrir(n: Notificacao): Promise<void> {
    if (!n.lidaEm) {
      setItens((l) => l?.map((i) => (i.id === n.id ? { ...i, lidaEm: new Date().toISOString() } : i)) ?? l);
      setNaoLidas((c) => Math.max(0, c - 1));
      void api('/notificacoes/lidas', { method: 'POST', body: JSON.stringify({ ids: [n.id] }) }).catch(() => {});
    }
    setAberto(false);
    setNova(null);
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
            <Tooltip title="Preferências">
              <IconButton
                size="small"
                component={RouterLink}
                href={`${paths.dashboard.notificacoes}?aba=preferencias`}
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
              <ItemNotificacao key={n.id} n={n} compacto onAbrir={(x) => void abrir(x)} onArquivar={(x) => void arquivar(x)} />
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

      <Snackbar
        open={Boolean(nova)}
        autoHideDuration={8000}
        onClose={() => setNova(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={nova?.severidade === 'erro' ? 'error' : nova?.severidade === 'aviso' ? 'warning' : nova?.severidade === 'sucesso' ? 'success' : 'info'}
          variant="filled"
          onClose={() => setNova(null)}
          sx={{ cursor: 'pointer', maxWidth: 420 }}
          onClick={() => nova && void abrir(nova)}
        >
          <strong>{nova?.titulo}</strong>
          <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {nova?.mensagem}
          </Typography>
        </Alert>
      </Snackbar>
    </>
  );
}

/** Criada no último minuto (para não estourar aviso de coisa antiga ao reconectar). */
function dayjsRecente(data: string): boolean {
  return Date.now() - new Date(data).getTime() < 60_000;
}
