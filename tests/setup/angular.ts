// Ambiente de teste do Angular: zoneless (sem zone.js), detecção de mudança dirigida por signals.
import '@angular/compiler';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed({ zoneless: true });
