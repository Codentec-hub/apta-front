'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import dayjs from 'dayjs';

import type {
  AtividadeEmpresa,
  Cliente,
  ConjuntoObrigacoes,
  ConsultaCnpj,
  NotaEmitida,
  Setor,
  UsuarioResumo,
} from '@/types/domain';
import { api } from '@/lib/api';
import {
  avisoDocumento,
  cnpjValido,
  erroDocumento,
  formatarCodigo,
  formatarDocumento,
  somenteDigitos,
} from '@/lib/empresa';

import { ContatosEmpresa } from './contatos-empresa';

// Usados quando ainda não há regimes cadastrados (Obrigações → Regimes).
const REGIMES_PADRAO = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real'];

const MAX_SOCIOS_MARCADOS = 5;

const UFS = 'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ');

export const ATIVIDADES: { valor: AtividadeEmpresa; titulo: string }[] = [
  { valor: 'servicos', titulo: 'Serviços' },
  { valor: 'comercio', titulo: 'Comércio' },
  { valor: 'industria', titulo: 'Indústria' },
];

export const NOTAS: { valor: NotaEmitida; titulo: string; ajuda: string }[] = [
  { valor: 'nfse', titulo: 'NFS-e', ajuda: 'Nota de serviço (prefeitura)' },
  { valor: 'nfe', titulo: 'NF-e', ajuda: 'Nota de produto (modelo 55)' },
  { valor: 'nfce', titulo: 'NFC-e', ajuda: 'Cupom do varejo (modelo 65)' },
  { valor: 'cte', titulo: 'CT-e', ajuda: 'Conhecimento de transporte' },
];

export interface ClienteFormDialogProps {
  open: boolean;
  cliente: Cliente | null;
  setores: Setor[];
  usuarios: UsuarioResumo[];
  onClose: () => void;
  onSaved: (cliente: Cliente) => void;
}

// Resposta do POST/PUT: quantas obrigações do regime foram vinculadas
// (null = o regime não mudou ou não tem obrigações cadastradas).
type ClienteSalvo = Cliente & { obrigacoesAplicadas: number | null };

interface FormState {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  regimeTributario: string;
  apelido: string;
  cidade: string;
  uf: string;
  grupoEmpresas: string;
  honorario: string;
  dataAbertura: string;
  situacaoCadastral: string;
  cnaePrincipal: string;
  cnaeDescricao: string;
  cnaesSecundarios: { codigo: string; descricao: string }[];
  atividades: AtividadeEmpresa[];
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  notasEmitidas: NotaEmitida[];
  cep: string;
  endereco: string;
}

const VAZIO: FormState = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  regimeTributario: '',
  apelido: '',
  cidade: 'Fortaleza',
  uf: 'CE',
  grupoEmpresas: '',
  honorario: '',
  dataAbertura: '',
  situacaoCadastral: '',
  cnaePrincipal: '',
  cnaeDescricao: '',
  cnaesSecundarios: [],
  atividades: [],
  inscricaoEstadual: '',
  inscricaoMunicipal: '',
  notasEmitidas: [],
  cep: '',
  endereco: '',
};

function doCliente(cliente: Cliente): FormState {
  return {
    razaoSocial: cliente.razaoSocial,
    nomeFantasia: cliente.nomeFantasia ?? '',
    cnpj: formatarDocumento(cliente.cnpj),
    regimeTributario: cliente.regimeTributario ?? '',
    apelido: cliente.apelido ?? '',
    cidade: cliente.cidade ?? '',
    uf: cliente.uf ?? '',
    grupoEmpresas: cliente.grupoEmpresas ?? '',
    honorario: cliente.honorario === null ? '' : String(cliente.honorario),
    dataAbertura: cliente.dataAbertura ? cliente.dataAbertura.slice(0, 10) : '',
    situacaoCadastral: cliente.situacaoCadastral ?? '',
    cnaePrincipal: cliente.cnaePrincipal ?? '',
    cnaeDescricao: cliente.cnaeDescricao ?? '',
    cnaesSecundarios: cliente.cnaesSecundarios ?? [],
    atividades: cliente.atividades ?? [],
    inscricaoEstadual: cliente.inscricaoEstadual ?? '',
    inscricaoMunicipal: cliente.inscricaoMunicipal ?? '',
    notasEmitidas: cliente.notasEmitidas ?? [],
    cep: cliente.cep ?? '',
    endereco: cliente.endereco ?? '',
  };
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        {titulo}
      </Typography>
      {children}
    </Stack>
  );
}

