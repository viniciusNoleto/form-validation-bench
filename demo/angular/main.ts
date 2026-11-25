import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './App';

// Sem zone.js, como nos testes e nos benchmarks: a detecção de mudanças é dirigida por signals.
bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] }).catch((error) => console.error(error));
