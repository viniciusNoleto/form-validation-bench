import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Alert, Code, Container, Grid, List, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { BasicForm } from '../../src/react/BasicForm';
import { STEPS, highlight } from '../guide';

export function App() {
  const [mode, setMode] = useState<'root' | 'naive'>('root');
  const [submitted, setSubmitted] = useState<unknown>(null);
  const [debugEl, setDebugEl] = useState<HTMLDivElement | null>(null);

  return (
    <Container size="xl" py="lg">
      <Stack gap="md">
        <Title order={2}>React + Mantine · árvore de erros</Title>

        <List type="ordered" size="sm" spacing={4}>
          {STEPS.map((step) => <List.Item key={step}>{step}</List.Item>)}
        </List>

        <SegmentedControl
          value={mode}
          onChange={(v) => { setMode(v as 'root' | 'naive'); setSubmitted(null); }}
          data={[{ value: 'root', label: 'com :root (final)' }, { value: 'naive', label: 'árvore ingênua' }]}
          w={360}
        />

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <BasicForm
              key={mode}
              rootSuffix={mode === 'root'}
              onSubmit={setSubmitted}
              renderDebug={({ state, errors }) => debugEl && createPortal(
                <Stack gap="sm">
                  <Text fw={600}>Árvore de erros</Text>
                  <Code block>
                    {highlight(JSON.stringify(errors, null, 2)).map(({ line, root }, i) => (
                      <span key={i} style={root ? { background: 'var(--mantine-color-yellow-2)' } : undefined}>{line}{'\n'}</span>
                    ))}
                  </Code>
                  <Text fw={600}>Estado</Text>
                  <Code block>{JSON.stringify(state, null, 2)}</Code>
                </Stack>,
                debugEl,
              )}
            />

            {submitted ? <Alert mt="md" color="green" title="Enviado">{JSON.stringify(submitted)}</Alert> : null}
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="md" pos="sticky" top={16}>
              <div ref={setDebugEl} />
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
