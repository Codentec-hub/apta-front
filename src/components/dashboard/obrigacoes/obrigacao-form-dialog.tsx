'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import type { Cliente, Obrigacao, Setor, TipoObrigacao, UsuarioResumo } from '@/types/domain';

function mesmoDia(a: Dayjs | null, b: string | null | undefined): boolean {
  return a && b ? a.isSame(dayjs(b), 'day') : !a && !b;
}

export interface ObrigacaoFormDialogProps {
  open: boolean;
  obrigacao: Obrigacao | null;
  clientes: Cliente[];
  setores: Setor[];
  tipos: TipoObrigacao[];
  usuarios: UsuarioResumo[];
  clientePreSelecionado?: Cliente | null;
  competenciaPadrao?: string; // "2026-09"
  // Sem permissão, os prazos de uma entrega existente ficam travados.
  podeAlterarPrazos?: boolean;
  onClose: () => void;
  onSaved: (obrigacao: Obrigacao) => void;
}

export function ObrigacaoFormDialog({
  open,
  obrigacao,
  clientes,
  setores,
  tipos,
  usuarios,
  clientePreSelecionado,
  competenciaPadrao,
  podeAlterarPrazos = true,
  onClose,
  onSaved,
}: ObrigacaoFormDialogProps): React.JSX.Element {
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [tipo, setTipo] = React.useState<TipoObrigacao | null>(null);
  const [setorId, setSetorId] = React.useState('');
  const [nome, setNome] = React.useState('');
  const [competencia, setCompetencia] = React.useState<Dayjs | null>(null);
  const [prazo, setPrazo] = React.useState<Dayjs | null>(null);
  const [prazoTecnico, setPrazoTecnico] = React.useState<Dayjs | null>(null);
  const [responsavelId, setResponsavelId] = React.useState('');
  const [dispensada, setDispensada] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    if (obrigacao) {
      setCliente(clientes.find((c) => c.id === obrigacao.clienteId) ?? null);
      setTipo(obrigacao.tipo);
      setSetorId(obrigacao.setorId);
      setNome(obrigacao.nome);
      setCompetencia(obrigacao.competencia ? dayjs(obrigacao.competencia.slice(0, 10)) : null);
      setPrazo(dayjs(obrigacao.prazo));
      setPrazoTecnico(obrigacao.prazoTecnico ? dayjs(obrigacao.prazoTecnico) : null);
      setResponsavelId(obrigacao.responsavelId ?? '');
      setDispensada(obrigacao.dispensada);
    } else {
      setCliente(clientePreSelecionado ?? null);
      setTipo(null);
      setSetorId('');
      setNome('');
      setCompetencia(dayjs(competenciaPadrao ? `${competenciaPadrao}-01` : undefined).startOf('month'));
      setPrazo(null);
      setPrazoTecnico(null);
      setResponsavelId('');
      setDispensada(false);
    }
    setErro(null);
  }, [open, obrigacao, clientes, clientePreSelecionado, competenciaPadrao]);

  const calculaPelaRegra = !obrigacao && Boolean(tipo && competencia);
  const prazosTravados = Boolean(obrigacao) && !podeAlterarPrazos;

  function selecionarTipo(novoTipo: TipoObrigacao | null): void {
    setTipo(novoTipo);
    if (novoTipo) {
      setNome(novoTipo.nome);
      setSetorId(novoTipo.setorId);
    }
  }

  // Só manda o prazo que mudou de dia — assim editar outro campo não gera
  // log de alteração de prazo nem esbarra na permissão.
  function camposDePrazo(): { prazo?: string; prazoTecnico?: string | null } {
    const campos: { prazo?: string; prazoTecnico?: string | null } = {};
    if (prazo && !(obrigacao && mesmoDia(prazo, obrigacao.prazo))) {
      campos.prazo = prazo.endOf('day').toISOString();
    }
    const tecnicoMudou = obrigacao ? !mesmoDia(prazoTecnico, obrigacao.prazoTecnico) : prazo || !calculaPelaRegra;
    if (tecnicoMudou) {
      campos.prazoTecnico = prazoTecnico ? prazoTecnico.endOf('day').toISOString() : null;
    }
    return campos;
  }

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!cliente || !setorId || !nome.trim() || (!prazo && !calculaPelaRegra)) {
      setErro('Empresa, departamento, nome e prazo legal são obrigatórios');
      return;
    }

    setSalvando(true);
    setErro(null);

    const payload = {
      nome: nome.trim(),
      ...(prazosTravados ? {} : camposDePrazo()),
      setorId,
      tipoId: tipo?.id ?? null,
      responsavelId: responsavelId || null,
      dispensada,
    };

    try {
      const salvo = obrigacao
        ? await api<Obrigacao>(`/obrigacoes/${obrigacao.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api<Obrigacao>('/obrigacoes', {
            method: 'POST',
            body: JSON.stringify({
              ...payload,
              clienteId: cliente.id,
              competencia: competencia ? competencia.format('YYYY-MM') : null,
            }),
          });
      onSaved(salvo);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar obrigação');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{obrigacao ? 'Editar entrega' : 'Entrega avulsa'}</DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            <Autocomplete
              options={clientes}
              value={cliente}
              disabled={Boolean(obrigacao)}
              getOptionLabel={(option) => `${option.razaoSocial} — ${option.cnpj}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, value) => setCliente(value)}
              renderInput={(params) => <TextField {...params} label="Empresa" required />}
            />
            <Autocomplete
              options={tipos.filter((t) => t.ativo)}
              value={tipo}
              groupBy={(option) => option.setor.nome}
              getOptionLabel={(option) => option.nome}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, value) => selecionarTipo(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Obrigação do cadastro (opcional)"
                  helperText="Preenche nome e departamento; com competência, o prazo sai da regra"
                />
              )}
            />
            <TextField
              label="Nome da obrigação"
              placeholder="Ex.: DCTFWeb"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              required
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel id="setor-label">Departamento</InputLabel>
              <Select
                labelId="setor-label"
                label="Departamento"
                value={setorId}
                onChange={(event) => setSetorId(event.target.value)}
              >
                {setores.map((setor) => (
                  <MenuItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="Competência"
              views={['year', 'month']}
              openTo="month"
              format="MM/YYYY"
              value={competencia}
              disabled={Boolean(obrigacao)}
              onChange={(valor) => setCompetencia(valor ? valor.startOf('month') : null)}
              slotProps={{ field: { clearable: true } }}
            />
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Prazo técnico"
                value={prazoTecnico}
                onChange={setPrazoTecnico}
                disabled={prazosTravados}
                format="DD/MM/YYYY"
                sx={{ flex: 1 }}
              />
              <DatePicker
                label={calculaPelaRegra ? 'Prazo legal (pela regra)' : 'Prazo legal'}
                value={prazo}
                onChange={setPrazo}
                disabled={prazosTravados}
                format="DD/MM/YYYY"
                sx={{ flex: 1 }}
              />
            </Stack>
            <Typography color="text.secondary" variant="caption">
              {prazosTravados
                ? 'Alterar prazos exige perfil Gestor ou Administrador.'
                : calculaPelaRegra
                  ? 'Deixe os prazos em branco para calculá-los pela regra da obrigação no cadastro.'
                  : 'Prazo técnico é a meta interna do escritório, antes do prazo legal. Alterações de prazo ficam no histórico.'}
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="responsavel-label">Responsável pelo prazo</InputLabel>
              <Select
                labelId="responsavel-label"
                label="Responsável pelo prazo"
                value={responsavelId}
                onChange={(event) => setResponsavelId(event.target.value)}
              >
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox checked={dispensada} onChange={(event) => setDispensada(event.target.checked)} />}
              label="Dispensada (não se aplica a esta empresa nesta competência)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {obrigacao ? 'Salvar alterações' : 'Criar entrega'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
