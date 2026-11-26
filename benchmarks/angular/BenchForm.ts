import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BenchCore, BenchField, BenchFieldDebounce, BenchFieldEffect, BenchFieldObserved, BenchFrame } from './BenchField';
import { FormlyForm } from '@ngx-formly/core';
import { BenchReactive, BenchSignal } from './libs';
import type { BenchForm as BenchFormApi } from './forms';
import { stats } from './stats';

/** Conta cada atualização da view do formulário pai. */
function renderForm() {
  stats.formUpdates++;
  return '';
}

@Component({
  selector: 'bench-form',
  imports: [BenchField, BenchFieldDebounce, BenchFieldObserved, BenchFieldEffect, BenchFrame, BenchCore, BenchReactive, BenchSignal, FormlyForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ renderForm() }}
    @if (form().kind === 'formly') {
      <form><formly-form [form]="form().formly!.group" [fields]="form().formly!.fields" [model]="form().formly!.model" /></form>
    } @else {
    <form>
      @for (key of keys(); track key) {
        @if (debounce()) {
          <bench-field-debounce [field]="form().field(key)" />
        } @else if (form().kind === 'observed') {
          <bench-field-observed [field]="form().field(key)" />
        } @else if (form().kind === 'effect') {
          <bench-field-effect [field]="form().field(key)" />
        } @else if (form().kind === 'reactive') {
          <bench-reactive [control]="$any(form().group!.controls[key])" [name]="key" />
        } @else if (form().kind === 'signal') {
          <bench-signal [field]="$any(form().tree!)[key]" [name]="key" />
        } @else if (form().kind === 'frame') {
          <bench-frame [field]="form().field(key)"><bench-core [label]="key" /></bench-frame>
        } @else {
          <bench-field [field]="form().field(key)" />
        }
      }
    </form>
    }
  `,
})
export class BenchForm {
  readonly form = input.required<BenchFormApi>();
  readonly keys = input.required<string[]>();
  readonly debounce = input(false);
  protected readonly renderForm = renderForm;
}
