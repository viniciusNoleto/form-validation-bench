import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BenchField, BenchFieldDebounce } from './BenchField';
import type { BenchForm as BenchFormApi } from './forms';

@Component({
  selector: 'bench-form',
  imports: [BenchField, BenchFieldDebounce],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
}
