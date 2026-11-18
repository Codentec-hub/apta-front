import * as React from 'react';

import type { SeveridadeNotificacao } from './notificacoes';

/** Como avisar notificação nova neste navegador (fica salvo só neste aparelho). */
export interface PreferenciasAviso {
  toast: boolean;
  som: boolean;
  volume: number; // 0 a 1
  navegador: boolean; // notificação do sistema operacional quando a aba está em segundo plano
  // Mensagens de clientes (WhatsApp do atendimento)
  mensagens: boolean;
  mensagensDe: QuaisMensagens;
  mensagensComAssistente: boolean; // também as conversas que o assistente de IA está respondendo
  somMensagens: boolean;
}

export type QuaisMensagens = 'todas' | 'minhas_e_livres' | 'minhas';

export const QUAIS_MENSAGENS: Record<QuaisMensagens, string> = {
  todas: 'De todas as conversas',
  minhas_e_livres: 'Das conversas comigo ou sem responsável',
  minhas: 'Só das conversas comigo',
};

const CHAVE = 'apta:avisos';
const PADRAO: PreferenciasAviso = {
  toast: true,
  som: true,
  volume: 0.6,
  navegador: false,
  mensagens: true,
  mensagensDe: 'minhas_e_livres',
  mensagensComAssistente: false,
  somMensagens: true,
};
const ouvintes = new Set<() => void>();
let cache: PreferenciasAviso | null = null;

export function preferenciasAviso(): PreferenciasAviso {
  if (cache) return cache;
  try {
    const salvo = globalThis.localStorage?.getItem(CHAVE);
    cache = salvo ? { ...PADRAO, ...(JSON.parse(salvo) as Partial<PreferenciasAviso>) } : PADRAO;
  } catch {
    cache = PADRAO;
  }
  return cache;
}

export function salvarPreferenciasAviso(mudanca: Partial<PreferenciasAviso>): void {
  cache = { ...preferenciasAviso(), ...mudanca };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(cache));
  } catch {
    // modo privado / armazenamento bloqueado: vale só nesta sessão
  }
  for (const f of ouvintes) f();
}

export function usePreferenciasAviso(): PreferenciasAviso {
  return React.useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      const outraAba = (e: StorageEvent) => {
        if (e.key === CHAVE) {
          cache = null;
          f();
        }
      };
      globalThis.addEventListener('storage', outraAba);
      return () => {
        ouvintes.delete(f);
        globalThis.removeEventListener('storage', outraAba);
      };
    },
    preferenciasAviso,
    () => PADRAO
  );
}

// ---------- Som (gerado na hora pelo Web Audio, sem arquivo) ----------

let contexto: AudioContext | null = null;

function audio(): AudioContext | null {
  if (contexto) return contexto;
  const Ctor =
    globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  contexto = new Ctor();
  return contexto;
}

/**
 * O navegador só libera áudio depois de um clique/tecla do usuário. Chamar uma
 * vez no carregamento: destrava o som na primeira interação.
 */
function destravar(): void {
  void audio()?.resume().catch(() => {});
}

export function prepararSom(): () => void {
  globalThis.addEventListener('pointerdown', destravar, { once: true });
  globalThis.addEventListener('keydown', destravar, { once: true });
  return () => {
    globalThis.removeEventListener('pointerdown', destravar);
    globalThis.removeEventListener('keydown', destravar);
  };
}

// Notas (Hz) de cada aviso: info/sucesso sobe suave, aviso desce, erro repete.
export type TipoSom = SeveridadeNotificacao | 'mensagem';

const NOTAS: Record<TipoSom, number[]> = {
  mensagem: [1174.7, 1568],
  info: [880, 1318.5],
  sucesso: [784, 1046.5, 1318.5],
  aviso: [1046.5, 784],
  erro: [987.8, 740, 987.8, 740],
};

export function tocarSom(severidade: TipoSom = 'info', volume = preferenciasAviso().volume): void {
  const ctx = audio();
  if (!ctx || volume <= 0) return;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  const passo = severidade === 'erro' ? 0.11 : severidade === 'mensagem' ? 0.08 : 0.13;
  const inicio = ctx.currentTime + 0.02;
  for (const [i, freq] of NOTAS[severidade].entries()) {
    const t = inicio + i * passo;
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    ganho.gain.setValueAtTime(0, t);
    ganho.gain.linearRampToValueAtTime(0.25 * volume, t + 0.012);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(ganho).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}

/**
 * Com o sistema aberto em várias abas, só uma toca o som / mostra a
 * notificação do navegador para cada aviso.
 */
export function reivindicar(id: string): boolean {
  try {
    const chave = `apta:aviso:${id}`;
    if (localStorage.getItem(chave)) return false;
    localStorage.setItem(chave, String(Date.now()));
    setTimeout(() => localStorage.removeItem(chave), 30_000);
    return true;
  } catch {
    return true;
  }
}

// ---------- Notificação do navegador ----------

export function suportaNotificacaoNavegador(): boolean {
  return 'Notification' in globalThis;
}

export async function pedirPermissaoNavegador(): Promise<NotificationPermission> {
  if (!suportaNotificacaoNavegador()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export function notificarNavegador(titulo: string, corpo: string, aoClicar: () => void, tag: string): void {
  if (!suportaNotificacaoNavegador() || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(titulo, { body: corpo, icon: '/apta-logo.png', tag });
    n.addEventListener('click', () => {
      globalThis.focus();
      aoClicar();
      n.close();
    });
  } catch {
    // alguns navegadores móveis só aceitam via service worker
  }
}
