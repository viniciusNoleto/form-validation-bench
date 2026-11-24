import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmFieldImports } from './ui/field';
import { HlmInputImports } from './ui/input';
import { formField } from './formField';
import type { FieldRef } from './validatedForm';

@Component({
  selector: 'form-text',
  imports: [HlmFieldImports, HlmInputImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmField [forceInvalid]="!!message()">
      <label hlmFieldLabel>
        {{ label() }}
      </label>

      <input
        hlmInput
        [type]="type()"
        [attr.aria-label]="label()"
        [forceInvalid]="!!message()"
        [value]="value() ?? ''"
        (input)="update($any($event.target).value)"
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
export class FormText {
  readonly field = input.required<FieldRef<string | null | undefined>>();
  readonly label = input<string>();
  readonly type = input<'text' | 'password' | 'email'>('text');

  protected readonly control = formField(this.field);
  protected readonly value = this.control.value;
  protected readonly message = this.control.message;
  protected readonly update = this.control.update;
  protected readonly validate = this.control.validate;
}
