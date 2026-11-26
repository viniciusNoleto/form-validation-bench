// Bibliotecas no roteiro Angular (seção 8.5 do artigo). O pacote oficial @angular/forms é de longe o
// mais usado e traz duas APIs: Reactive Forms e Signal Forms; a terceira é o ngx-formly, a biblioteca
// de formulário Angular de terceiros mais baixada do npm (26/10 a 24/11/2026). Todas validam com o
// MESMO esquema Yup, do jeito que cada documentação recomenda:
// - Reactive Forms: um FormControl por campo, com um validador que valida o caminho no esquema.
// - Signal Forms: form(model, p => validateStandardSchema(p, esquema)), o esquema do formulário
//   inteiro pelo Standard Schema (assíncrono no Yup), e [formField] no input.
// - ngx-formly: <formly-form> com um tipo de campo próprio e um validador por campo que valida o
//   caminho no esquema (o Formly roda sobre Reactive Forms).
// Exibição igual em todas, e igual à do padrão: o erro aparece depois que o usuário alterou o campo
// ou saiu dele (flag local do campo), nunca na montagem.
import { ChangeDetectionStrategy, Component, EnvironmentInjector, createEnvironmentInjector, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { form as signalForm, validateStandardSchema, FormField, type FieldTree } from '@angular/forms/signals';
import { FieldType, FormlyAttributes, type FieldTypeConfig, type FormlyFieldConfig } from '@ngx-formly/core';
import type * as yup from 'yup';
import { HlmInputImports } from '../../src/angular/ui/input';
import { validateAtSync } from '../../src/core/formCore';
import { countedSchema } from '../shared/countedSchema';
import { stats } from './stats';

const counted = (schema: yup.ObjectSchema<any>) => countedSchema(schema, (kind) => {
  stats.validations++;
  if (kind === 'whole') stats.whole++;
});

function render(name: string, message: string | undefined) {
  stats.updates++;
  if (name === 'f0') stats.trail.push(message ?? null);
  return '';
}

// ===== Reactive Forms =====
export function reactiveGroup(schema: yup.ObjectSchema<any>) {
  const s = counted(schema);
  const defaults = schema.getDefault();
  const group: FormGroup = new FormGroup(Object.fromEntries(Object.keys(schema.fields).map((key) => [key, new FormControl(defaults[key], {
    validators: (control) => {
      const message = validateAtSync(s, key, { ...(control.parent?.getRawValue() ?? defaults), [key]: control.value });
      return message ? { yup: message } : null;
    },
  })])));
  return group;
}

@Component({
  selector: 'bench-reactive',
  imports: [ReactiveFormsModule, HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render(name(), shown()) }}
    <label>
      <input hlmInput [attr.aria-label]="name()" [formControl]="control()" (input)="touched = true" (blur)="touched = true" />
      @if (shown(); as text) {
        <small role="alert">{{ text }}</small>
      }
    </label>
  `,
})
export class BenchReactive {
  readonly control = input.required<FormControl>();
  readonly name = input.required<string>();
  protected touched = false;
  protected shown() { return this.touched ? (this.control().errors?.['yup'] as string | undefined) : undefined; }
  protected readonly render = render;
}

// ===== Signal Forms =====
/** O formulário vive num injetor próprio, destruído com ele: os effects e resources das Signal Forms não acumulam entre tarefas. */
export function signalTree(schema: yup.ObjectSchema<any>) {
  const s = counted(schema);
  const model = signal(schema.getDefault());
  const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
  const tree = signalForm(model, (p) => { validateStandardSchema(p as any, s as any); }, { injector }) as FieldTree<any>;
  return { tree, destroy: () => injector.destroy() };
}

@Component({
  selector: 'bench-signal',
  imports: [FormField, HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render(name(), shown()) }}
    <label>
      <input hlmInput [attr.aria-label]="name()" [formField]="field()" (input)="touched = true" (blur)="touched = true" />
      @if (shown(); as text) {
        <small role="alert">{{ text }}</small>
      }
    </label>
  `,
})
export class BenchSignal {
  readonly field = input.required<FieldTree<string>>();
  readonly name = input.required<string>();
  protected touched = false;
  protected shown() {
    if (!this.touched) return undefined;
    const first = this.field()().errors()[0] as { message?: string; issue?: { message?: string } } | undefined;
    return first?.message ?? first?.issue?.message;
  }
  protected readonly render = render;
}

// ===== ngx-formly =====
export function formlyConfig(schema: yup.ObjectSchema<any>) {
  const s = counted(schema);
  const model: Record<string, unknown> = schema.getDefault();
  const last: Record<string, string | undefined> = {};
  const fields: FormlyFieldConfig[] = Object.keys(schema.fields).map((key) => ({
    key,
    type: 'bench',
    validators: {
      yup: {
        expression: (control: { value: unknown; parent?: { getRawValue(): object } | null }) => {
          last[key] = validateAtSync(s, key, { ...(control.parent?.getRawValue() ?? model), [key]: control.value });
          return !last[key];
        },
        message: () => last[key] ?? '',
      },
    },
  }));
  return { group: new FormGroup({}), model, fields, last };
}

@Component({
  selector: 'bench-formly-type',
  imports: [ReactiveFormsModule, FormlyAttributes, HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render(name, shown()) }}
    <label>
      <input hlmInput [attr.aria-label]="name" [formControl]="formControl" [formlyAttributes]="field" (input)="touched = true" (blur)="touched = true" />
      @if (shown(); as text) {
        <small role="alert">{{ text }}</small>
      }
    </label>
  `,
})
export class BenchFormlyType extends FieldType<FieldTypeConfig> {
  protected touched = false;
  protected get name() { return String(this.field.key); }
  protected shown() {
    if (!this.touched || !this.formControl.errors?.['yup']) return undefined;
    const message = this.field.validators?.['yup']?.message;
    return typeof message === 'function' ? (message(null, this.field) as string) : undefined;
  }
  protected readonly render = render;
}
