'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { ArrowsLeftRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowsLeftRight';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { ChecksIcon } from '@phosphor-icons/react/dist/ssr/Checks';
import { ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HeadsetIcon } from '@phosphor-icons/react/dist/ssr/Headset';
import { LinkIcon } from '@phosphor-icons/react/dist/ssr/Link';
import { LockIcon } from '@phosphor-icons/react/dist/ssr/Lock';
import { PaperPlaneRightIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneRight';
import { RobotIcon } from '@phosphor-icons/react/dist/ssr/Robot';
import { SidebarSimpleIcon } from '@phosphor-icons/react/dist/ssr/SidebarSimple';
import { UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import dayjs from 'dayjs';

import type { AgenteIA, ConversaDetalhe, Mensagem, StatusWhatsApp } from '@/types/domain';
import { api } from '@/lib/api';
import { formatarCodigo } from '@/lib/empresa';

import { estiloFundoChat } from './fundo-chat';
import { ehWhatsApp, formatarTelefone, nomeCanal, tituloConversa } from './util';

const STATUS_LABEL = {
  TRIAGEM: 'Triagem',
  AGUARDANDO: 'Aguardando',
  EM_ATENDIMENTO: 'Em atendimento',
  FINALIZADO: 'Finalizado',
} as const;

export interface ChatConversaProps {
  conversa: ConversaDetalhe;
  usuarioId: string | null;
  agentes: AgenteIA[];
  whatsapp: StatusWhatsApp | null;
  onVoltar: () => void;
  onVincular: () => void;
  onEncaminhar: () => void;
  onFinalizar: () => void;
  onErro: (mensagem: string) => void;
  painelVisivel: boolean;
  onAlternarPainel: () => void;
}

function IconeStatus({ mensagem }: { mensagem: Mensagem }): React.JSX.Element | null {
  const tamanho = 14;
  switch (mensagem.status) {
    case 'PENDENTE': {
      return <ClockIcon size={tamanho} />;
    }
    case 'ENVIADA': {
      return <CheckIcon size={tamanho} />;
    }
    case 'ENTREGUE': {
      return <ChecksIcon size={tamanho} />;
    }
    case 'LIDA': {
      return <ChecksIcon size={tamanho} color="var(--mui-palette-info-main)" weight="bold" />;
    }
    case 'FALHA': {
      return (
        <Tooltip title={mensagem.erro ?? 'Falha no envio'}>
          <WarningCircleIcon size={tamanho} color="var(--mui-palette-error-main)" />
        </Tooltip>
      );
    }
    default: {
      return null;
    }
  }
}

// Faixa centralizada (data e registros do sistema), como os avisos do WhatsApp.
function Aviso({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Box sx={{ textAlign: 'center', my: 0.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'inline-block',
          px: 1.5,
          py: 0.5,
          borderRadius: 1.5,
          bgcolor: 'var(--chat-aviso)',
          boxShadow: 'var(--chat-sombra)',
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

// `registro`: atendimento registrado à mão — as anotações da equipe são o
// histórico do atendimento, não "notas internas" escondidas do cliente.
function Bolha({ mensagem, registro }: { mensagem: Mensagem; registro: boolean }): React.JSX.Element {
  if (mensagem.autor === 'SISTEMA') {
    return (
      <Aviso>
        {mensagem.texto} · {dayjs(mensagem.createdAt).format('HH:mm')}
      </Aviso>
    );
  }

  const doCliente = mensagem.autor === 'CLIENTE';
  const autor =
    mensagem.autor === 'AGENTE'
      ? `🤖 ${mensagem.agente?.nome ?? 'Agente Apta'}`
      : mensagem.autor === 'AUTOMACAO'
        ? '⚡ Automação'
        : mensagem.autor === 'ATENDENTE'
          ? (mensagem.usuario?.nome ?? 'Atendente')
          : null;

  const nota = mensagem.interna && !registro;
  const fundo = nota
    ? 'var(--chat-nota)'
    : registro
      ? 'var(--chat-entrada)'
      : doCliente
        ? 'var(--chat-entrada)'
        : mensagem.autor === 'AGENTE'
          ? 'var(--chat-agente)'
          : mensagem.autor === 'AUTOMACAO'
            ? 'var(--chat-automacao)'
            : 'var(--chat-saida)';

  return (
    <Stack sx={{ alignItems: doCliente ? 'flex-start' : 'flex-end' }}>
      <Box
        sx={{
          maxWidth: { xs: '88%', md: '70%' },
          px: 1.25,
          py: 0.75,
          borderRadius: 2,
          bgcolor: fundo,
          boxShadow: 'var(--chat-sombra)',
          ...(nota ? { border: '1px dashed', borderColor: 'warning.main' } : {}),
          ...(doCliente ? { borderTopLeftRadius: 2 } : { borderTopRightRadius: 2 }),
        }}
      >
        {autor || nota ? (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 0.25 }}>
            {nota ? <LockIcon size={12} /> : null}
            <Typography variant="caption" sx={{ fontWeight: 600 }} color="text.secondary">
              {nota ? `Nota interna · ${autor ?? ''}` : autor}
            </Typography>
          </Stack>
        ) : null}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {mensagem.texto}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end', alignItems: 'center', mt: 0.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
            {dayjs(mensagem.createdAt).format('HH:mm')}
          </Typography>
          {!doCliente && !mensagem.interna ? <IconeStatus mensagem={mensagem} /> : null}
        </Stack>
      </Box>
    </Stack>
  );
}

function rotuloDia(data: dayjs.Dayjs): string {
  if (data.isSame(dayjs(), 'day')) return 'Hoje';
  if (data.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Ontem';
  return data.format('DD/MM/YYYY');
}

export function ChatConversa(props: ChatConversaProps): React.JSX.Element {
  const { conversa, agentes, whatsapp, usuarioId } = props;
  const atual = conversa.atendimento;
  const aberto = Boolean(atual && atual.status !== 'FINALIZADO');
  // Atendimento registrado à mão (telefone, balcão...): não há para onde
  // mandar mensagem; o campo de baixo registra o andamento.
  const whatsappDoSistema = ehWhatsApp(conversa);

  const [texto, setTexto] = React.useState('');
  const [interna, setInterna] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [menuAgente, setMenuAgente] = React.useState<HTMLElement | null>(null);
  const fimRef = React.useRef<HTMLDivElement>(null);

  // Rascunho é por conversa.
  React.useEffect(() => {
    setTexto('');
    setInterna(false);
  }, [conversa.id]);

  const totalMensagens = conversa.mensagens.length;
  React.useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' });
  }, [conversa.id, totalMensagens]);

  async function acao(caminho: string, init: RequestInit): Promise<void> {
    try {
      await api(caminho, init);
    } catch (error) {
      props.onErro(error instanceof Error ? error.message : 'Erro na ação');
    }
  }

  async function enviar(): Promise<void> {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    try {
      await api(`/conversas/${conversa.id}/mensagens`, {
        method: 'POST',
        body: JSON.stringify({ texto: conteudo, interna }),
      });
      setTexto('');
    } catch (error) {
      props.onErro(error instanceof Error ? error.message : 'Erro ao enviar');
    } finally {
      setEnviando(false);
    }
  }

  function trocarModo(modo: 'HUMANO' | 'AGENTE', anchor?: HTMLElement): void {
    if (modo === conversa.modo) return;
    if (modo === 'HUMANO') {
      void acao(`/conversas/${conversa.id}/modo`, { method: 'PUT', body: JSON.stringify({ modo: 'HUMANO' }) });
      return;
    }
    setMenuAgente(anchor ?? null);
  }

  function escolherAgente(agente: AgenteIA): void {
    setMenuAgente(null);
    void acao(`/conversas/${conversa.id}/modo`, {
      method: 'PUT',
      body: JSON.stringify({ modo: 'AGENTE', agenteId: agente.id }),
    });
  }

  const agentesAtivos = agentes.filter((a) => a.ativo);
  const ehMeu = atual?.responsavelId === usuarioId;

  let diaAnterior = '';

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      {/* Cabeçalho */}
      <Stack spacing={1} sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton size="small" onClick={props.onVoltar} sx={{ display: { md: 'none' } }}>
            <ArrowLeftIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
              {tituloConversa(conversa)}
              {conversa.cliente ? ` [${formatarCodigo(conversa.cliente.codigo)}]` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {[
                whatsappDoSistema ? null : nomeCanal(conversa.canal),
                conversa.contato?.nome ?? conversa.nomeExibicao,
                formatarTelefone(conversa.telefone),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
          {whatsappDoSistema ? (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={conversa.modo}
              onChange={(event, valor: 'HUMANO' | 'AGENTE' | null) => {
                if (valor) trocarModo(valor, event.currentTarget as HTMLElement);
              }}
            >
              <ToggleButton value="HUMANO" sx={{ gap: 0.5, px: 1.25 }}>
                <UserIcon /> Humano
              </ToggleButton>
              <ToggleButton value="AGENTE" sx={{ gap: 0.5, px: 1.25 }}>
                <RobotIcon /> {conversa.modo === 'AGENTE' && conversa.agente ? conversa.agente.nome : 'Agente Apta'}
              </ToggleButton>
            </ToggleButtonGroup>
          ) : null}
          <Tooltip title={props.painelVisivel ? 'Ocultar dados do cliente' : 'Mostrar dados do cliente'}>
            <IconButton
              size="small"
              color={props.painelVisivel ? 'primary' : 'default'}
              onClick={props.onAlternarPainel}
              aria-pressed={props.painelVisivel}
            >
              <SidebarSimpleIcon style={{ transform: 'scaleX(-1)' }} />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={menuAgente} open={Boolean(menuAgente)} onClose={() => setMenuAgente(null)}>
            {agentesAtivos.length === 0 ? (
              <MenuItem disabled>Nenhum agente cadastrado (Configurações → Agentes de IA)</MenuItem>
            ) : (
              agentesAtivos.map((agente) => (
                <MenuItem key={agente.id} onClick={() => escolherAgente(agente)}>
                  <ListItemText primary={agente.nome} secondary={agente.descricao ?? agente.setor?.nome} />
                </MenuItem>
              ))
            )}
          </Menu>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          {atual ? (
            <Chip
              size="small"
              label={STATUS_LABEL[atual.status]}
              color={atual.status === 'TRIAGEM' ? 'warning' : atual.status === 'FINALIZADO' ? 'default' : 'primary'}
              variant={atual.status === 'EM_ATENDIMENTO' ? 'filled' : 'outlined'}
            />
          ) : null}
          {aberto ? (
            <Typography variant="caption" color="text.secondary">
              {atual?.setor?.nome ?? 'Sem setor'} · {atual?.responsavel?.nome ?? 'sem responsável'}
            </Typography>
          ) : null}
          <Box sx={{ flex: 1 }} />
          {conversa.cliente ? null : (
            <Button size="small" startIcon={<LinkIcon />} onClick={props.onVincular}>
              Vincular cliente
            </Button>
          )}
          {aberto && (!ehMeu || atual?.status !== 'EM_ATENDIMENTO' || conversa.modo === 'AGENTE') ? (
            <Button
              size="small"
              startIcon={<HeadsetIcon />}
              onClick={() => void acao(`/conversas/${conversa.id}/assumir`, { method: 'POST' })}
            >
              Assumir
            </Button>
          ) : null}
          {aberto ? (
            <Button size="small" startIcon={<ArrowsLeftRightIcon />} onClick={props.onEncaminhar}>
              {atual?.status === 'TRIAGEM' ? 'Encaminhar' : 'Transferir'}
            </Button>
          ) : null}
          {aberto ? (
            <Button size="small" variant="contained" color="success" onClick={props.onFinalizar}>
              Finalizar
            </Button>
          ) : null}
        </Stack>
      </Stack>
      <Divider />

      {/* Mensagens */}
      <Box
        sx={(theme) => ({
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          px: { xs: 1.5, md: 4 },
          py: 1.5,
          ...estiloFundoChat(theme),
        })}
      >
        <Stack spacing={1}>
          {conversa.mensagens.map((mensagem) => {
            const dia = rotuloDia(dayjs(mensagem.createdAt));
            const separador = dia === diaAnterior ? null : dia;
            diaAnterior = dia;
            return (
              <React.Fragment key={mensagem.id}>
                {separador ? <Aviso>{separador}</Aviso> : null}
                <Bolha mensagem={mensagem} registro={!whatsappDoSistema} />
              </React.Fragment>
            );
          })}
          <div ref={fimRef} />
        </Stack>
      </Box>
      <Divider />

      {/* Avisos + campo de envio */}
      {conversa.modo === 'AGENTE' ? (
        <Alert
          severity={whatsapp?.agenteConfigurado ? 'info' : 'warning'}
          icon={<RobotIcon />}
          sx={{ borderRadius: 0 }}
        >
          {whatsapp?.agenteConfigurado
            ? `O agente ${conversa.agente?.nome ?? ''} está respondendo. Se você enviar uma mensagem, assume a conversa.`
            : `Conversa com o agente ${conversa.agente?.nome ?? ''}, mas o Agente Apta ainda não está ligado: ninguém está respondendo este cliente.`}
        </Alert>
      ) : null}
      {aberto ? null : (
        <Alert severity="info" sx={{ borderRadius: 0 }}>
          {whatsappDoSistema
            ? 'Atendimento finalizado. Uma nova mensagem (sua ou do cliente) abre um novo atendimento.'
            : 'Atendimento finalizado. Novos contatos deste cliente são registrados como um novo atendimento.'}
        </Alert>
      )}
      <Stack
        spacing={1}
        sx={{
          p: 1.5,
          ...(interna && whatsappDoSistema ? { bgcolor: 'rgba(var(--mui-palette-warning-mainChannel) / 0.1)' } : {}),
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={6}
            size="small"
            placeholder={
              whatsappDoSistema
                ? interna
                  ? 'Nota interna (o cliente não vê)…'
                  : 'Mensagem para o cliente… (Enter envia, Shift+Enter quebra linha)'
                : 'Registrar andamento (ex.: retornei a ligação, enviei por e-mail)…'
            }
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void enviar();
              }
            }}
          />
          <IconButton color="primary" disabled={!texto.trim() || enviando} onClick={() => void enviar()}>
            <PaperPlaneRightIcon />
          </IconButton>
        </Stack>
        {whatsappDoSistema ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              size="small"
              icon={<LockIcon />}
              label="Nota interna"
              color={interna ? 'warning' : 'default'}
              variant={interna ? 'filled' : 'outlined'}
              onClick={() => setInterna((v) => !v)}
            />
            {whatsapp?.simulador ? (
              <Typography variant="caption" color="text.secondary">
                WhatsApp em modo simulador: nada é enviado de verdade.
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  );
}
