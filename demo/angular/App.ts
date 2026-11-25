import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { BasicForm } from '../../src/angular/BasicForm';
import type { ValidatedForm } from '../../src/angular/validatedForm';
import type { BasicFormValues } from '../../src/schemas/basicSchema';
import { HlmButtonImports } from '../../src/angular/ui/button';
import { STEPS, highlight } from '../guide';

type Mode = 'root' | 'naive';

/** Demo do estudo de caso em Angular (spartan-ng, signals, sem zone.js), igual às de React e Vue. */
@Component({
  selector: 'demo-app',
  imports: [BasicForm, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <h2>Angular + spartan-ng · árvore de erros</h2>

      <ol class="steps">
        @for (step of steps; track step) {
          <li>{{ step }}</li>
        }
      </ol>

      <div class="modes">
        @for (option of modes; track option.value) {
          <button hlmBtn type="button" [class.selected]="mode() === option.value" (click)="setMode(option.value)">
            {{ option.label }}
          </button>
        }
      </div>

      <div class="grid">
        <section class="form-col">
          <!-- o @if recria o formulário ao trocar de modo, como o key nas demos React e Vue -->
          @if (mode() === 'root') {
            <basic-form [rootSuffix]="true" (submitted)="submitted.set($event)" (formReady)="active.set($event)" />
          } @else {
            <basic-form [rootSuffix]="false" (submitted)="submitted.set($event)" (formReady)="active.set($event)" />
          }

          @if (submitted(); as data) {
            <p class="sent">Enviado: {{ json(data) }}</p>
          }
        </section>

        <aside class="debug">
          <strong>Árvore de erros</strong>
          <pre>@for (item of errorLines(); track $index) {<span [class.root]="item.root">{{ item.line }}
</span>}</pre>

          <strong>Estado</strong>
          <pre>{{ stateJson() }}</pre>
        </aside>
      </div>
    </main>
  `,
  styles: `
    :host { font-family: system-ui, sans-serif; display: block; }
    .page { max-width: 1280px; margin: 0 auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .steps { font-size: 14px; margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; }
    .modes { display: flex; gap: 8px; }
    .modes .selected { background: #0f172a; color: #fff; border-color: #0f172a; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
    .sent { color: #047857; font-size: 14px; }
    .debug { position: sticky; top: 16px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 48px); overflow: auto; }
    .debug pre { background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 12px; margin: 0; }
    .debug .root { background: #fef08a; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class App {
  protected readonly steps = STEPS;
  protected readonly modes: { value: Mode; label: string }[] = [
    { value: 'root', label: 'com :root (final)' },
    { value: 'naive', label: 'árvore ingênua' },
  ];
  protected readonly mode = signal<Mode>('root');
  protected readonly submitted = signal<unknown>(null);

  /** O formulário montado no momento, entregue pela saída formReady do BasicForm. */
  protected readonly active = signal<ValidatedForm<BasicFormValues> | null>(null);
  protected readonly errorLines = computed(() => highlight(JSON.stringify(this.active()?.errors() ?? {}, null, 2)));
  protected readonly stateJson = computed(() => JSON.stringify(this.active()?.form() ?? {}, null, 2));

  protected setMode(mode: Mode) {
    this.mode.set(mode);
    this.submitted.set(null);
  }

  protected json(value: unknown) {
    return JSON.stringify(value);
  }
}
