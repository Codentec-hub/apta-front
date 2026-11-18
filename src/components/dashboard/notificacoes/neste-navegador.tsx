'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { SpeakerHighIcon } from '@phosphor-icons/react/dist/ssr/SpeakerHigh';
import { SpeakerLowIcon } from '@phosphor-icons/react/dist/ssr/SpeakerLow';

import {
  pedirPermissaoNavegador,
  salvarPreferenciasAviso,
  suportaNotificacaoNavegador,
  tocarSom,
  usePreferenciasAviso,
} from '@/lib/avisos-locais';

/** Aviso na tela, som e notificação do navegador — valem só neste aparelho. */
export function NesteNavegador(): React.JSX.Element {
  const p = usePreferenciasAviso();
  const [permissao, setPermissao] = React.useState<NotificationPermission | 'indisponivel'>('default');

  React.useEffect(() => {
    setPermissao(suportaNotificacaoNavegador() ? Notification.permission : 'indisponivel');
  }, []);

  async function mudarNavegador(ligar: boolean): Promise<void> {
    if (!ligar) {
      salvarPreferenciasAviso({ navegador: false });
      return;
    }
    const r = await pedirPermissaoNavegador();
    setPermissao(r);
    salvarPreferenciasAviso({ navegador: r === 'granted' });
  }

  const linha = (titulo: string, descricao: string, controle: React.ReactNode) => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <Typography variant="subtitle2">{titulo}</Typography>
        <Typography variant="body2" color="text.secondary">
          {descricao}
        </Typography>
      </div>
      {controle}
    </Stack>
  );

  return (
    <Card>
      <CardHeader title="Neste navegador" subheader="Como avisar quando chega notificação nova. Vale só para este aparelho." />
      <Divider />
      <CardContent>
        <Stack spacing={2.5}>
          {linha(
            'Aviso na tela',
            'Mostra uma prévia no canto da tela, com atalho para abrir.',
            <Switch checked={p.toast} onChange={(e) => salvarPreferenciasAviso({ toast: e.target.checked })} />
          )}
          {linha(
            'Som',
            'Toca um sinal curto. Avisos de erro têm um som diferente.',
            <Switch checked={p.som} onChange={(e) => salvarPreferenciasAviso({ som: e.target.checked })} />
          )}
          {p.som ? (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', maxWidth: 420 }}>
              <SpeakerLowIcon />
              <Slider
                size="small"
                min={0.1}
                max={1}
                step={0.1}
                value={p.volume}
                onChange={(_e, v) => salvarPreferenciasAviso({ volume: v as number })}
                onChangeCommitted={(_e, v) => tocarSom('info', v as number)}
                aria-label="Volume"
              />
              <SpeakerHighIcon />
              <Button size="small" onClick={() => tocarSom('info', p.volume)} sx={{ flexShrink: 0 }}>
                Testar
              </Button>
            </Stack>
          ) : null}
          {linha(
            'Notificação do navegador',
            'Avisa mesmo com o sistema em outra aba ou minimizado.',
            <Switch
              checked={p.navegador && permissao === 'granted'}
              disabled={permissao === 'indisponivel' || permissao === 'denied'}
              onChange={(e) => void mudarNavegador(e.target.checked)}
            />
          )}
          {permissao === 'denied' ? (
            <Alert severity="info">
              O navegador está bloqueando as notificações deste site. Para liberar, clique no cadeado ao lado do endereço e
              permita as notificações.
            </Alert>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