function texto(v: string): string | null {
  return v.trim() || null;
}

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

export function ClienteFormDialog({
  open,
  cliente,
  setores,
  usuarios,
  onClose,
  onSaved,
}: ClienteFormDialogProps): React.JSX.Element {
  const [form, setForm] = React.useState<FormState>(VAZIO);
  const [clienteAtual, setClienteAtual] = React.useState<Cliente | null>(cliente);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const [salvandoResponsavelSetorId, setSalvandoResponsavelSetorId] = React.useState<string | null>(null);
  const [regimes, setRegimes] = React.useState<string[]>(REGIMES_PADRAO);
  // Consulta do CNPJ na Receita.
  const [consultando, setConsultando] = React.useState(false);
  const [consulta, setConsulta] = React.useState<ConsultaCnpj | null>(null);
  const [sociosMarcados, setSociosMarcados] = React.useState<Set<number>>(new Set());

  const set = <K extends keyof FormState>(campo: K, valor: FormState[K]): void =>
    setForm((f) => ({ ...f, [campo]: valor }));

  // Regimes granulares do cadastro ("Simples Nacional - Comércio … - Com Funcionários").
  React.useEffect(() => {
    if (!open) return;
    api<ConjuntoObrigacoes[]>('/regimes')
      .then((lista) => {
        if (lista.length > 0) setRegimes(lista.map((r) => r.nome));
      })
      .catch(() => null);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setClienteAtual(cliente);
      setForm(cliente ? doCliente(cliente) : VAZIO);
      setErro(null);
    }
  }, [open, cliente]);

  // O aviso de "salvo" e a consulta só somem ao reabrir: depois de salvar, o
  // pai devolve o cliente atualizado e o efeito acima roda de novo.
  React.useEffect(() => {
    if (open) {
      setAviso(null);
      setConsulta(null);
      setSociosMarcados(new Set());
    }
  }, [open]);

  async function consultarCnpj(): Promise<void> {
    const digitos = somenteDigitos(form.cnpj);
    if (!cnpjValido(digitos)) {
      setErro('Digite um CNPJ válido para buscar na Receita');
      return;
    }
    setConsultando(true);
    setErro(null);
    try {
      const r = await api<ConsultaCnpj>(`/consulta-cnpj/${digitos}`);
      if (r.jaCadastrado && r.jaCadastrado.id !== clienteAtual?.id) {
        setErro(`Este CNPJ já é o cliente [${formatarCodigo(r.jaCadastrado.codigo)}] ${r.jaCadastrado.razaoSocial}.`);
      }
      setConsulta(r);
      // Empresa pequena: todos os sócios viram contatos. Com muitos (S.A.,
      // conselhos), só o responsável legal; o resto, se quiser, à mão.
      setSociosMarcados(
        new Set(
          r.socios
            .map((s, i) => (r.socios.length <= MAX_SOCIOS_MARCADOS || s.responsavelLegal ? i : -1))
            .filter((i) => i >= 0)
        )
      );
      setForm((f) => ({
        ...f,
        cnpj: formatarDocumento(digitos),
        razaoSocial: r.razaoSocial ?? f.razaoSocial,
        nomeFantasia: r.nomeFantasia ?? f.nomeFantasia,
        situacaoCadastral: r.situacaoCadastral ?? f.situacaoCadastral,
        dataAbertura: r.dataAbertura ?? f.dataAbertura,
        cnaePrincipal: r.cnaePrincipal ?? f.cnaePrincipal,
        cnaeDescricao: r.cnaeDescricao ?? f.cnaeDescricao,
        cnaesSecundarios: r.cnaesSecundarios,
        cep: r.cep ?? f.cep,
        endereco: r.endereco ?? f.endereco,
        cidade: r.cidade ?? f.cidade,
        uf: r.uf ?? f.uf,
        // Optante pelo Simples: sugere o regime se ainda não foi escolhido.
        regimeTributario:
          f.regimeTributario || (r.simples && regimes.includes('Simples Nacional') ? 'Simples Nacional' : ''),
      }));
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao consultar o CNPJ');
    } finally {
      setConsultando(false);
    }
  }

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!form.razaoSocial.trim() || !form.cnpj.trim()) {
      setErro('Razão social e CNPJ são obrigatórios');
      return;
    }
    const problemaDocumento = erroDocumento(form.cnpj);
    if (problemaDocumento) {
      setErro(problemaDocumento);
      return;
    }

    setSalvando(true);
    setErro(null);

    const payload = {
      razaoSocial: form.razaoSocial.trim(),
      nomeFantasia: texto(form.nomeFantasia),
      cnpj: somenteDigitos(form.cnpj),
      regimeTributario: form.regimeTributario || null,
      apelido: texto(form.apelido),
      cidade: texto(form.cidade),
      uf: form.uf || null,
      grupoEmpresas: texto(form.grupoEmpresas),
      honorario: form.honorario.trim() ? Number(form.honorario.replace(',', '.')) : null,
      dataAbertura: form.dataAbertura || null,
      situacaoCadastral: texto(form.situacaoCadastral),
      cnaePrincipal: texto(form.cnaePrincipal),
      cnaeDescricao: texto(form.cnaeDescricao),
      cnaesSecundarios: form.cnaesSecundarios.length > 0 ? form.cnaesSecundarios : null,
      atividades: form.atividades,
      inscricaoEstadual: texto(form.inscricaoEstadual),
      inscricaoMunicipal: texto(form.inscricaoMunicipal),
      notasEmitidas: form.notasEmitidas,
      cep: texto(somenteDigitos(form.cep)),
      endereco: texto(form.endereco),
      // Só no cadastro novo: sócios da Receita viram contatos.
      ...(clienteAtual || !consulta ? {} : { socios: consulta.socios.filter((_, i) => sociosMarcados.has(i)) }),
    };

    try {
      const salvo = clienteAtual
        ? await api<ClienteSalvo>(`/clientes/${clienteAtual.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api<ClienteSalvo>('/clientes', { method: 'POST', body: JSON.stringify(payload) });

      setAviso(
        salvo.obrigacoesAplicadas == null
          ? clienteAtual
            ? 'Cliente atualizado.'
            : 'Cliente criado. Sem regime com obrigações: vincule as obrigações na ficha do cliente.'
          : `${clienteAtual ? 'Cliente atualizado' : 'Cliente criado'}: ${salvo.obrigacoesAplicadas} obrigação(ões) do regime ${salvo.regimeTributario} vinculada(s), com as entregas já geradas.`
      );
      setForm(doCliente(salvo));
      setConsulta(null);
      setClienteAtual(salvo);
      onSaved(salvo);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar cliente');
    } finally {
      setSalvando(false);
    }
  }

  async function alterarResponsavel(setorId: string, usuarioId: string): Promise<void> {
    if (!clienteAtual) {
      return;
    }
    setSalvandoResponsavelSetorId(setorId);
    setErro(null);
    try {
      await (usuarioId
        ? api(`/clientes/${clienteAtual.id}/responsaveis/${setorId}`, {
            method: 'PUT',
            body: JSON.stringify({ usuarioId }),
          })
        : api(`/clientes/${clienteAtual.id}/responsaveis/${setorId}`, { method: 'DELETE' }));
      const atualizado = await api<Cliente>(`/clientes/${clienteAtual.id}`);
      setClienteAtual(atualizado);
      onSaved(atualizado);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar responsável');
    } finally {
      setSalvandoResponsavelSetorId(null);
    }
  }

  function responsavelDoSetor(setorId: string): string {
    return clienteAtual?.responsaveis.find((r) => r.setorId === setorId)?.usuarioId ?? '';
  }

  const podeConsultar = cnpjValido(form.cnpj);
  const situacaoIrregular = form.situacaoCadastral && form.situacaoCadastral.toUpperCase() !== 'ATIVA';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {clienteAtual ? `Editar cliente [${formatarCodigo(clienteAtual.codigo)}]` : 'Novo cliente'}
      </DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={3}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            {aviso ? (
              <Alert severity="success" onClose={() => setAviso(null)}>
                {aviso}
              </Alert>
            ) : null}

            <Secao titulo="Identificação">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-start' } }}>
                <TextField
                  label="CNPJ / CPF / CAEPF"
                  value={form.cnpj}
                  onChange={(event) => set('cnpj', event.target.value)}
                  onBlur={() => {
                    setForm((f) => ({ ...f, cnpj: formatarDocumento(f.cnpj) }));
                    // Cadastro novo com CNPJ válido e ainda sem nome: já busca.
                    if (!clienteAtual && !consulta && !form.razaoSocial.trim() && cnpjValido(form.cnpj)) {
                      void consultarCnpj();
                    }
                  }}
                  helperText={avisoDocumento(form.cnpj) ?? 'Com CNPJ, os dados vêm da Receita'}
                  inputMode="numeric"
                  required
                  autoFocus={!clienteAtual}
                  fullWidth
                />
                <Tooltip title="Preenche razão social, CNAE, endereço e sócios com os dados da Receita">
                  <span>
                    <Button
                      variant="outlined"
                      onClick={() => void consultarCnpj()}
                      disabled={!podeConsultar || consultando}
                      startIcon={consultando ? <CircularProgress size={16} /> : <MagnifyingGlassIcon />}
                      sx={{ height: 56, whiteSpace: 'nowrap' }}
                    >
                      Buscar na Receita
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
              {situacaoIrregular ? (
                <Alert severity="warning">Situação cadastral na Receita: {form.situacaoCadastral}.</Alert>
              ) : null}
              <TextField
                label="Razão social"
                value={form.razaoSocial}
                onChange={(event) => set('razaoSocial', event.target.value)}
                required
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Nome fantasia"
                  value={form.nomeFantasia}
                  onChange={(event) => set('nomeFantasia', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Apelido"
                  value={form.apelido}
                  onChange={(event) => set('apelido', event.target.value)}
                  helperText="Como o escritório chama a empresa"
                  fullWidth
                />
                <TextField
                  label="Abertura"
                  type="date"
                  value={form.dataAbertura}
                  onChange={(event) => set('dataAbertura', event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ minWidth: 170 }}
                />
              </Stack>
            </Secao>

            <Secao titulo="Fiscal">
              <FormControl fullWidth>
                <InputLabel id="regime-label">Regime tributário</InputLabel>
                <Select
                  labelId="regime-label"
                  label="Regime tributário"
                  value={form.regimeTributario}
                  onChange={(event) => set('regimeTributario', event.target.value)}
                >
                  <MenuItem value="">
                    <em>Não definido</em>
                  </MenuItem>
                  {(form.regimeTributario && !regimes.includes(form.regimeTributario)
                    ? [...regimes, form.regimeTributario]
                    : regimes
                  ).map((regime) => (
                    <MenuItem key={regime} value={regime}>
                      {regime}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {clienteAtual && form.regimeTributario !== (clienteAtual.regimeTributario ?? '')
                    ? 'Ao salvar, as obrigações da empresa passam a ser as do novo regime (o histórico de entregas fica).'
                    : consulta?.mei
                      ? 'MEI na Receita. As obrigações do regime são vinculadas automaticamente.'
                      : 'As obrigações do regime são vinculadas automaticamente e as entregas já ficam geradas.'}
                </FormHelperText>
              </FormControl>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="CNAE principal"
                  value={form.cnaePrincipal}
                  onChange={(event) => set('cnaePrincipal', event.target.value)}
                  placeholder="0000-0/00"
                  sx={{ minWidth: 170 }}
                />
                <TextField
                  label="Descrição da atividade"
                  value={form.cnaeDescricao}
                  onChange={(event) => set('cnaeDescricao', event.target.value)}
                  fullWidth
                />
              </Stack>
              {form.cnaesSecundarios.length > 0 ? (
                <Stack spacing={0.75}>
                  <Typography variant="caption" color="text.secondary">
                    CNAEs secundários ({form.cnaesSecundarios.length})
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                    {form.cnaesSecundarios.map((c) => (
                      <Tooltip key={c.codigo} title={c.descricao}>
                        <Chip size="small" variant="outlined" label={c.codigo} />
                      </Tooltip>
                    ))}
                  </Stack>
                </Stack>
              ) : null}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ typography: 'caption' }}>
                    Atividade
                  </FormLabel>
                  <FormGroup row>
                    {ATIVIDADES.map((a) => (
                      <FormControlLabel
                        key={a.valor}
                        control={
                          <Checkbox
                            size="small"
                            checked={form.atividades.includes(a.valor)}
                            onChange={() => set('atividades', alternar(form.atividades, a.valor))}
                          />
                        }
                        label={a.titulo}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ typography: 'caption' }}>
                    Notas fiscais que emite
                  </FormLabel>
                  <FormGroup row>
                    {NOTAS.map((n) => (
                      <Tooltip key={n.valor} title={n.ajuda}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={form.notasEmitidas.includes(n.valor)}
                              onChange={() => set('notasEmitidas', alternar(form.notasEmitidas, n.valor))}
                            />
                          }
                          label={n.titulo}
                        />
                      </Tooltip>
                    ))}
                  </FormGroup>
                </FormControl>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Inscrição estadual"
                  value={form.inscricaoEstadual}
                  onChange={(event) => set('inscricaoEstadual', event.target.value)}
                  helperText="Comércio/indústria (NF-e)"
                  fullWidth
                />
                <TextField
                  label="Inscrição municipal"
                  value={form.inscricaoMunicipal}
                  onChange={(event) => set('inscricaoMunicipal', event.target.value)}
                  helperText="Serviços (NFS-e)"
                  fullWidth
                />
              </Stack>
            </Secao>

            <Secao titulo="Endereço">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="CEP"
                  value={form.cep}
                  onChange={(event) => set('cep', event.target.value)}
                  inputMode="numeric"
                  sx={{ minWidth: 140 }}
                />
                <TextField
                  label="Endereço"
                  value={form.endereco}
                  onChange={(event) => set('endereco', event.target.value)}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Cidade"
                  value={form.cidade}
                  onChange={(event) => set('cidade', event.target.value)}
                  helperText="Define os feriados municipais"
                  fullWidth
                />
                <FormControl sx={{ minWidth: 100 }}>
                  <InputLabel id="uf-label">UF</InputLabel>
                  <Select
                    labelId="uf-label"
                    label="UF"
                    value={form.uf}
                    onChange={(event) => set('uf', event.target.value)}
                  >
                    <MenuItem value="">
                      <em>—</em>
                    </MenuItem>
                    {UFS.map((uf) => (
                      <MenuItem key={uf} value={uf}>
                        {uf}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Secao>

            <Secao titulo="Escritório">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Grupo de empresas"
                  value={form.grupoEmpresas}
                  onChange={(event) => set('grupoEmpresas', event.target.value)}
                  placeholder="Geral"
                  fullWidth
                />
                <TextField
                  label="Honorário (R$)"
                  value={form.honorario}
                  onChange={(event) => set('honorario', event.target.value)}
                  inputMode="decimal"
                  fullWidth
                />
              </Stack>
            </Secao>

            {!clienteAtual && consulta && consulta.socios.length > 0 ? (
              <Secao titulo="Sócios na Receita">
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  <Button size="small" onClick={() => setSociosMarcados(new Set(consulta.socios.map((_, i) => i)))}>
                    Marcar todos
                  </Button>
                  <Button size="small" onClick={() => setSociosMarcados(new Set())}>
                    Desmarcar todos
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Os marcados viram contatos da empresa. O sócio-administrador fica como responsável legal. Depois dá
                  para completar celular e e-mail.
                </Typography>
                <FormGroup>
                  {consulta.socios.map((s, i) => (
                    <FormControlLabel
                      key={`${s.nome}-${i}`}
                      control={
                        <Checkbox
                          size="small"
                          checked={sociosMarcados.has(i)}
                          onChange={() =>
                            setSociosMarcados((atual) => {
                              const novo = new Set(atual);
                              if (novo.has(i)) novo.delete(i);
                              else novo.add(i);
                              return novo;
                            })
                          }
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {s.nome}
                          <Typography component="span" variant="caption" color="text.secondary">
                            {s.cargo ? ` · ${s.cargo}` : ''}
                            {s.responsavelLegal ? ' · responsável legal' : ''}
                          </Typography>
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Secao>
            ) : null}

            {clienteAtual ? (
              <>
                <Divider />
                <ContatosEmpresa clienteId={clienteAtual.id} setores={setores} />
                <Divider />
                <Typography variant="subtitle2">Responsáveis por setor</Typography>
                <Stack spacing={2}>
                  {setores.map((setor) => (
                    <FormControl key={setor.id} fullWidth size="small">
                      <InputLabel id={`resp-${setor.id}`}>{setor.nome}</InputLabel>
                      <Select
                        labelId={`resp-${setor.id}`}
                        label={setor.nome}
                        value={responsavelDoSetor(setor.id)}
                        disabled={salvandoResponsavelSetorId === setor.id}
                        onChange={(event) => alterarResponsavel(setor.id, event.target.value)}
                      >
                        <MenuItem value="">
                          <em>
                            Nenhum{setor.responsavel ? ` (usa o padrão do setor: ${setor.responsavel.nome})` : ''}
                          </em>
                        </MenuItem>
                        {usuarios.map((usuario) => (
                          <MenuItem key={usuario.id} value={usuario.id}>
                            {usuario.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Stack>
              </>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Salve o cliente para cadastrar os contatos e atribuir os responsáveis por setor.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {clienteAtual ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

// Data de abertura para exibição: "01/08/1966".
export function formatarAbertura(data: string | null): string | null {
  return data ? dayjs(data.slice(0, 10)).format('DD/MM/YYYY') : null;
}
