'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { Cliente } from '@/types/domain';

import { ATIVIDADES, formatarAbertura, NOTAS } from './cliente-form-dialog';

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {rotulo}
      </Typography>
      <Typography variant="body2" component="div">
        {children}
      </Typography>
    </Stack>
  );
}

// Resumo do cadastro fiscal na ficha do cliente (CNAE, inscrições, notas...).
export function DadosFiscais({ cliente }: { cliente: Cliente }): React.JSX.Element {
  const responsavelLegal = (cliente.contatos ?? []).find((c) => c.responsavelLegal);
  const atividades = ATIVIDADES.filter((a) => cliente.atividades?.includes(a.valor)).map((a) => a.titulo);
  const notas = NOTAS.filter((n) => cliente.notasEmitidas?.includes(n.valor)).map((n) => n.titulo);
  const situacao = cliente.situacaoCadastral;
  const faltando = [
    cliente.cnaePrincipal ? null : 'CNAE',
    atividades.length > 0 ? null : 'atividade',
    responsavelLegal ? null : 'responsável legal',
  ].filter(Boolean);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1.5}>
        {situacao && situacao.toUpperCase() !== 'ATIVA' ? (
          <Alert severity="warning" sx={{ py: 0 }}>
            Situação cadastral na Receita: {situacao}
          </Alert>
        ) : null}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Campo rotulo="CNAE principal">
              {cliente.cnaePrincipal ? `${cliente.cnaePrincipal} · ${cliente.cnaeDescricao ?? ''}` : '—'}
              {cliente.cnaesSecundarios?.length ? (
                <Tooltip title={cliente.cnaesSecundarios.map((c) => `${c.codigo} ${c.descricao}`).join('\n')}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`+${cliente.cnaesSecundarios.length} secundários`}
                    sx={{ ml: 1 }}
                  />
                </Tooltip>
              ) : null}
            </Campo>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Campo rotulo="Atividade">{atividades.join(', ') || '—'}</Campo>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Campo rotulo="Emite">{notas.join(', ') || '—'}</Campo>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Campo rotulo="Inscrição estadual">{cliente.inscricaoEstadual || '—'}</Campo>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Campo rotulo="Inscrição municipal">{cliente.inscricaoMunicipal || '—'}</Campo>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Campo rotulo="Responsável legal">{responsavelLegal?.nome ?? '—'}</Campo>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Campo rotulo="Abertura">{formatarAbertura(cliente.dataAbertura) ?? '—'}</Campo>
          </Grid>
          {cliente.endereco ? (
            <Grid size={12}>
              <Campo rotulo="Endereço">
                {cliente.endereco}
                {cliente.cep ? ` · CEP ${cliente.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : ''}
              </Campo>
            </Grid>
          ) : null}
        </Grid>
        {faltando.length > 0 ? (
          <Typography variant="caption" color="warning.main">
            Cadastro incompleto: falta {faltando.join(', ')}. Use &quot;Editar cliente&quot; (o botão &quot;Buscar na
            Receita&quot; preenche CNAE e sócios).
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
