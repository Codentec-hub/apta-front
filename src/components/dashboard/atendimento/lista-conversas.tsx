'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { RobotIcon } from '@phosphor-icons/react/dist/ssr/Robot';
import dayjs from 'dayjs';

import type { AbaConversa, Conversa, Setor } from '@/types/domain';
import { formatarCodigo } from '@/lib/empresa';

import { ABAS, ehWhatsApp, formatarDuracao, horaCurta, iniciais, nomeCanal, tituloConversa } from './util';

// Na fila há mais que isso, o tempo de espera aparece em vermelho.
const ESPERA_ALERTA_MIN = 15;

export interface ListaConversasProps {
  aba: AbaConversa;
  onAba: (aba: AbaConversa) => void;
  contagem: Record<AbaConversa, number>;
  conversas: Conversa[];
  carregando: boolean;
  selecionadaId: string | null;
  onSelecionar: (id: string) => void;
  busca: string;
  onBusca: (busca: string) => void;
  setores: Setor[];
  setorId: string;
  onSetorId: (setorId: string) => void;
  minhas: boolean;
  onMinhas: (minhas: boolean) => void;
  agora: dayjs.Dayjs;
}

export function ListaConversas(props: ListaConversasProps): React.JSX.Element {
  const { aba, contagem, conversas, selecionadaId, agora } = props;

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, px: 1.5, pt: 1.5 }}>
        {ABAS.map((a) => (
          <Chip
            key={a.valor}
            size="small"
            clickable
            onClick={() => props.onAba(a.valor)}
            color={aba === a.valor ? 'primary' : 'default'}
            variant={aba === a.valor ? 'filled' : 'outlined'}
            label={a.valor !== 'finalizadas' && contagem[a.valor] > 0 ? `${a.titulo} · ${contagem[a.valor]}` : a.titulo}
            sx={
              a.valor === 'triagem' && contagem.triagem > 0 && aba !== 'triagem'
                ? { borderColor: 'warning.main', color: 'warning.dark' }
                : undefined
            }
          />
        ))}
      </Stack>
      <Stack spacing={1} sx={{ p: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar empresa, contato, ID ou telefone"
          value={props.busca}
          onChange={(event) => props.onBusca(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlassIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
            <Select
              value={props.setorId}
              displayEmpty
              onChange={(event) => props.onSetorId(event.target.value)}
              renderValue={(valor) =>
                valor ? (props.setores.find((s) => s.id === valor)?.nome ?? '') : 'Todos os setores'
              }
            >
              <MenuItem value="">Todos os setores</MenuItem>
              {props.setores.map((setor) => (
                <MenuItem key={setor.id} value={setor.id}>
                  {setor.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Chip
            label="Minhas"
            color={props.minhas ? 'primary' : 'default'}
            variant={props.minhas ? 'filled' : 'outlined'}
            onClick={() => props.onMinhas(!props.minhas)}
          />
        </Stack>
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {conversas.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ p: 3, textAlign: 'center' }}>
            {props.carregando ? 'Carregando…' : 'Nenhuma conversa aqui.'}
          </Typography>
        ) : (
          <List disablePadding>
            {conversas.map((conversa) => {
              const titulo = tituloConversa(conversa);
              const atual = conversa.atendimento;
              const naFila = atual && (atual.status === 'TRIAGEM' || atual.status === 'AGUARDANDO');
              const espera = naFila ? agora.diff(dayjs(atual.abertoEm), 'minute') : 0;
              return (
                <ListItemButton
                  key={conversa.id}
                  selected={conversa.id === selecionadaId}
                  onClick={() => props.onSelecionar(conversa.id)}
                  sx={{
                    alignItems: 'flex-start',
                    gap: 1.5,
                    py: 1.25,
                    borderBottom: '1px solid var(--mui-palette-divider)',
                  }}
                >
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    invisible={conversa.modo !== 'AGENTE'}
                    badgeContent={
                      <Avatar sx={{ width: 18, height: 18, bgcolor: 'secondary.main' }}>
                        <RobotIcon size={12} />
                      </Avatar>
                    }
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        fontSize: 14,
                        bgcolor: conversa.cliente ? 'primary.main' : 'grey.500',
                      }}
                    >
                      {iniciais(titulo)}
                    </Avatar>
                  </Badge>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                      <Typography
                        variant="subtitle2"
                        noWrap
                        sx={{ flex: 1, fontWeight: conversa.naoLidas > 0 ? 700 : 600 }}
                      >
                        {conversa.cliente ? `${titulo} [${formatarCodigo(conversa.cliente.codigo)}]` : titulo}
                      </Typography>
                      {conversa.ultimaMensagemEm ? (
                        <Typography variant="caption" color={conversa.naoLidas > 0 ? 'primary.main' : 'text.secondary'}>
                          {horaCurta(conversa.ultimaMensagemEm)}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">
                      {[
                        ehWhatsApp(conversa) ? null : nomeCanal(conversa.canal),
                        conversa.contato?.nome ?? (conversa.cliente ? null : 'Número não identificado'),
                        atual?.setor?.nome,
                        atual?.responsavel?.nome,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.25 }}>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
                        {conversa.ultimaMensagemTexto ?? '—'}
                      </Typography>
                      {conversa.naoLidas > 0 ? (
                        <Chip
                          label={conversa.naoLidas}
                          color="primary"
                          size="small"
                          sx={{ height: 20, minWidth: 20 }}
                        />
                      ) : null}
                    </Stack>
                    {naFila ? (
                      <Typography
                        variant="caption"
                        color={espera >= ESPERA_ALERTA_MIN ? 'error.main' : 'text.secondary'}
                        sx={{ fontWeight: espera >= ESPERA_ALERTA_MIN ? 600 : 400 }}
                      >
                        Esperando há {formatarDuracao(espera)}
                      </Typography>
                    ) : null}
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Stack>
  );
}
