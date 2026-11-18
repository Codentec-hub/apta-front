import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { UserCircleIcon } from '@phosphor-icons/react/dist/ssr/UserCircle';

import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

import { AvatarUsuario } from './avatar-usuario';
import { MinhaContaDialog } from './minha-conta-dialog';

const NOME_PERFIL: Record<string, string> = { ADMIN: 'Administrador', GESTOR: 'Gestor', OPERACIONAL: 'Operacional' };

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { user, checkSession } = useUser();

  const router = useRouter();
  const [minhaConta, setMinhaConta] = React.useState(false);

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        logger.error('Erro ao sair', error);
        return;
      }

      await checkSession?.();

      router.refresh();
    } catch (error) {
      logger.error('Erro ao sair', error);
    }
  }, [checkSession, router]);

  return (
    <>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        onClose={onClose}
        open={open}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { width: '240px' } } }}
      >
        <Box sx={{ p: '16px 20px ', display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <AvatarUsuario usuario={user} tamanho={44} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {user?.nome}
            </Typography>
            <Typography color="text.secondary" variant="body2" noWrap>
              {user?.email}
            </Typography>
            {user?.setor ? (
              <Typography color="text.secondary" variant="caption">
                {user.setor.nome} · {NOME_PERFIL[user.perfil] ?? user.perfil}
              </Typography>
            ) : null}
          </Box>
        </Box>
        <Divider />
        <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
          <MenuItem
            onClick={() => {
              setMinhaConta(true);
              onClose();
            }}
          >
            <ListItemIcon>
              <UserCircleIcon fontSize="var(--icon-fontSize-md)" />
            </ListItemIcon>
            Minha conta
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <SignOutIcon fontSize="var(--icon-fontSize-md)" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </MenuList>
      </Popover>
      <MinhaContaDialog open={minhaConta} onClose={() => setMinhaConta(false)} />
    </>
  );
}
