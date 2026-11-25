import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked, type OnInit, type WritableSignal } from '@angular/core';
import _debounce from 'lodash-es/debounce';
import type * as yup from 'yup';
import type { ZodType } from 'zod';
import { validateAtLocal, normalizePath } from '../../zod/zodPartial.mjs';

export const astats = {
  frameRenders: 0,
  validations: 0,
  trail: [] as (string | null)[],
  reset() { this.frameRenders = 0; this.validations = 0; this.trail = []; },
};

type Values = Record<string, string>;
type Errors = Record<string, string[]>;
export type Rules = (field: string) => void;
export type UseRules = (schema: any, form: WritableSignal<Values>, errors: WritableSignal<Errors>) => Rules;

// ===== A: cópia da forma anterior (Yup), como no Vue: limpa o erro e regrava no catch assíncrono =====
export const useRulesA: UseRules = (schema: yup.ObjectSchema<any>, form, errors) => (field) => {
  astats.validations++;
  errors.update((e) => ({ ...e, [field]: [] }));
  schema.validateAt(field, form()).catch((error: yup.ValidationError) => {
    if (field === error.path) errors.update((e) => ({ ...e, [error.path!]: error.errors }));
  });
};

// ===== B: proposta (Zod síncrono, gravação única e só quando a mensagem muda) =====
export const useRulesB: UseRules = (schema: ZodType, form, errors) => (field) => {
  astats.validations++;
  const key = normalizePath(field);
  const message = validateAtLocal(schema, key, form());
  const next = message ? [message] : [];
  const current = untracked(errors)[key];
  const same = Array.isArray(current) && current.length === next.length && current.every((m, i) => m === next[i]);
  if (!same) errors.update((e) => ({ ...e, [key]: next }));
};

/**
 * Frame: dono do valor; observa o valor (effect, o equivalente ao watch do Vue) e dispara a validação
 * do próprio campo, com debounce opcional. O input projetado o obtém por injeção de dependência.
 */
@Component({
  selector: 'initial-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render() }}
    <label>
      <ng-content />
      @for (m of messages(); track $index) {
        <span role="alert">{{ m }}</span>
      }
    </label>
  `,
})
export class Frame {
  readonly rules = input.required<Rules>();
  readonly name = input.required<string>();
  readonly value = input<string>('');
  readonly errors = input<string[]>([]);
  readonly debounce = input(200);
  readonly valueChange = output<string>();

  readonly validate = computed(() => {
    const rules = this.rules();
    const name = this.name();
    const run = () => rules(name);
    return this.debounce() ? _debounce(run, this.debounce()) : run;
  });
  protected readonly messages = computed(() => this.errors().filter((m) => typeof m === 'string'));

  constructor() {
    let first = true; // como o watch do Vue: não dispara na montagem
    effect(() => {
      this.value();
      if (first) { first = false; return; }
      untracked(() => this.validate()());
    });
    inject(DestroyRef).onDestroy(() => (untracked(this.validate) as { cancel?: () => void }).cancel?.());
  }

  protected render() {
    astats.frameRenders++;
    if (this.name() === 'f0') astats.trail.push(untracked(this.messages)[0] ?? null);
    return '';
  }
}

@Component({
  selector: 'initial-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input [attr.aria-label]="label()" [value]="frame.value()" (input)="frame.valueChange.emit($any($event.target).value)" (blur)="frame.validate()()" />`,
})
export class Input {
  readonly label = input.required<string>();
  protected readonly frame = inject(Frame);
}

@Component({
  selector: 'initial-form',
  imports: [Frame, Input],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form>
      @for (key of keys(); track key) {
        <initial-frame [rules]="rules" [name]="key" [value]="form()[key]" (valueChange)="set(key, $event)" [errors]="errors()[key] ?? []" [debounce]="debounce()">
          <initial-input [label]="key" />
        </initial-frame>
      }
    </form>
  `,
})
export class Form implements OnInit {
  readonly useRules = input.required<UseRules>();
  readonly schema = input.required<unknown>();
  readonly defaults = input.required<Values>();
  readonly keys = input.required<string[]>();
  readonly debounce = input(200);

  protected readonly form = signal<Values>({});
  protected readonly errors = signal<Errors>({});
  protected rules: Rules = () => {};

  ngOnInit() {
    this.form.set({ ...this.defaults() });
    this.rules = this.useRules()(this.schema(), this.form, this.errors);
  }

  protected set(key: string, value: string) {
    this.form.update((f) => ({ ...f, [key]: value }));
  }
}
