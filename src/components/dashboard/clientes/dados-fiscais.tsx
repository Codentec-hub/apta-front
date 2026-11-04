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
    cliente.inscricaoMunicipal ? null : 'inscrição municipal',
    cliente.atividades?.includes('comercio') && !cliente.inscricaoEstadual ? 'inscrição estadual' : null,
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
            <Campo rotulo="CNAE principal">{cliente.cnaePrincipal ? `${cliente.cnaePrincipal} · ${cliente.cnaeDescricao ?? ''}` : '—'}</Campo>
          </Grid>
          {cliente.cnaesSecundarios?.length ? (
            <Grid size={12}>
              <Campo rotulo={`CNAEs secundários (${cliente.cnaesSecundarios.length})`}>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                  {cliente.cnaesSecundarios.map((c) => (
                    <Tooltip key={c.codigo} title={c.descricao}>
                      <Chip size="small" variant="outlined" label={`${c.codigo} · ${c.descricao}`} />
                    </Tooltip>
                  ))}
                </Stack>
              </Campo>
            </Grid>
          ) : null}
          {cliente.servicosPrestados?.length ? (
            <Grid size={12}>
              <Campo rotulo={`Opções de serviços (${cliente.servicosPrestados.length})`}>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                  {cliente.servicosPrestados.map((s) => (
                    <Chip key={s.codigo} size="small" variant="outlined" label={`${s.codigo}. ${s.descricao}`} />
                  ))}
                </Stack>
              </Campo>
            </Grid>
          ) : null}
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
