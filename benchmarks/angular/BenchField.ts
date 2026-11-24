import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
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
