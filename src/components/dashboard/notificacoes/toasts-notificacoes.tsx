'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChatCircleTextIcon } from '@phosphor-icons/react/dist/ssr/ChatCircleText';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { InfoIcon } from '@phosphor-icons/react/dist/ssr/Info';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';
import { WarningOctagonIcon } from '@phosphor-icons/react/dist/ssr/WarningOctagon';
import { XIcon } from '@phosphor-icons/react/dist/ssr/X';

import { COR_SEVERIDADE, quando, type Notificacao, type SeveridadeNotificacao } from '@/lib/notificacoes';

const ICONE: Record<SeveridadeNotificacao, Icon> = {
  info: InfoIcon,
  sucesso: CheckCircleIcon,
  aviso: WarningIcon,
  erro: WarningOctagonIcon,
};

/** Erro fica mais tempo na tela; o tempo pausa com o mouse em cima. */
const DURACAO: Record<SeveridadeNotificacao, number> = { info: 7000, sucesso: 6000, aviso: 10_000, erro: 14_000 };
export const MAX_TOASTS = 3;

/** Item da pilha: uma notificação ou a mensagem nova de um cliente (agrupada por conversa). */
export type AvisoTela = Notificacao & {
  mensagemCliente?: { conversaId: string; quantidade: number; chave: string };
};

interface Props {
  itens: AvisoTela[];
  extras: number; // quantas chegaram além das visíveis
  onAbrir: (n: Notificacao) => void;
  onLida: (n: Notificacao) => void;
  onFechar: (id: string) => void;
  onFecharTodos: () => void;
  onVerTodas: () => void;
}

/** Pilha de avisos no canto da tela para notificações que acabaram de chegar. */
export function ToastsNotificacoes({ itens, extras, onAbrir, onLida, onFechar, onFecharTodos, onVerTodas }: Props): React.JSX.Element {
  return (
    <Stack
      spacing={1}
      aria-live="polite"
      sx={{
        position: 'fixed',
        zIndex: 'var(--mui-zIndex-snackbar)',
        right: { xs: 16, sm: 24 },
        left: { xs: 16, sm: 'auto' },
        bottom: { xs: 16, sm: 24 },
        width: { sm: 380 },
        alignItems: 'stretch',
        pointerEvents: 'none',
      }}
    >
      {extras > 0 || itens.length > 1 ? (
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pointerEvents: 'auto' }}>
          {extras > 0 ? (
            <Button size="small" variant="contained" color="secondary" onClick={onVerTodas}>
              +{extras} {extras === 1 ? 'nova' : 'novas'}
            </Button>
          ) : null}
          <Button size="small" variant="contained" color="secondary" onClick={onFecharTodos}>
            Fechar todas
          </Button>
        </Stack>
      ) : null}
      {itens.map((n) => (
        <Toast key={n.mensagemCliente?.chave ?? n.id} n={n} onAbrir={onAbrir} onLida={onLida} onFechar={onFechar} />
      ))}
    </Stack>
  );
}

function Toast({
  n,
  onAbrir,
  onLida,
  onFechar,
}: {
  n: AvisoTela;
  onAbrir: (n: Notificacao) => void;
  onLida: (n: Notificacao) => void;
  onFechar: (id: string) => void;
}): React.JSX.Element {
  const msg = n.mensagemCliente;
  const Icone = msg ? ChatCircleTextIcon : (ICONE[n.severidade] ?? InfoIcon);
  const cor = msg ? 'var(--mui-palette-success-main)' : COR_SEVERIDADE[n.severidade];
  const duracao = msg ? 9000 : (DURACAO[n.severidade] ?? 7000);
  const [visivel, setVisivel] = React.useState(true);
  const [pausado, setPausado] = React.useState(false);
  const restante = React.useRef(duracao);
  const fechar = React.useCallback(() => setVisivel(false), []);

  // Contagem regressiva que pausa com o mouse em cima ou com a aba escondida.
  React.useEffect(() => {
    if (pausado || !visivel) return;
    let ultimo = Date.now();
    const t = setInterval(() => {
      const agora = Date.now();
      if (document.hidden) {
        ultimo = agora;
        return;
      }
      restante.current -= agora - ultimo;
      ultimo = agora;
      if (restante.current <= 0) fechar();
    }, 200);
    return () => clearInterval(t);
  }, [pausado, visivel, fechar]);

  return (
    <Slide direction="left" in={visivel} appear mountOnEnter unmountOnExit onExited={() => onFechar(n.id)}>
      <Paper
        elevation={12}
        role="status"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onClick={() => onAbrir(n)}
        sx={{
          pointerEvents: 'auto',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          borderLeft: `4px solid ${cor}`,
          '&:hover': { boxShadow: 'var(--mui-shadows-16)' },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ p: 1.75, pr: 1, alignItems: 'flex-start' }}>
          <Box sx={{ color: cor, display: 'flex', pt: 0.25 }}>
            <Icone fontSize="var(--icon-fontSize-lg)" weight="fill" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }} noWrap>
                {n.categoria}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                · {quando(n.criadoEm)}
              </Typography>
              {msg && msg.quantidade > 1 ? (
                <Typography variant="caption" sx={{ color: cor, fontWeight: 700, flexShrink: 0 }}>
                  · {msg.quantidade} mensagens
                </Typography>
              ) : null}
            </Stack>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {n.titulo}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {n.mensagem}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onAbrir(n);
                }}
              >
                {msg ? 'Responder' : n.href ? 'Abrir' : 'Ver'}
              </Button>
              {msg ? null : (
                <Button
                  size="small"
                  color="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLida(n);
                    fechar();
                  }}
                >
                  Marcar como lida
                </Button>
              )}
            </Stack>
          </Box>
          <IconButton
            size="small"
            aria-label="Fechar aviso"
            onClick={(e) => {
              e.stopPropagation();
              fechar();
            }}
          >
            <XIcon />
          </IconButton>
        </Stack>
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            height: 3,
            bgcolor: cor,
            opacity: 0.5,
            width: '100%',
            transformOrigin: 'left',
            animation: `apta-toast-barra ${duracao}ms linear forwards`,
            animationPlayState: pausado ? 'paused' : 'running',
            '@keyframes apta-toast-barra': { from: { transform: 'scaleX(1)' }, to: { transform: 'scaleX(0)' } },
          }}
        />
      </Paper>
    </Slide>
  );
}
