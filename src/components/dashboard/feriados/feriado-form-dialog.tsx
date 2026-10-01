'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
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
import type { Feriado } from '@/types/domain';

export interface FeriadoFormDialogProps {
  open: boolean;
  feriado: Feriado | null;
  onClose: () => void;
  onSaved: (feriado: Feriado, recalculo: { removidas: number; criadas: number }) => void;
}

interface FormState {
  data: Dayjs | null;
  descricao: string;
  recorrente: boolean;
  uf: string;
  cidade: string;
}

const VAZIO: FormState = { data: null, descricao: '', recorrente: true, uf: '', cidade: '' };

function formDoFeriado(feriado: Feriado): FormState {
  return {
    data: dayjs(feriado.data),
    descricao: feriado.descricao,
    recorrente: feriado.recorrente,
    uf: feriado.uf ?? '',
    cidade: feriado.cidade ?? '',
  };
}

// Cadastro de feriado estadual/municipal — os nacionais já são calculados
// automaticamente e não aparecem aqui. Salvar refaz as pendências futuras
// intocadas para refletir o novo calendário no "Nº dia útil".
export function FeriadoFormDialog({ open, feriado, onClose, onSaved }: FeriadoFormDialogProps): React.JSX.Element {
  const [form, setForm] = React.useState<FormState>(VAZIO);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setForm(feriado ? formDoFeriado(feriado) : VAZIO);
    setErro(null);
  }, [open, feriado]);

  function campo<K extends keyof FormState>(chave: K, valor: FormState[K]): void {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  async function salvar(): Promise<void> {
    if (!form.data || !form.descricao.trim()) {
      setErro('Data e descrição são obrigatórias');
      return;
    }
    if (form.cidade.trim() && !form.uf.trim()) {
      setErro('Feriado municipal precisa da UF');
      return;
    }
    setSalvando(true);
    setErro(null);
    const payload = {
      data: form.data.format('YYYY-MM-DD'),
      descricao: form.descricao.trim(),
      recorrente: form.recorrente,
      uf: form.uf.trim() || null,
      cidade: form.cidade.trim() || null,
    };
    try {
      const resultado = feriado
        ? await api<{ feriado: Feriado; recalculo: { removidas: number; criadas: number } }>(`/feriados/${feriado.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await api<{ feriado: Feriado; recalculo: { removidas: number; criadas: number } }>('/feriados', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      onSaved(resultado.feriado, resultado.recalculo);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar feriado');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{feriado ? 'Editar feriado' : 'Novo feriado'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {erro ? <Alert severity="error">{erro}</Alert> : null}
          <DatePicker label="Data" value={form.data} onChange={(valor) => campo('data', valor)} format="DD/MM/YYYY" />
          <TextField
            label="Descrição"
            value={form.descricao}
            onChange={(e) => campo('descricao', e.target.value)}
            required
            autoFocus
          />
          <FormControl>
            <InputLabel id="feriado-recorrente">Repete todo ano?</InputLabel>
            <Select
              labelId="feriado-recorrente"
              label="Repete todo ano?"
              value={form.recorrente ? 'S' : 'N'}
              onChange={(e) => campo('recorrente', e.target.value === 'S')}
            >
              <MenuItem value="S">Sim</MenuItem>
              <MenuItem value="N">Não (só esse ano)</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField
              label="UF"
              value={form.uf}
              onChange={(e) => campo('uf', e.target.value.toUpperCase())}
              helperText="Deixe vazio pra feriado nacional"
              slotProps={{ htmlInput: { maxLength: 2 } }}
              sx={{ width: 120 }}
            />
            <TextField
              label="Cidade"
              value={form.cidade}
              onChange={(e) => campo('cidade', e.target.value)}
              helperText="Deixe vazio pra feriado estadual"
              sx={{ flex: 1 }}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={salvando} onClick={salvar}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
