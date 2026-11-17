'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ChatCircleTextIcon } from '@phosphor-icons/react/dist/ssr/ChatCircleText';
import { PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { RobotIcon } from '@phosphor-icons/react/dist/ssr/Robot';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { XIcon } from '@phosphor-icons/react/dist/ssr/X';
import dayjs from 'dayjs';
import RouterLink from 'next/link';

import { paths } from '@/paths';
import { api } from '@/lib/api';
import { STATUS_AGENDAMENTO, STATUS_LEAD, horarioLongo, relativo, rotuloCampo, type CampoPerfil, type LeadDetalhe } from '@/lib/leads';
import { formatarTelefone } from '@/components/dashboard/atendimento/util';

import { CancelarAgendamentoDialog, ConfirmarAgendamentoDialog } from '../agenda/dialogs-agendamento';

interface Props {
  leadId: string | null;
  campos: CampoPerfil[];
  versao: number;
  podeExcluir: boolean;
  enviarConfirmacao: boolean;
  onClose: () => void;
  onEditar: (lead: LeadDetalhe) => void;
  onAviso: (texto: string, erro?: boolean) => void;
}

const ENCERRADOS = new Set(['FORA_DO_PERFIL', 'DESCARTADO', 'SEM_RESPOSTA']);

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }): React.JSX.Element {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 170, flexShrink: 0 }}>
        {rotulo}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {valor}
      </Typography>
    </Stack>
  );
}

