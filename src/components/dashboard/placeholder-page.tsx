import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface PlaceholderPageProps {
  titulo: string;
  fase: string;
  descricao: string;
}

export function PlaceholderPage({ titulo, fase, descricao }: PlaceholderPageProps): React.JSX.Element {
  return (
    <Stack spacing={1} sx={{ maxWidth: '620px' }}>
      <Typography
        color="primary.main"
        sx={{ fontFamily: 'var(--font-roboto-mono, monospace)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        {fase} · em construção
      </Typography>
      <Typography variant="h4">{titulo}</Typography>
      <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {descricao}
      </Typography>
    </Stack>
  );
}
