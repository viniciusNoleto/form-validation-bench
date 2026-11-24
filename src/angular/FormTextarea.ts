import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmFieldImports } from './ui/field';
import { HlmTextareaImports } from './ui/textarea';
import { formField } from './formField';
import type { FieldRef } from './validatedForm';

@Component({
  selector: 'form-textarea',
  imports: [HlmFieldImports, HlmTextareaImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmField [forceInvalid]="!!message()">
      <label hlmFieldLabel>
        {{ label() }}
      </label>

      <textarea
        hlmTextarea
        [attr.aria-label]="label()"
        [forceInvalid]="!!message()"
        [value]="value() ?? ''"
        (input)="update($any($event.target).value)"
        (blur)="validate()"
      ></textarea>

      @if (message(); as text) {
        <hlm-field-error forceShow [attr.data-field]="label()">
          {{ text }}
        </hlm-field-error>
      }
    </div>
  `,
})
export class FormTextarea {
  readonly field = input.required<FieldRef<string | null | undefined>>();
  readonly label = input<string>();

  protected readonly control = formField(this.field);
  protected readonly value = this.control.value;
  protected readonly message = this.control.message;
  protected readonly update = this.control.update;
  protected readonly validate = this.control.validate;
}
