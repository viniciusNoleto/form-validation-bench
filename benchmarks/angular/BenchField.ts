import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, untracked } from '@angular/core';
import _debounce from 'lodash-es/debounce';
import { HlmInputImports } from '../../src/angular/ui/input';
import { formField } from '../../src/angular/formField';
import type { FieldRef } from '../../src/angular/validatedForm';
import { stats } from './stats';

/** Conta cada atualização da view do campo (o template chama render() a cada atualização). */
function render(name: string, message: string | undefined) {
  stats.updates++;
  if (name === 'f0') stats.trail.push(message ?? null);
  return '';
}

/** Wrapper por tipo, validação no evento: a forma final de src/angular. */
@Component({
  selector: 'bench-field',
  imports: [HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render(field().name, message()) }}
    <label>
      <input hlmInput [attr.aria-label]="field().name" [value]="value() ?? ''" (input)="update($any($event.target).value)" (blur)="validate()" />
      @if (message(); as text) {
        <small role="alert">{{ text }}</small>
      }
    </label>
  `,
})
export class BenchField {
  readonly field = input.required<FieldRef<string>>();
  protected readonly control = formField(this.field);
  protected readonly value = this.control.value;
  protected readonly message = this.control.message;
  protected readonly update = this.control.update;
  protected readonly validate = this.control.validate;
  protected readonly render = render;
}

/** Wrapper por tipo com debounce de 200 ms na digitação; o blur valida na hora. */
@Component({
  selector: 'bench-field-debounce',
  imports: [HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render(field().name, message()) }}
    <label>
      <input hlmInput [attr.aria-label]="field().name" [value]="value() ?? ''" (input)="update($any($event.target).value)" (blur)="blur()" />
      @if (message(); as text) {
        <small role="alert">{{ text }}</small>
      }
    </label>
  `,
})
export class BenchFieldDebounce {
  readonly field = input.required<FieldRef<string>>();
  protected readonly control = formField(this.field);
  protected readonly value = this.control.value;
  protected readonly message = this.control.message;
  protected readonly render = render;

  private readonly validateLater = _debounce(() => this.control.validate(), 200);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.validateLater.cancel());
  }

  protected update(value: string) {
    this.field().setValue(value);
    this.validateLater();
  }

  protected blur() {
    this.validateLater.cancel();
    this.control.validate();
  }
}

/** Campo da variante O: só grava o valor na digitação (quem valida é o observador); valida no blur. */
@Component({
  selector: 'bench-field-observed',
  imports: [HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render(field().name, message()) }}
    <label>
      <input hlmInput [attr.aria-label]="field().name" [value]="value() ?? ''" (input)="field().setValue($any($event.target).value)" (blur)="validate()" />
      @if (message(); as text) {
        <small role="alert">{{ text }}</small>
      }
    </label>
  `,
})
export class BenchFieldObserved {
  readonly field = input.required<FieldRef<string>>();
  protected readonly control = formField(this.field);
  protected readonly value = this.control.value;
  protected readonly message = this.control.message;
  protected readonly validate = this.control.validate;
  protected readonly render = render;
}

/**
 * Variante WN: wrapper que observa o próprio valor (um effect sobre value()), em vez de validar no
 * evento; é o mecanismo do React (efeito sobre o valor) e da variante FWN do Vue. Valida também no blur.
 */
@Component({
  selector: 'bench-field-effect',
  imports: [HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render(field().name, message()) }}
    <label>
      <input hlmInput [attr.aria-label]="field().name" [value]="value() ?? ''" (input)="field().setValue($any($event.target).value)" (blur)="validate()" />
      @if (message(); as text) {
        <small role="alert">{{ text }}</small>
      }
    </label>
  `,
})
export class BenchFieldEffect {
  readonly field = input.required<FieldRef<string>>();
  protected readonly control = formField(this.field);
  protected readonly value = this.control.value;
  protected readonly message = this.control.message;
  protected readonly validate = this.control.validate;
  protected readonly render = render;

  constructor() {
    let first = true; // nunca na montagem
    effect(() => {
      this.value();
      if (first) { first = false; return; }
      untracked(() => this.control.validate());
    });
  }
}

/**
 * Variante F: frame genérico. Recebe o FieldRef, exibe o erro e repassa valor e gatilho ao núcleo
 * projetado (ng-content), que o obtém por injeção de dependência: o provide/inject do Angular.
 */
@Component({
  selector: 'bench-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ render(field().name, message()) }}
    <label>
      <ng-content />
      @if (message(); as text) {
        <small role="alert">{{ text }}</small>
      }
    </label>
  `,
})
export class BenchFrame {
  readonly field = input.required<FieldRef<string>>();
  readonly control = formField(this.field);
  protected readonly message = this.control.message;
  /** Conta a atualização do frame; a trilha de mensagens fica no núcleo, que atualiza a cada tecla. */
  protected render(_name: string, _message: string | undefined) {
    stats.updates++;
    return '';
  }
}

/** Núcleo do frame: só o input, ligado ao frame que o contém. */
@Component({
  selector: 'bench-core',
  imports: [HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ count() }}
    <input hlmInput [attr.aria-label]="label()" [value]="frame.control.value() ?? ''" (input)="frame.control.update($any($event.target).value)" (blur)="frame.control.validate()" />
  `,
})
export class BenchCore {
  readonly label = input.required<string>();
  protected readonly frame = inject(BenchFrame);
  protected count() {
    stats.updates++;
    // trilha da mensagem do campo f0 a cada atualização do núcleo, sem criar dependência do erro
    if (this.label() === 'f0') stats.trail.push(untracked(() => this.frame.control.message()) ?? null);
    return '';
  }
}
