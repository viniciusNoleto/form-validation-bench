import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmFieldImports } from './ui/field';
import { HlmInputImports } from './ui/input';
import { formField } from './formField';
import type { FieldRef } from './validatedForm';

@Component({
  selector: 'form-number',
  imports: [HlmFieldImports, HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmField [forceInvalid]="!!message()">
      <label hlmFieldLabel>
        {{ label() }}
      </label>

      <input
        hlmInput
        inputmode="numeric"
        [attr.aria-label]="label()"
        [forceInvalid]="!!message()"
        [value]="value() ?? ''"
        (input)="change($any($event.target).value)"
        (blur)="validate()"
      />

      @if (message(); as text) {
        <hlm-field-error forceShow [attr.data-field]="label()">
          {{ text }}
        </hlm-field-error>
      }
    </div>
  `,
})
export class FormNumber {
  readonly field = input.required<FieldRef<number | null | undefined>>();
  readonly label = input<string>();

  protected readonly control = formField(this.field);
  protected readonly value = this.control.value;
  protected readonly message = this.control.message;
  protected readonly validate = this.control.validate;

  /** Texto vazio vira null; o resto vira número (o esquema acusa o que não for). */
  protected change(raw: string) {
    this.control.update(raw === '' ? null : Number(raw));
  }
}
