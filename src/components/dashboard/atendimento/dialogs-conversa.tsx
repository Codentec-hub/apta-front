'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type {
  CanalManual,
  Cliente,
  ContatoCliente,
  ConversaDetalhe,
  MotivoAtendimento,
  Setor,
  UsuarioResumo,
} from '@/types/domain';
import { api } from '@/lib/api';
import { formatarCodigo } from '@/lib/empresa';

import { CANAIS_MANUAIS, formatarTelefone } from './util';

function mensagemDeErro(error: unknown, padrao: string): string {
  return error instanceof Error ? error.message : padrao;
}

function rotuloCliente(cliente: Cliente): string {
  return `[${formatarCodigo(cliente.codigo)}] ${cliente.apelido || cliente.nomeFantasia || cliente.razaoSocial}`;
}

function useEnvio(onClose: () => void) {
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const executar = async (acao: () => Promise<unknown>, padrao: string): Promise<void> => {
    setSalvando(true);
    setErro(null);
    try {
      await acao();
      onClose();
    } catch (error) {
      setErro(mensagemDeErro(error, padrao));
    } finally {
      setSalvando(false);
    }
  };
  return { salvando, erro, setErro, executar };
}

// ---------- Encaminhar / transferir ----------

export interface EncaminharDialogProps {
  open: boolean;
  conversa: ConversaDetalhe | null;
  setores: Setor[];
  usuarios: UsuarioResumo[];
  clientes: Cliente[];
  onClose: () => void;
}

