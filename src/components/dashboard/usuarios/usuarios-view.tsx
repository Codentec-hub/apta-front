'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';

import { api } from '@/lib/api';
import type { Perfil, Setor, Usuario } from '@/types/domain';

import { UsuarioFormDialog } from './usuario-form-dialog';

const PERFIL_LABEL: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  OPERACIONAL: 'Operacional',
};

const PERFIL_COLOR: Record<Perfil, 'error' | 'warning' | 'default'> = {
  ADMIN: 'error',
  GESTOR: 'warning',
  OPERACIONAL: 'default',
};

export function UsuariosView(): React.JSX.Element {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [setores, setSetores] = React.useState<Setor[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = React.useState<Usuario | null>(null);

  const carregar = React.useCallback(() => {
    setCarregando(true);
    Promise.all([api<Usuario[]>('/usuarios'), api<Setor[]>('/setores')])
      .then(([usuariosData, setoresData]) => {
        setUsuarios(usuariosData);
        setSetores(setoresData);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar usuários'))
      .finally(() => setCarregando(false));
  }, []);

  React.useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNovo(): void {
    setUsuarioEmEdicao(null);
    setDialogAberto(true);
  }

  function abrirEdicao(usuario: Usuario): void {
    setUsuarioEmEdicao(usuario);
    setDialogAberto(true);
  }

  function aoSalvar(usuario: Usuario): void {
    setUsuarios((atual) => {
      const existe = atual.some((u) => u.id === usuario.id);
      const proximo = existe ? atual.map((u) => (u.id === usuario.id ? usuario : u)) : [...atual, usuario];
      return proximo.sort((a, b) => a.nome.localeCompare(b.nome));
    });
  }

  async function alternarAtivo(usuario: Usuario): Promise<void> {
    try {
      if (usuario.ativo) {
        await api(`/usuarios/${usuario.id}`, { method: 'DELETE' });
        setUsuarios((atual) => atual.map((u) => (u.id === usuario.id ? { ...u, ativo: false } : u)));
      } else {
        const atualizado = await api<Usuario>(`/usuarios/${usuario.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ativo: true }),
        });
        setUsuarios((atual) => atual.map((u) => (u.id === usuario.id ? atualizado : u)));
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h4">Usuários</Typography>
          <Typography color="text.secondary" variant="body2">
            Funcionários do escritório: setor, perfil de acesso e status.
          </Typography>
        </Stack>
        <Button variant="contained" startIcon={<PlusIcon />} onClick={abrirNovo}>
          Novo usuário
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Setor</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell align="center">Ativo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregando && usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography color="text.secondary" variant="body2" sx={{ fontStyle: 'italic' }}>
                    Nenhum usuário cadastrado ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id} hover>
                  <TableCell>{usuario.nome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.setor?.nome ?? '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={PERFIL_LABEL[usuario.perfil]}
                      color={PERFIL_COLOR[usuario.perfil]}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Switch checked={usuario.ativo} onChange={() => alternarAtivo(usuario)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => abrirEdicao(usuario)} size="small">
                      <PencilSimpleIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <UsuarioFormDialog
        open={dialogAberto}
        usuario={usuarioEmEdicao}
        setores={setores}
        onClose={() => setDialogAberto(false)}
        onSaved={aoSalvar}
      />

      <Snackbar open={Boolean(erro)} autoHideDuration={5000} onClose={() => setErro(null)}>
        <Alert onClose={() => setErro(null)} severity="error" sx={{ width: '100%' }}>
          {erro}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
