'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { SpeakerHighIcon } from '@phosphor-icons/react/dist/ssr/SpeakerHigh';
import { SpeakerLowIcon } from '@phosphor-icons/react/dist/ssr/SpeakerLow';

import {
  pedirPermissaoNavegador,
  QUAIS_MENSAGENS,
  type QuaisMensagens,
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
    <Stack spacing={2}>
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
      <Card>
        <CardHeader
          title="Mensagens de clientes"
          subheader="Aviso quando um cliente ou lead manda mensagem no WhatsApp do atendimento. Não aparece se a conversa já estiver aberta na sua tela."
        />
        <Divider />
        <CardContent>
          <Stack spacing={2.5}>
            {linha(
              'Avisar mensagens novas',
              'Prévia no canto da tela com o nome e o texto, e atalho para responder.',
              <Switch checked={p.mensagens} onChange={(e) => salvarPreferenciasAviso({ mensagens: e.target.checked })} />
            )}
            {p.mensagens ? (
              <>
                <TextField
                  select
                  label="Avisar mensagens"
                  value={p.mensagensDe}
                  onChange={(e) => salvarPreferenciasAviso({ mensagensDe: e.target.value as QuaisMensagens })}
                  sx={{ maxWidth: 420 }}
                >
                  {(Object.keys(QUAIS_MENSAGENS) as QuaisMensagens[]).map((k) => (
                    <MenuItem key={k} value={k}>
                      {QUAIS_MENSAGENS[k]}
                    </MenuItem>
                  ))}
                </TextField>
                {linha(
                  'Incluir conversas com o assistente de IA',
                  'Também avisa quando quem está respondendo é o assistente (ex.: leads na fila de agendamento).',
                  <Switch
                    checked={p.mensagensComAssistente}
                    onChange={(e) => salvarPreferenciasAviso({ mensagensComAssistente: e.target.checked })}
                  />
                )}
                {linha(
                  'Som de mensagem',
                  'Um toque curto, diferente do som das notificações.',
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Button size="small" onClick={() => tocarSom('mensagem', p.volume)}>
                      Testar
                    </Button>
                    <Switch checked={p.somMensagens} onChange={(e) => salvarPreferenciasAviso({ somMensagens: e.target.checked })} />
                  </Stack>
                )}
              </>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              O volume, o aviso na tela e a notificação do navegador seguem o que está escolhido acima.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
