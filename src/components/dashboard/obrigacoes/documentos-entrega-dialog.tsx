'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CopyIcon } from '@phosphor-icons/react/dist/ssr/Copy';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { FileArrowUpIcon } from '@phosphor-icons/react/dist/ssr/FileArrowUp';
import { FileTextIcon } from '@phosphor-icons/react/dist/ssr/FileText';
import { PaperPlaneTiltIcon } from '@phosphor-icons/react/dist/ssr/PaperPlaneTilt';
import { TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { WhatsappLogoIcon } from '@phosphor-icons/react/dist/ssr/WhatsappLogo';
import { XIcon } from '@phosphor-icons/react/dist/ssr/X';
import dayjs from 'dayjs';

import { api } from '@/lib/api';
import {
  abrirDocumento,
  anexarDocumento,
  formatarTamanho,
  linkEmail,
  linkPublico,
  linkWhatsApp,
  mensagemDeEnvio,
  recebeDoSetor,
} from '@/lib/documentos-entrega';
import type { ContatoCliente, DocumentoEntrega, Obrigacao, ProtocoloEntrega, ProtocoloResumo } from '@/types/domain';

// ---------------------------------------------------------------------------
// Seletor de destinatários: contatos da empresa, já marcados os que recebem
// documentos do departamento da obrigação (como no Acessórias).
// ---------------------------------------------------------------------------
export function useContatosDaEmpresa(clienteId: string | null, ativo: boolean): ContatoCliente[] | null {
  const [contatos, setContatos] = React.useState<ContatoCliente[] | null>(null);
  React.useEffect(() => {
    if (!ativo || !clienteId) return;
    setContatos(null);
    api<ContatoCliente[]>(`/clientes/${clienteId}/contatos`)
      .then(setContatos)
      .catch(() => setContatos([]));
  }, [clienteId, ativo]);
  return contatos;
}

// Canais que o servidor dispara sozinho (hoje só e-mail, se configurado).
export function useCanaisEnvio(ativo: boolean): { email: boolean } {
  const [canais, setCanais] = React.useState({ email: false });
  React.useEffect(() => {
    if (!ativo) return;
    api<{ email: boolean }>('/envio/canais')
      .then(setCanais)
      .catch(() => setCanais({ email: false }));
  }, [ativo]);
  return canais;
}

export function destinatariosPadrao(contatos: ContatoCliente[], setorId: string): Set<string> {
  return new Set(contatos.filter((c) => recebeDoSetor(c, setorId)).map((c) => c.id));
}

interface SeletorDestinatariosProps {
  contatos: ContatoCliente[] | null;
  setorId: string;
  selecionados: Set<string>;
  onChange: (selecionados: Set<string>) => void;
}

export function SeletorDestinatarios({ contatos, setorId, selecionados, onChange }: SeletorDestinatariosProps): React.JSX.Element {
  if (contatos === null) {
    return (
      <Typography variant="body2" color="text.secondary">
        Carregando contatos…
      </Typography>
    );
  }
  if (contatos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Esta empresa não tem contatos cadastrados. Cadastre em Clientes → editar → Contatos na empresa.
      </Typography>
    );
  }
  return (
    <Stack>
      {contatos.map((c) => {
        const recebe = recebeDoSetor(c, setorId);
        return (
          <FormControlLabel
            key={c.id}
            control={
              <Checkbox
                size="small"
                checked={selecionados.has(c.id)}
                onChange={() => {
                  const novo = new Set(selecionados);
                  if (novo.has(c.id)) novo.delete(c.id);
                  else novo.add(c.id);
                  onChange(novo);
                }}
              />
            }
            label={
              <Typography variant="body2" color={recebe ? undefined : 'text.secondary'}>
                <strong>{c.nome}</strong>
                {c.cargo ? ` · ${c.cargo}` : ''} — {[c.email, c.celular].filter(Boolean).join(' · ') || 'sem e-mail/celular'}
                {recebe ? '' : ' (não recebe este departamento)'}
              </Typography>
            }
          />
        );
      })}
    </Stack>
  );
}

