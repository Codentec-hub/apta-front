import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

// Visual do chat inspirado no WhatsApp: fundo bege com desenhos sutis e
// bolhas sólidas (verde para o que o escritório envia). O padrão é próprio
// (temas de escritório contábil), não a imagem do WhatsApp.

function desenhos(cor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
<path d="M18 14h18l8 8v26H18z M36 14v8h8 M23 30h15 M23 36h15 M23 42h10"/>
<path d="M78 20h30a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H92l-8 7v-7h-6a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6z"/>
<circle cx="148" cy="32" r="12"/><path d="M151 26.5c-1-1-2.4-1.5-3.6-1.5-2.2 0-3.6 1.2-3.6 2.8 0 4 7.6 2.2 7.6 6.2 0 1.7-1.6 3-3.9 3-1.6 0-3-.6-4-1.7 M147.5 22.5v2.5 M147.5 39v2.5"/>
<path d="M24 92l6 6 12-14"/>
<rect x="66" y="78" width="30" height="28" rx="3"/><path d="M66 87h30 M74 74v8 M88 74v8 M72 95h4 M80 95h4 M88 95h4"/>
<path d="M130 80l18 22 M132 82a3 3 0 1 0 0.1 0 M146 100a3 3 0 1 0 0.1 0"/>
<rect x="20" y="132" width="22" height="30" rx="3"/><path d="M24 137h14v6H24z M25 149h2 M31 149h2 M25 155h2 M31 155h2 M37 149v8"/>
<path d="M80 140c4-6 10-6 14 0s10 6 14 0"/>
<path d="M132 150l6-14 6 14 M134 145h8 M150 136v20 M146 142h8"/>
<circle cx="56" cy="62" r="1.6"/><circle cx="120" cy="60" r="1.6"/><circle cx="56" cy="120" r="1.6"/><circle cx="118" cy="122" r="1.6"/><circle cx="165" cy="165" r="1.6"/>
</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const CLARO = {
  '--chat-fundo': '#efeae2',
  '--chat-desenhos': desenhos('rgba(84, 66, 42, 0.065)'),
  '--chat-entrada': '#ffffff',
  '--chat-saida': '#d9fdd3',
  '--chat-agente': '#dcebfb',
  '--chat-automacao': '#ece5fb',
  '--chat-nota': '#fff3c4',
  '--chat-aviso': '#ffffff',
  '--chat-sombra': '0 1px 0.5px rgba(11, 20, 26, 0.13)',
};

const ESCURO = {
  '--chat-fundo': '#0b141a',
  '--chat-desenhos': desenhos('rgba(255, 255, 255, 0.045)'),
  '--chat-entrada': '#202c33',
  '--chat-saida': '#005c4b',
  '--chat-agente': '#1d3a57',
  '--chat-automacao': '#3a2f5b',
  '--chat-nota': '#4b4013',
  '--chat-aviso': '#182229',
  '--chat-sombra': '0 1px 0.5px rgba(0, 0, 0, 0.3)',
};

// Aplicar no container das mensagens: define as cores (claro/escuro) e o fundo.
export function estiloFundoChat(theme: Theme): SystemStyleObject<Theme> {
  return {
    ...CLARO,
    ...theme.applyStyles('dark', ESCURO),
    backgroundColor: 'var(--chat-fundo)',
    backgroundImage: 'var(--chat-desenhos)',
    backgroundRepeat: 'repeat',
    backgroundSize: '180px 180px',
  } as SystemStyleObject<Theme>;
}