export function EncaminharDialog({
  open,
  conversa,
  setores,
  usuarios,
  clientes,
  onClose,
}: EncaminharDialogProps): React.JSX.Element {
  const [setorId, setSetorId] = React.useState('');
  const [responsavelId, setResponsavelId] = React.useState('');
  const { salvando, erro, setErro, executar } = useEnvio(onClose);

  React.useEffect(() => {
    if (open && conversa) {
      setSetorId(conversa.atendimento?.setorId ?? '');
      setResponsavelId('');
      setErro(null);
    }
  }, [open, conversa, setErro]);

  // Quem o sistema vai escolher se o campo ficar em "automático".
  const sugerido = React.useMemo(() => {
    if (!setorId) return null;
    const cliente = clientes.find((c) => c.id === conversa?.clienteId);
    const vinculo = cliente?.responsaveis.find((r) => r.setorId === setorId);
    if (vinculo) return vinculo.usuario.nome;
    return setores.find((s) => s.id === setorId)?.responsavel?.nome ?? null;
  }, [setorId, clientes, conversa, setores]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {conversa?.atendimento?.status === 'TRIAGEM' ? 'Encaminhar atendimento' : 'Transferir atendimento'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel id="encaminhar-setor">Setor</InputLabel>
            <Select
              labelId="encaminhar-setor"
              label="Setor"
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
            >
              {setores.map((setor) => (
                <MenuItem key={setor.id} value={setor.id}>
                  {setor.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="encaminhar-responsavel" shrink>
              Responsável
            </InputLabel>
            <Select
              labelId="encaminhar-responsavel"
              label="Responsável"
              notched
              displayEmpty
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
            >
              <MenuItem value="">
                <em>Automático{sugerido ? ` (${sugerido})` : ''}</em>
              </MenuItem>
              {usuarios.map((usuario) => (
                <MenuItem key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            No automático vai para o responsável do cliente nesse setor (ou o responsável padrão do setor).
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!setorId || salvando}
          onClick={() =>
            void executar(
              () =>
                api(`/conversas/${conversa!.id}/encaminhar`, {
                  method: 'POST',
                  body: JSON.stringify({ setorId, responsavelId: responsavelId || null }),
                }),
              'Erro ao encaminhar'
            )
          }
        >
          Encaminhar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- Vincular número a cliente/contato ----------

export interface VincularDialogProps {
  open: boolean;
  conversa: ConversaDetalhe | null;
  clientes: Cliente[];
  onClose: () => void;
}

export function VincularDialog({ open, conversa, clientes, onClose }: VincularDialogProps): React.JSX.Element {
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [contatoId, setContatoId] = React.useState('');
  const [modo, setModo] = React.useState<'existente' | 'novo' | 'nenhum'>('novo');
  const [novoNome, setNovoNome] = React.useState('');
  const { salvando, erro, setErro, executar } = useEnvio(onClose);

  React.useEffect(() => {
    if (open && conversa) {
      setCliente(clientes.find((c) => c.id === conversa.clienteId) ?? null);
      setContatoId('');
      setModo('novo');
      setNovoNome(conversa.nomeExibicao ?? '');
      setErro(null);
    }
  }, [open, conversa, clientes, setErro]);

  const contatos: ContatoCliente[] = cliente?.contatos ?? [];
  const valido = cliente && (modo !== 'existente' || contatoId) && (modo !== 'novo' || novoNome.trim());

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Vincular {conversa ? formatarTelefone(conversa.telefone) || 'conversa' : ''} a um cliente
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Autocomplete
            options={clientes}
            value={cliente}
            onChange={(_e, valor) => {
              setCliente(valor);
              setContatoId('');
            }}
            getOptionLabel={rotuloCliente}
            renderInput={(params) => <TextField {...params} label="Empresa" required />}
          />
          {cliente ? (
            <RadioGroup value={modo} onChange={(e) => setModo(e.target.value as typeof modo)}>
              <FormControlLabel
                value="novo"
                control={<Radio />}
                label="Cadastrar este número como novo contato da empresa"
              />
              {modo === 'novo' ? (
                <TextField
                  size="small"
                  label="Nome do contato"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  sx={{ ml: 4, mb: 1 }}
                />
              ) : null}
              <FormControlLabel
                value="existente"
                control={<Radio />}
                label="É um contato já cadastrado"
                disabled={contatos.length === 0}
              />
              {modo === 'existente' ? (
                <FormControl size="small" sx={{ ml: 4, mb: 1 }}>
                  <Select value={contatoId} displayEmpty onChange={(e) => setContatoId(e.target.value)}>
                    <MenuItem value="" disabled>
                      Escolha o contato
                    </MenuItem>
                    {contatos.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nome}
                        {c.cargo ? ` (${c.cargo})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
              <FormControlLabel value="nenhum" control={<Radio />} label="Só vincular à empresa, sem contato" />
            </RadioGroup>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!valido || salvando}
          onClick={() =>
            void executar(
              () =>
                api(`/conversas/${conversa!.id}/vincular`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    clienteId: cliente!.id,
                    contatoId: modo === 'existente' ? contatoId : null,
                    novoContatoNome: modo === 'novo' ? novoNome.trim() : null,
                  }),
                }),
              'Erro ao vincular'
            )
          }
        >
          Vincular
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- Finalizar com motivo ----------

export interface FinalizarDialogProps {
  open: boolean;
  conversa: ConversaDetalhe | null;
  motivos: MotivoAtendimento[];
  onClose: () => void;
}

export function FinalizarDialog({ open, conversa, motivos, onClose }: FinalizarDialogProps): React.JSX.Element {
  const [motivoId, setMotivoId] = React.useState('');
  const [observacoes, setObservacoes] = React.useState('');
  const { salvando, erro, setErro, executar } = useEnvio(onClose);

  React.useEffect(() => {
    if (open) {
      setMotivoId('');
      setObservacoes('');
      setErro(null);
    }
  }, [open, setErro]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Finalizar atendimento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <FormControl fullWidth required>
            <InputLabel id="finalizar-motivo">Motivo do contato</InputLabel>
            <Select
              labelId="finalizar-motivo"
              label="Motivo do contato"
              value={motivoId}
              onChange={(e) => setMotivoId(e.target.value)}
            >
              {motivos
                .filter((m) => m.ativo)
                .map((motivo) => (
                  <MenuItem key={motivo.id} value={motivo.id}>
                    {motivo.nome}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Observações (opcional)"
            multiline
            minRows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
          <Typography variant="caption" color="text.secondary">
            O motivo alimenta o relatório de principais motivos de atendimento.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="success"
          disabled={!motivoId || salvando}
          onClick={() =>
            void executar(
              () =>
                api(`/conversas/${conversa!.id}/finalizar`, {
                  method: 'POST',
                  body: JSON.stringify({ motivoId, observacoes: observacoes.trim() || null }),
                }),
              'Erro ao finalizar'
            )
          }
        >
          Finalizar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- Registrar atendimento (telefone, balcão, e-mail, WhatsApp de fora) ----------

const RESPONSAVEL_EU = 'eu';
const RESPONSAVEL_AUTO = 'auto';

export interface RegistrarAtendimentoDialogProps {
  open: boolean;
  clientes: Cliente[];
  setores: Setor[];
  usuarios: UsuarioResumo[];
  motivos: MotivoAtendimento[];
  clienteInicialId: string | null;
  setorPadraoId: string | null;
  onClose: () => void;
  onRegistrado: (conversaId: string) => void;
}

export function RegistrarAtendimentoDialog(props: RegistrarAtendimentoDialogProps): React.JSX.Element {
  const { open, clientes, setores, usuarios, motivos, clienteInicialId, setorPadraoId, onClose, onRegistrado } = props;
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [contatoId, setContatoId] = React.useState('');
  const [canal, setCanal] = React.useState<CanalManual>('telefone');
  const [setorId, setSetorId] = React.useState('');
  const [responsavel, setResponsavel] = React.useState(RESPONSAVEL_EU);
  const [assunto, setAssunto] = React.useState('');
  const [descricao, setDescricao] = React.useState('');
  const [resolvido, setResolvido] = React.useState(false);
  const [motivoId, setMotivoId] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setCliente(clientes.find((c) => c.id === clienteInicialId) ?? null);
      setContatoId('');
      setCanal('telefone');
      setSetorId(setorPadraoId ?? '');
      setResponsavel(RESPONSAVEL_EU);
      setAssunto('');
      setDescricao('');
      setResolvido(false);
      setMotivoId('');
      setErro(null);
    }
  }, [open, clientes, clienteInicialId, setorPadraoId]);

  // "Automático": o responsável do cliente no setor, ou o padrão do setor.
  const sugerido = React.useMemo(() => {
    if (!setorId) return null;
    const vinculo = cliente?.responsaveis.find((r) => r.setorId === setorId);
    if (vinculo) return { id: vinculo.usuarioId, nome: vinculo.usuario.nome };
    const doSetor = setores.find((s) => s.id === setorId)?.responsavel;
    return doSetor ? { id: doSetor.id, nome: doSetor.nome } : null;
  }, [cliente, setorId, setores]);

  const valido = cliente && setorId && assunto.trim() && (!resolvido || motivoId);

  async function registrar(): Promise<void> {
    setSalvando(true);
    setErro(null);
    const responsavelId =
      responsavel === RESPONSAVEL_EU ? null : responsavel === RESPONSAVEL_AUTO ? (sugerido?.id ?? null) : responsavel;
    try {
      const { id } = await api<{ id: string }>('/atendimentos/registrar', {
        method: 'POST',
        body: JSON.stringify({
          clienteId: cliente!.id,
          contatoId: contatoId || null,
          canal,
          setorId,
          responsavelId,
          assunto: assunto.trim(),
          descricao: descricao.trim() || null,
          motivoId: resolvido ? motivoId : null,
        }),
      });
      onRegistrado(id);
    } catch (error) {
      setErro(mensagemDeErro(error, 'Erro ao registrar atendimento'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Registrar atendimento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Autocomplete
            options={clientes}
            value={cliente}
            onChange={(_e, valor) => {
              setCliente(valor);
              setContatoId('');
            }}
            getOptionLabel={rotuloCliente}
            renderInput={(params) => <TextField {...params} label="Empresa" required />}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="registrar-contato" shrink>
                Quem falou
              </InputLabel>
              <Select
                labelId="registrar-contato"
                label="Quem falou"
                notched
                displayEmpty
                value={contatoId}
                disabled={!cliente}
                onChange={(e) => setContatoId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Não informado</em>
                </MenuItem>
                {(cliente?.contatos ?? []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nome}
                    {c.cargo ? ` (${c.cargo})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel id="registrar-canal">Canal</InputLabel>
              <Select
                labelId="registrar-canal"
                label="Canal"
                value={canal}
                onChange={(e) => setCanal(e.target.value as CanalManual)}
              >
                {CANAIS_MANUAIS.map((c) => (
                  <MenuItem key={c.valor} value={c.valor}>
                    {c.titulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth required>
              <InputLabel id="registrar-setor">Setor</InputLabel>
              <Select
                labelId="registrar-setor"
                label="Setor"
                value={setorId}
                onChange={(e) => setSetorId(e.target.value)}
              >
                {setores.map((setor) => (
                  <MenuItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={resolvido}>
              <InputLabel id="registrar-responsavel">Quem atende</InputLabel>
              <Select
                labelId="registrar-responsavel"
                label="Quem atende"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              >
                <MenuItem value={RESPONSAVEL_EU}>Eu mesmo</MenuItem>
                <MenuItem value={RESPONSAVEL_AUTO} disabled={!sugerido}>
                  Responsável do cliente{sugerido ? ` (${sugerido.nome})` : ' (não definido)'}
                </MenuItem>
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <TextField
            label="Assunto"
            required
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Ex.: Segunda via do DAS de setembro"
          />
          <TextField
            label="Detalhes (opcional)"
            multiline
            minRows={2}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <FormControlLabel
            control={<Switch checked={resolvido} onChange={(e) => setResolvido(e.target.checked)} />}
            label="Já foi resolvido (registrar como finalizado)"
          />
          {resolvido ? (
            <FormControl fullWidth required>
              <InputLabel id="registrar-motivo">Motivo do contato</InputLabel>
              <Select
                labelId="registrar-motivo"
                label="Motivo do contato"
                value={motivoId}
                onChange={(e) => setMotivoId(e.target.value)}
              >
                {motivos
                  .filter((m) => m.ativo)
                  .map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.nome}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Fica em aberto na caixa de entrada
              {responsavel === RESPONSAVEL_EU ? ', com você' : ', na fila de quem vai atender'}, até ser finalizado.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!valido || salvando} onClick={() => void registrar()}>
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- Nova conversa (o escritório chama o cliente) ----------

export interface NovaConversaDialogProps {
  open: boolean;
  clientes: Cliente[];
  setores: Setor[];
  clienteInicialId: string | null;
  setorPadraoId: string | null;
  onClose: () => void;
  onCriada: (conversaId: string) => void;
}

export function NovaConversaDialog(props: NovaConversaDialogProps): React.JSX.Element {
  const { open, clientes, setores, clienteInicialId, setorPadraoId, onClose, onCriada } = props;
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [contatoId, setContatoId] = React.useState('');
  const [setorId, setSetorId] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setCliente(clientes.find((c) => c.id === clienteInicialId) ?? null);
      setContatoId('');
      setSetorId(setorPadraoId ?? '');
      setErro(null);
    }
  }, [open, clientes, clienteInicialId, setorPadraoId]);

  const contatosComCelular = (cliente?.contatos ?? []).filter((c) => c.celular);

  React.useEffect(() => {
    if (contatosComCelular.length === 1) setContatoId(contatosComCelular[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao trocar de empresa
  }, [cliente]);

  async function criar(): Promise<void> {
    setSalvando(true);
    setErro(null);
    try {
      const { id } = await api<{ id: string }>('/conversas', {
        method: 'POST',
        body: JSON.stringify({ contatoId, setorId }),
      });
      onCriada(id);
    } catch (error) {
      setErro(mensagemDeErro(error, 'Erro ao iniciar conversa'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nova conversa no WhatsApp</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Autocomplete
            options={clientes}
            value={cliente}
            onChange={(_e, valor) => {
              setCliente(valor);
              setContatoId('');
            }}
            getOptionLabel={rotuloCliente}
            renderInput={(params) => <TextField {...params} label="Empresa" required />}
          />
          {cliente && contatosComCelular.length === 0 ? (
            <Alert severity="warning">
              Nenhum contato desta empresa tem celular cadastrado. Cadastre na ficha do cliente.
            </Alert>
          ) : null}
          {contatosComCelular.length > 0 ? (
            <FormControl fullWidth required>
              <InputLabel id="nova-contato">Contato</InputLabel>
              <Select
                labelId="nova-contato"
                label="Contato"
                value={contatoId}
                onChange={(e) => setContatoId(e.target.value)}
              >
                {contatosComCelular.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nome}
                    {c.cargo ? ` (${c.cargo})` : ''} · {c.celular}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
          <FormControl fullWidth required>
            <InputLabel id="nova-setor">Setor</InputLabel>
            <Select labelId="nova-setor" label="Setor" value={setorId} onChange={(e) => setSetorId(e.target.value)}>
              {setores.map((setor) => (
                <MenuItem key={setor.id} value={setor.id}>
                  {setor.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!contatoId || !setorId || salvando} onClick={() => void criar()}>
          Abrir conversa
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- Simulador: mensagem chegando de um cliente ----------

export interface SimularMensagemDialogProps {
  open: boolean;
  clientes: Cliente[];
  onClose: () => void;
  onSimulada: (conversaId: string) => void;
}

export function SimularMensagemDialog({
  open,
  clientes,
  onClose,
  onSimulada,
}: SimularMensagemDialogProps): React.JSX.Element {
  const [telefone, setTelefone] = React.useState('');
  const [nome, setNome] = React.useState('');
  const [texto, setTexto] = React.useState('');
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setErro(null);
      setTexto('');
    }
  }, [open]);

  // Atalho: escolher um contato cadastrado preenche o número.
  const contatos = React.useMemo(
    () =>
      clientes.flatMap((c) =>
        (c.contatos ?? [])
          .filter((ct) => ct.celular)
          .map((ct) => ({
            rotulo: `${ct.nome} — ${c.apelido || c.nomeFantasia || c.razaoSocial}`,
            celular: ct.celular!,
            nome: ct.nome,
          }))
      ),
    [clientes]
  );

  async function simular(): Promise<void> {
    setSalvando(true);
    setErro(null);
    try {
      const { conversaId } = await api<{ conversaId: string }>('/whatsapp/simulador/receber', {
        method: 'POST',
        body: JSON.stringify({ telefone, nome: nome || null, texto }),
      });
      onSimulada(conversaId);
    } catch (error) {
      setErro(mensagemDeErro(error, 'Erro ao simular'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Simular mensagem de cliente</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            Enquanto o WhatsApp não está conectado, isto faz o papel do cliente mandando mensagem. Use um contato
            cadastrado para testar a identificação automática, ou um número qualquer para testar a triagem.
          </Alert>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <Autocomplete
            options={contatos}
            getOptionLabel={(o) => o.rotulo}
            onChange={(_e, valor) => {
              if (valor) {
                setTelefone(valor.celular);
                setNome(valor.nome);
              }
            }}
            renderInput={(params) => <TextField {...params} label="Contato cadastrado (opcional)" />}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Telefone com DDD"
              required
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              fullWidth
            />
            <TextField label="Nome no WhatsApp" value={nome} onChange={(e) => setNome(e.target.value)} fullWidth />
          </Stack>
          <TextField
            label="Mensagem"
            required
            multiline
            minRows={2}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
        <Button variant="contained" disabled={!telefone || !texto.trim() || salvando} onClick={() => void simular()}>
          Receber mensagem
        </Button>
      </DialogActions>
    </Dialog>
  );
}