export function statusProtocolo(p: Pick<ProtocoloResumo, 'status' | 'lidoEm'>): {
  label: string;
  color: 'success' | 'warning' | 'error' | 'default' | 'info';
} {
  if (p.lidoEm) return { label: `Lido ${dayjs(p.lidoEm).format('DD/MM HH:mm')}`, color: 'success' };
  if (p.status === 'FALHA') return { label: 'Falha no envio', color: 'error' };
  if (p.status === 'ENVIADO') return { label: 'Enviado · não lido', color: 'warning' };
  return { label: 'Aguardando envio', color: 'default' };
}

// Aviso depois de gerar protocolos: quantos foram por e-mail e quantos
// ficaram para envio manual.
export function resumoEnvio(criados: Pick<ProtocoloEntrega, 'status' | 'canal'>[], emailAutomatico: boolean): string {
  const gerados = `${criados.length} protocolo(s) gerado(s)`;
  if (!emailAutomatico) return `${gerados} — envie o link a cada destinatário`;
  const enviados = criados.filter((p) => p.status === 'ENVIADO' && p.canal === 'email').length;
  const falhas = criados.filter((p) => p.status === 'FALHA').length;
  const manuais = criados.length - enviados - falhas;
  return [
    gerados,
    enviados ? `${enviados} enviado(s) por e-mail` : null,
    falhas ? `${falhas} com falha no envio` : null,
    manuais ? `${manuais} sem e-mail, envie o link manualmente` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

// ---------------------------------------------------------------------------
// Dialog "Documentos e protocolo" de uma entrega.
// ---------------------------------------------------------------------------
export interface DocumentosEntregaDialogProps {
  open: boolean;
  obrigacao: Obrigacao | null;
  onClose: () => void;
  // Resumo para atualizar a linha da Lista de Entregas sem recarregar.
  onChange: (obrigacaoId: string, protocolos: ProtocoloResumo[], totalDocumentos: number) => void;
}

export function DocumentosEntregaDialog({ open, obrigacao, onClose, onChange }: DocumentosEntregaDialogProps): React.JSX.Element | null {
  const [documentos, setDocumentos] = React.useState<DocumentoEntrega[]>([]);
  const [protocolos, setProtocolos] = React.useState<ProtocoloEntrega[]>([]);
  const [carregando, setCarregando] = React.useState(false);
  const [ocupado, setOcupado] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const [gerando, setGerando] = React.useState(false);
  const [selecionados, setSelecionados] = React.useState<Set<string>>(new Set());
  const inputArquivo = React.useRef<HTMLInputElement>(null);

  const contatos = useContatosDaEmpresa(obrigacao?.clienteId ?? null, open);
  const canais = useCanaisEnvio(open);

  React.useEffect(() => {
    if (!open || !obrigacao) return;
    setErro(null);
    setAviso(null);
    setGerando(false);
    setCarregando(true);
    api<{ documentos: DocumentoEntrega[]; protocolos: ProtocoloEntrega[] }>(`/obrigacoes/${obrigacao.id}/documentos`)
      .then((d) => {
        setDocumentos(d.documentos);
        setProtocolos(d.protocolos);
      })
      .catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro ao carregar documentos'))
      .finally(() => setCarregando(false));
  }, [open, obrigacao]);

  React.useEffect(() => {
    if (contatos && obrigacao) setSelecionados(destinatariosPadrao(contatos, obrigacao.setorId));
  }, [contatos, obrigacao]);

  if (!obrigacao) return null;
  const entrega = obrigacao;

  function publicar(novosProtocolos: ProtocoloEntrega[], novosDocumentos: DocumentoEntrega[]): void {
    setProtocolos(novosProtocolos);
    setDocumentos(novosDocumentos);
    onChange(
      entrega.id,
      novosProtocolos.map(({ id, numero, destinatarioNome, status, enviadoEm, lidoEm }) => ({
        id,
        numero,
        destinatarioNome,
        status,
        enviadoEm,
        lidoEm,
      })),
      novosDocumentos.length
    );
  }

  async function executar(fn: () => Promise<void>): Promise<void> {
    setOcupado(true);
    setErro(null);
    try {
      await fn();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro na operação');
    } finally {
      setOcupado(false);
    }
  }

  function anexar(arquivos: FileList | null): void {
    if (!arquivos || arquivos.length === 0) return;
    void executar(async () => {
      const novos: DocumentoEntrega[] = [];
      for (const arquivo of arquivos) novos.push(await anexarDocumento(entrega.id, arquivo));
      publicar(protocolos, [...documentos, ...novos]);
      setAviso(`${novos.length} documento(s) anexado(s)`);
    });
  }

  function removerDocumento(doc: DocumentoEntrega): void {
    void executar(async () => {
      await api(`/documentos/${doc.id}`, { method: 'DELETE' });
      publicar(
        protocolos,
        documentos.filter((d) => d.id !== doc.id)
      );
    });
  }

  function gerarProtocolos(): void {
    void executar(async () => {
      const criados = await api<ProtocoloEntrega[]>(`/obrigacoes/${entrega.id}/protocolos`, {
        method: 'POST',
        body: JSON.stringify({ contatoIds: [...selecionados], enviarEmail: canais.email }),
      });
      publicar([...protocolos, ...criados], documentos);
      setGerando(false);
      setAviso(resumoEnvio(criados, canais.email));
    });
  }

  function enviarEmail(p: ProtocoloEntrega): void {
    void executar(async () => {
      const atualizado = await api<ProtocoloEntrega>(`/protocolos/${p.id}/enviar-email`, { method: 'POST' });
      publicar(
        protocolos.map((x) => (x.id === p.id ? atualizado : x)),
        documentos
      );
      if (atualizado.erroEnvio) setErro(`Protocolo nº ${p.numero}: ${atualizado.erroEnvio ?? 'falha no envio'}`);
      else setAviso(`Protocolo nº ${p.numero} enviado por e-mail para ${atualizado.destinatarioEmail ?? ''}`);
    });
  }

  function marcarEnviado(p: ProtocoloEntrega, canal: string): void {
    void executar(async () => {
      const atualizado = await api<ProtocoloEntrega>(`/protocolos/${p.id}/enviado`, {
        method: 'POST',
        body: JSON.stringify({ canal }),
      });
      publicar(
        protocolos.map((x) => (x.id === p.id ? atualizado : x)),
        documentos
      );
    });
  }

  function cancelar(p: ProtocoloEntrega): void {
    void executar(async () => {
      await api(`/protocolos/${p.id}`, { method: 'DELETE' });
      publicar(
        protocolos.filter((x) => x.id !== p.id),
        documentos
      );
    });
  }

  async function copiar(p: ProtocoloEntrega): Promise<void> {
    try {
      await navigator.clipboard.writeText(mensagemDeEnvio(p, entrega));
      setAviso(`Mensagem com o link do protocolo nº ${p.numero} copiada`);
      if (p.status === 'AGUARDANDO_ENVIO') marcarEnviado(p, 'link');
    } catch {
      setErro(`Não foi possível copiar. Link: ${linkPublico(p)}`);
    }
  }

  const assunto = `${entrega.nome} — ${entrega.cliente.razaoSocial}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Documentos e protocolo de entrega</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2">
            <strong>{entrega.cliente.razaoSocial}</strong> — {entrega.nome}
          </Typography>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          {aviso ? (
            <Alert severity="success" onClose={() => setAviso(null)}>
              {aviso}
            </Alert>
          ) : null}

          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Documentos ({documentos.length})</Typography>
            <Button size="small" startIcon={<FileArrowUpIcon />} disabled={ocupado} onClick={() => inputArquivo.current?.click()}>
              Anexar arquivo
            </Button>
            <input
              ref={inputArquivo}
              type="file"
              multiple
              hidden
              onChange={(event) => {
                anexar(event.target.files);
                event.target.value = '';
              }}
            />
          </Stack>
          {carregando ? (
            <Typography variant="body2" color="text.secondary">
              Carregando…
            </Typography>
          ) : documentos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhum documento anexado. Anexe a guia/declaração para poder gerar o protocolo.
            </Typography>
          ) : (
            <Stack spacing={0.5}>
              {documentos.map((d) => (
                <Stack key={d.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <FileTextIcon />
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => abrirDocumento(d.id).catch((error: unknown) => setErro(error instanceof Error ? error.message : 'Erro'))}
                  >
                    {d.nomeArquivo}
                  </Link>
                  <Typography variant="caption" color="text.secondary">
                    {formatarTamanho(d.tamanho)} · {dayjs(d.createdAt).format('DD/MM/YY HH:mm')}
                    {d.usuario ? ` · ${d.usuario.nome}` : ''}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Tooltip title="Remover documento">
                    <IconButton size="small" disabled={ocupado} onClick={() => removerDocumento(d)}>
                      <TrashIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          )}

          <Divider />

          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Protocolos ({protocolos.length})</Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<PaperPlaneTiltIcon />}
              disabled={ocupado || documentos.length === 0}
              onClick={() => setGerando((v) => !v)}
            >
              Gerar protocolo
            </Button>
          </Stack>

          {gerando ? (
            <Box sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Destinatários (marcados os que recebem <strong>{entrega.setor.nome}</strong>):
              </Typography>
              <SeletorDestinatarios contatos={contatos} setorId={entrega.setorId} selecionados={selecionados} onChange={setSelecionados} />
              <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => setGerando(false)}>
                  Cancelar
                </Button>
                <Button size="small" variant="contained" disabled={ocupado || selecionados.size === 0} onClick={gerarProtocolos}>
                  Gerar {selecionados.size} protocolo(s)
                </Button>
              </Stack>
            </Box>
          ) : null}

          {protocolos.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nº</TableCell>
                  <TableCell>Destinatário</TableCell>
                  <TableCell>Situação</TableCell>
                  <TableCell align="right">Enviar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {protocolos.map((p) => {
                  const st = statusProtocolo(p);
                  const texto = mensagemDeEnvio(p, entrega);
                  const whats = linkWhatsApp(p, texto);
                  const email = linkEmail(p, assunto, texto);
                  const emailAutomatico = canais.email && Boolean(p.destinatarioEmail);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.numero}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{p.destinatarioNome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[p.destinatarioEmail, p.destinatarioCelular].filter(Boolean).join(' · ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" variant="outlined" label={st.label} color={st.color} />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Gerado {dayjs(p.createdAt).format('DD/MM HH:mm')}
                          {p.enviadoEm ? ` · enviado ${dayjs(p.enviadoEm).format('DD/MM HH:mm')}` : ''}
                          {p.acessos ? ` · ${p.acessos} acesso(s)` : ''}
                        </Typography>
                        {p.erroEnvio ? (
                          <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                            {p.erroEnvio}
                          </Typography>
                        ) : null}
                        {p.alertasNaoLida.length > 0 ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Lembrete de guia não lida:{' '}
                            {p.alertasNaoLida
                              .map(
                                (a) =>
                                  `${a.diasAntes === 0 ? 'no vencimento' : `${a.diasAntes}d antes`} (${dayjs(a.enviadoEm).format('DD/MM')}${a.erro ? ', falhou' : ''})`
                              )
                              .join(' · ')}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Copiar mensagem com o link">
                          <IconButton size="small" onClick={() => copiar(p)}>
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={whats ? 'Abrir conversa no WhatsApp com a mensagem pronta' : 'Contato sem celular'}>
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              disabled={!whats}
                              href={whats ?? ''}
                              target="_blank"
                              onClick={() => p.status === 'AGUARDANDO_ENVIO' && marcarEnviado(p, 'whatsapp')}
                            >
                              <WhatsappLogoIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {emailAutomatico ? (
                          <Tooltip title={p.status === 'AGUARDANDO_ENVIO' ? 'Enviar por e-mail' : 'Reenviar por e-mail'}>
                            <span>
                              <IconButton size="small" color="primary" disabled={ocupado} onClick={() => enviarEmail(p)}>
                                <EnvelopeSimpleIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title={email ? 'Abrir e-mail com a mensagem pronta' : 'Contato sem e-mail'}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={!email}
                                href={email ?? ''}
                                onClick={() => p.status === 'AGUARDANDO_ENVIO' && marcarEnviado(p, 'email')}
                              >
                                <EnvelopeSimpleIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="Cancelar protocolo (o link deixa de funcionar)">
                          <IconButton size="small" color="error" disabled={ocupado} onClick={() => cancelar(p)}>
                            <XIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : null}

          <Alert severity="info" variant="outlined">
            O cliente recebe um link com os documentos. Quando ele abre um documento, o protocolo fica como <strong>lido</strong>.{' '}
            {canais.email
              ? 'O e-mail é enviado automaticamente ao gerar o protocolo. O WhatsApp ainda é manual: o botão abre a conversa com a mensagem pronta e marca o protocolo como enviado.'
              : 'O envio automático por e-mail não está configurado no servidor: use os botões acima (copiar, WhatsApp, e-mail), que abrem a mensagem pronta e marcam o protocolo como enviado.'}
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
