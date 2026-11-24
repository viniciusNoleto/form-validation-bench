import '@mantine/core/styles.css';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { App } from './App';

createRoot(document.getElementById('app')!).render(
  <MantineProvider>
    <App />
  </MantineProvider>,
);
