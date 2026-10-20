import * as React from 'react';

import { config } from '@/config';

import { getToken } from './api';

export type EventoTempoReal = { tipo: 'conversa'; conversaId: string };

// Escuta os eventos em tempo real do backend (SSE). O navegador reconecta
// sozinho se a conexão cair.
export function useEventos(aoReceber: (evento: EventoTempoReal) => void): void {
  const callback = React.useRef(aoReceber);
  callback.current = aoReceber;

  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }
    const fonte = new EventSource(`${config.apiUrl}/eventos?token=${encodeURIComponent(token)}`);
    fonte.addEventListener('message', (event: MessageEvent<string>) => {
      try {
        callback.current(JSON.parse(event.data) as EventoTempoReal);
      } catch {
        // evento malformado: ignora
      }
    });
    return () => fonte.close();
  }, []);
}
