import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BenchField, BenchFieldDebounce } from './BenchField';
import type { BenchForm as BenchFormApi } from './forms';
import { stats } from './stats';

/** Conta cada atualização da view do formulário pai. */
function renderForm() {
  stats.formUpdates++;
  return '';
}

@Component({
  selector: 'bench-form',
  imports: [BenchField, BenchFieldDebounce],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    {{ renderForm() }}
    <form>
      @for (key of keys(); track key) {
        @if (debounce()) {
          <bench-field-debounce [field]="form().field(key)" />
        } @else {
          <bench-field [field]="form().field(key)" />
        }
      }
    </form>
  `,
})
export class BenchForm {
  readonly form = input.required<BenchFormApi>();
  readonly keys = input.required<string[]>();
  readonly debounce = input(false);
  protected readonly renderForm = renderForm;
}
