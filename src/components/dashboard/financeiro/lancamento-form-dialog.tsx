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
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';

import { api } from '@/lib/api';
import type { Cliente, LancamentoFinanceiro, TipoLancamento } from '@/types/domain';

export interface LancamentoFormDialogProps {
  open: boolean;
  lancamento: LancamentoFinanceiro | null;
  clientes: Cliente[];
  tipoPadrao?: TipoLancamento;
  clientePreSelecionado?: Cliente | null;
  onClose: () => void;
  onSaved: (lancamento: LancamentoFinanceiro) => void;
}

const CATEGORIAS_SUGERIDAS = [
  'Honorários',
  'Salários',
  'Pró-labore',
  'Aluguel',
  'Impostos',
  'Fornecedores',
  'Contas a receber de BPO',
];

export function LancamentoFormDialog({
  open,
  lancamento,
  clientes,
  tipoPadrao = 'PAGAR',
  clientePreSelecionado,
  onClose,
  onSaved,
}: LancamentoFormDialogProps): React.JSX.Element {
  const [tipo, setTipo] = React.useState<TipoLancamento>(tipoPadrao);
  const [descricao, setDescricao] = React.useState('');
  const [categoria, setCategoria] = React.useState('');
  const [valor, setValor] = React.useState('');
  const [vencimento, setVencimento] = React.useState<Dayjs | null>(dayjs());
  const [cliente, setCliente] = React.useState<Cliente | null>(null);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    if (lancamento) {
      setTipo(lancamento.tipo);
      setDescricao(lancamento.descricao);
      setCategoria(lancamento.categoria ?? '');
      setValor(String(lancamento.valor));
      setVencimento(dayjs(lancamento.vencimento));
      setCliente(clientes.find((c) => c.id === lancamento.clienteId) ?? null);
    } else {
      setTipo(tipoPadrao);
      setDescricao('');
      setCategoria('');
      setValor('');
      setVencimento(dayjs());
      setCliente(clientePreSelecionado ?? null);
    }
    setErro(null);
  }, [open, lancamento, clientes, tipoPadrao, clientePreSelecionado]);

  async function salvar(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const valorNumero = Number(valor.replace(',', '.'));
    if (!descricao.trim() || !vencimento || !valorNumero || valorNumero <= 0) {
      setErro('Descrição, valor (maior que zero) e vencimento são obrigatórios');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      const salvo = lancamento
        ? await api<LancamentoFinanceiro>(`/financeiro/lancamentos/${lancamento.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              descricao: descricao.trim(),
              categoria: categoria.trim() || null,
              valor: valorNumero,
              vencimento: vencimento.toISOString(),
              clienteId: cliente?.id ?? null,
            }),
          })
        : await api<LancamentoFinanceiro>('/financeiro/lancamentos', {
            method: 'POST',
            body: JSON.stringify({
              tipo,
              descricao: descricao.trim(),
              categoria: categoria.trim() || null,
              valor: valorNumero,
              vencimento: vencimento.toISOString(),
              clienteId: cliente?.id ?? null,
            }),
          });
      onSaved(salvo);
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar lançamento');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {lancamento ? 'Editar lançamento' : tipo === 'PAGAR' ? 'Nova conta a pagar' : 'Nova conta a receber'}
      </DialogTitle>
      <Stack component="form" onSubmit={salvar}>
        <DialogContent>
          <Stack spacing={2}>
            {erro ? <Alert severity="error">{erro}</Alert> : null}
            {lancamento ? null : (
              <FormControl fullWidth>
                <InputLabel id="lancamento-tipo-label">Tipo</InputLabel>
                <Select
                  labelId="lancamento-tipo-label"
                  label="Tipo"
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value as TipoLancamento)}
                >
                  <MenuItem value="PAGAR">Conta a pagar</MenuItem>
                  <MenuItem value="RECEBER">Conta a receber</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField
              label="Descrição"
              placeholder="Ex.: Aluguel do escritório — setembro"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              required
              autoFocus
              fullWidth
            />
            <Autocomplete
              freeSolo
              options={CATEGORIAS_SUGERIDAS}
              value={categoria}
              onInputChange={(_event, value) => setCategoria(value)}
              renderInput={(params) => <TextField {...params} label="Categoria (opcional)" />}
            />
            <TextField
              label="Valor (R$)"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              required
              fullWidth
            />
            <DatePicker label="Vencimento" value={vencimento} onChange={setVencimento} format="DD/MM/YYYY" />
            <Autocomplete
              options={clientes}
              value={cliente}
              getOptionLabel={(option) => `${option.razaoSocial} — ${option.cnpj}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, value) => setCliente(value)}
              renderInput={(params) => (
                <TextField {...params} label="Cliente (opcional — vazio = escritório)" />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fechar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {lancamento ? 'Salvar alterações' : 'Criar lançamento'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