export function LeadDetalheDrawer({ leadId, campos, versao, podeExcluir, enviarConfirmacao, onClose, onEditar, onAviso }: Props): React.JSX.Element {
  const [lead, setLead] = React.useState<LeadDetalhe | null>(null);
  const [erro, setErro] = React.useState<string | null>(null);
  const [ocupado, setOcupado] = React.useState(false);
  const [confirmando, setConfirmando] = React.useState(false);
  const [cancelando, setCancelando] = React.useState(false);

  const carregar = React.useCallback(() => {
    if (!leadId) return;
    api<LeadDetalhe>(`/leads/${leadId}`)
      .then((l) => {
        setLead(l);
        setErro(null);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar'));
  }, [leadId]);

  React.useEffect(() => {
    if (leadId) carregar();
    else setLead(null);
  }, [leadId, versao, carregar]);

  async function acao(caminho: string, aviso: string, corpo?: unknown): Promise<void> {
    if (!lead) return;
    setOcupado(true);
    try {
      await api(`/leads/${lead.id}/${caminho}`, { method: 'POST', body: corpo ? JSON.stringify(corpo) : undefined });
      onAviso(aviso);
      carregar();
    } catch (error) {
      onAviso(error instanceof Error ? error.message : 'Erro', true);
    } finally {
      setOcupado(false);
    }
  }

  async function descartar(): Promise<void> {
    const motivo = globalThis.prompt('Motivo do descarte (opcional):', '');
    if (motivo === null) return;
    await acao('descartar', 'Lead descartado.', { motivo: motivo || undefined });
  }

  async function excluir(): Promise<void> {
    if (!lead || !globalThis.confirm(`Excluir o lead "${lead.nome}"? O histórico de agendamentos dele também some.`)) return;
    try {
      await api(`/leads/${lead.id}`, { method: 'DELETE' });
      onAviso('Lead excluído.');
      onClose();
    } catch (error) {
      onAviso(error instanceof Error ? error.message : 'Erro', true);
    }
  }

  const ativo = lead?.agendamentos.find((a) => a.status === 'PRE_RESERVADO' || a.status === 'CONFIRMADO') ?? null;
  const perfil = lead?.perfil ?? {};
  const chavesPerfil = [...campos.map((c) => c.chave), ...Object.keys(perfil).filter((k) => !campos.some((c) => c.chave === k))];
  const comAssistente = lead?.conversa?.modo === 'AGENTE';

  return (
    <Drawer anchor="right" open={Boolean(leadId)} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520 } } } }}>
      <Stack sx={{ p: 3 }} spacing={2.5}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5">{lead?.nome ?? '…'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {lead ? [formatarTelefone(lead.telefone), lead.email, lead.origem].filter(Boolean).join(' · ') : ''}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Fechar">
            <XIcon />
          </IconButton>
        </Stack>
        {erro ? <Alert severity="error">{erro}</Alert> : null}
        {lead ? (
          <>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center', rowGap: 1 }}>
              <Chip label={STATUS_LEAD[lead.status].rotulo} color={STATUS_LEAD[lead.status].cor} size="small" />
              {lead.conversa ? (
                <Chip
                  icon={comAssistente ? <RobotIcon /> : undefined}
                  label={comAssistente ? 'Com o assistente' : 'Com a equipe'}
                  size="small"
                  variant="outlined"
                />
              ) : null}
              {lead.qualificacao ? <Chip label={lead.qualificacao.split('—')[0]?.trim()} size="small" variant="outlined" color="secondary" /> : null}
            </Stack>
            {lead.motivoEncerramento && ENCERRADOS.has(lead.status) ? (
              <Alert severity="info">Motivo: {lead.motivoEncerramento}</Alert>
            ) : null}

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {lead.status === 'NOVO' ? (
                <Button variant="contained" startIcon={<PaperPlaneTiltIcon />} disabled={ocupado} onClick={() => void acao('enviar', 'Lead na fila do assistente.')}>
                  Enviar ao assistente
                </Button>
              ) : null}
              {lead.status === 'NA_FILA' ? (
                <Button variant="outlined" disabled={ocupado} onClick={() => void acao('tirar-da-fila', 'Lead fora da fila.')}>
                  Tirar da fila
                </Button>
              ) : null}
              {lead.conversaId ? (
                <Button
                  variant={lead.status === 'NOVO' ? 'outlined' : 'contained'}
                  startIcon={<ChatCircleTextIcon />}
                  component={RouterLink}
                  href={`${paths.dashboard.atendimento}?conversa=${lead.conversaId}`}
                >
                  Abrir conversa
                </Button>
              ) : null}
              {lead.conversaId && (!comAssistente || ENCERRADOS.has(lead.status)) ? (
                <Button variant="outlined" startIcon={<RobotIcon />} disabled={ocupado} onClick={() => void acao('reabrir', 'Conversa devolvida ao assistente.')}>
                  Devolver ao assistente
                </Button>
              ) : null}
              {!lead.conversaId && ENCERRADOS.has(lead.status) ? (
                <Button variant="outlined" disabled={ocupado} onClick={() => void acao('reabrir', 'Lead reaberto.')}>
                  Reabrir
                </Button>
              ) : null}
              <Button variant="text" startIcon={<PencilSimpleIcon />} onClick={() => onEditar(lead)}>
                Editar
              </Button>
              {ENCERRADOS.has(lead.status) ? null : (
                <Button variant="text" color="inherit" disabled={ocupado} onClick={() => void descartar()}>
                  Descartar
                </Button>
              )}
              {podeExcluir ? (
                <IconButton color="error" onClick={() => void excluir()} aria-label="Excluir lead">
                  <TrashIcon />
                </IconButton>
              ) : null}
            </Stack>

            {ativo ? (
              <Alert
                severity={ativo.status === 'CONFIRMADO' ? 'success' : 'warning'}
                action={
                  <Stack direction="row" spacing={1}>
                    {ativo.status === 'PRE_RESERVADO' ? (
                      <Button color="inherit" size="small" onClick={() => setConfirmando(true)}>
                        Confirmar
                      </Button>
                    ) : null}
                    <Button color="inherit" size="small" onClick={() => setCancelando(true)}>
                      Cancelar
                    </Button>
                  </Stack>
                }
              >
                <strong>{STATUS_AGENDAMENTO[ativo.status].rotulo}:</strong> {horarioLongo(ativo.inicio)}
                {ativo.status === 'PRE_RESERVADO' && ativo.expiraEm ? (
                  <>
                    <br />
                    Expira {relativo(ativo.expiraEm)}
                  </>
                ) : null}
              </Alert>
            ) : null}

            <Divider />
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Perfil {lead.perfilCompleto ? '(completo)' : '(incompleto)'}</Typography>
              {chavesPerfil.map((k) => (
                <Linha key={k} rotulo={rotuloCampo(campos, k)} valor={perfil[k] ?? <Typography component="span" variant="body2" color="text.disabled">—</Typography>} />
              ))}
            </Stack>
            {lead.qualificacao ? (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">Qualificação</Typography>
                <Typography variant="body2">{lead.qualificacao}</Typography>
              </Stack>
            ) : null}
            {lead.observacoes ? (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">Observações</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {lead.observacoes}
                </Typography>
              </Stack>
            ) : null}

            <Divider />
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">Linha do tempo</Typography>
              <Linha rotulo="Cadastrado" valor={`${dayjs(lead.createdAt).format('DD/MM/YYYY HH:mm')}${lead.cadastradoPor ? ` por ${lead.cadastradoPor.nome}` : ''}`} />
              {lead.naFilaEm ? <Linha rotulo="Entrou na fila" valor={dayjs(lead.naFilaEm).format('DD/MM/YYYY HH:mm')} /> : null}
              {lead.primeiraMensagemEm ? <Linha rotulo="1ª mensagem" valor={dayjs(lead.primeiraMensagemEm).format('DD/MM/YYYY HH:mm')} /> : null}
              {lead.lembreteEnviadoEm ? <Linha rotulo="Lembrete" valor={dayjs(lead.lembreteEnviadoEm).format('DD/MM/YYYY HH:mm')} /> : null}
              {lead.ultimaRespostaEm ? <Linha rotulo="Última resposta" valor={dayjs(lead.ultimaRespostaEm).format('DD/MM/YYYY HH:mm')} /> : null}
            </Stack>

            {lead.agendamentos.length > 0 ? (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">Agendamentos</Typography>
                {lead.agendamentos.map((a) => (
                  <Stack key={a.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip label={STATUS_AGENDAMENTO[a.status].rotulo} color={STATUS_AGENDAMENTO[a.status].cor} size="small" variant="outlined" />
                    <Typography variant="body2">{horarioLongo(a.inicio)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.confirmadoPor ? `por ${a.confirmadoPor.nome}` : (a.motivoCancelamento ?? '')}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : null}
          </>
        ) : null}
      </Stack>

      <ConfirmarAgendamentoDialog
        alvo={confirmando && ativo && lead ? { id: ativo.id, inicio: ativo.inicio, lead } : null}
        enviarPadrao={enviarConfirmacao}
        onClose={() => setConfirmando(false)}
        onFeito={(t) => {
          setConfirmando(false);
          onAviso(t);
          carregar();
        }}
      />
      <CancelarAgendamentoDialog
        alvo={cancelando && ativo && lead ? { id: ativo.id, inicio: ativo.inicio, lead } : null}
        onClose={() => setCancelando(false)}
        onFeito={(t) => {
          setCancelando(false);
          onAviso(t);
          carregar();
        }}
      />
    </Drawer>
  );
}
