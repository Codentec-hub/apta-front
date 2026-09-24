'use client';

import * as React from 'react';
import Box from '@mui/material/Box';

const HEIGHT = 40;
const WIDTH = 90;

export interface LogoProps {
  height?: number;
  width?: number;
}

export function Logo({ height = HEIGHT, width = WIDTH }: LogoProps): React.JSX.Element {
  return <Box alt="Apta Contabilidade" component="img" height={height} src="/apta-logo.png" width={width} />;
}
