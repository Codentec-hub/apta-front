'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ListIcon } from '@phosphor-icons/react/dist/ssr/List';

import { usePopover } from '@/hooks/use-popover';
import { useUser } from '@/hooks/use-user';

import { MobileNav } from './mobile-nav';
import { UserPopover } from './user-popover';

function iniciais(nome?: string): string {
  if (!nome) {
    return '?';
  }
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes.at(-1)?.[0] ?? '' : '';
  return `${primeira}${ultima}`.toUpperCase();
}

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);

  const { user } = useUser();
  const userPopover = usePopover<HTMLDivElement>();

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--mui-zIndex-appBar)',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', px: 2 }}
        >
          <IconButton
            onClick={(): void => {
              setOpenNav(true);
            }}
            sx={{ display: { lg: 'none' } }}
          >
            <ListIcon />
          </IconButton>
          <Stack
            sx={{ alignItems: 'center', cursor: 'pointer', ml: 'auto' }}
            direction="row"
            spacing={1.5}
            onClick={userPopover.handleOpen}
            ref={userPopover.anchorRef}
          >
            <Typography sx={{ display: { xs: 'none', sm: 'block' } }} variant="body2">
              {user?.nome}
            </Typography>
            <Avatar sx={{ bgcolor: 'var(--mui-palette-primary-main)' }}>{iniciais(user?.nome)}</Avatar>
          </Stack>
        </Stack>
      </Box>
      <UserPopover anchorEl={userPopover.anchorRef.current} onClose={userPopover.handleClose} open={userPopover.open} />
      <MobileNav
        onClose={() => {
          setOpenNav(false);
        }}
        open={openNav}
      />
    </React.Fragment>
  );
}
