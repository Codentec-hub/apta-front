'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { WhatsappLogoIcon } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import dayjs from 'dayjs';

import type { LinkAcesso, Usuario } from '@/types/domain';

/** Mostra o link de convite/redefinição para copiar ou mandar pelo WhatsApp. */
export function LinkAcessoDialog({
  usuario,
  acesso,
  onClose,
}: {
  usuario: Usuario | null;
  acesso: LinkAcesso | null;
  onClose: () => void;
}): React.JSX.Element {
  const [copiado, setCopiado] = React.useState(false);
  React.useEffect(() => setCopiado(false), [acesso]);

  // O link vem do servidor (APP_URL); usa o endereço desta tela para não
  // depender da variável estar certa no servidor.
  const linkFinal = React.useMemo(() => {
    if (!acesso) return '';
    try {
      const u = new URL(acesso.link);
      return `${globalThis.location.origin}${u.pathname}${u.search}`;
    } catch {
      return acesso.link;
    }
  }, [acesso]);
  const convite = acesso?.tipo === 'CONVITE';
  const primeiro = usuario?.nome.split(' ')[0] ?? '';
  const texto = acesso
    ? convite
      ? `Olá, ${primeiro}! Este é o seu acesso ao sistema da Apta. Abra o link para criar sua senha (vale até ${dayjs(acesso.expiraEm).format('DD/MM')}): ${linkFinal}\nSeu login é ${usuario?.email ?? ''}.`
      : `Olá, ${primeiro}! Abra o link para criar uma nova senha no sistema da Apta (vale por 2 horas): ${linkFinal}`
    : '';

  async function copiar(): Promise<void> {
    if (!acesso) return;
    try {
      await navigator.clipboard.writeText(linkFinal);
      setCopiado(true);
    } catch {
      // sem permissão de área de transferência: o campo continua selecionável
    }
  }

  return (
    <Dialog open={Boolean(acesso)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{convite ? 'Convite criado' : 'Link para nova senha'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {acesso?.emailEnviado ? (
            <Alert severity="success">
              Enviamos o link para <strong>{usuario?.email}</strong>. Se preferir, copie e mande também pelo WhatsApp.
            </Alert>
          ) : (
            <Alert severity="info">
              O envio de e-mails do sistema ainda não está ligado. Copie o link e mande para {primeiro || 'a pessoa'} (pelo
              WhatsApp, por exemplo).
            </Alert>
          )}
          <TextField
            label={convite ? 'Link do convite' : 'Link para criar nova senha'}
            value={linkFinal}
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copiado ? 'Copiado' : 'Copiar'}>
                      <IconButton onClick={() => void copiar()} edge="end">
                        {copiado ? <CheckIcon /> : <CopyIcon />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
            onFocus={(e) => e.target.select()}
          />
          <Typography variant="caption" color="text.secondary">
            Uso único. Vale até {acesso ? dayjs(acesso.expiraEm).format('DD/MM/YYYY [às] HH:mm') : ''}. Gerar um link novo
            cancela o anterior.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          startIcon={<WhatsappLogoIcon />}
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Mandar pelo WhatsApp
        </Button>
        <Button variant="contained" onClick={onClose}>
          Pronto
        </Button>
      </DialogActions>
    </Dialog>
  );
}
