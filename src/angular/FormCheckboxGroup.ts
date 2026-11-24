import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HlmCheckboxImports } from './ui/checkbox';
import { HlmFieldImports } from './ui/field';
import { formField } from './formField';
import type { FieldRef } from './validatedForm';

export type CheckboxOption = { value: string; label: string };

@Component({
  selector: 'form-checkbox-group',
  imports: [HlmFieldImports, HlmCheckboxImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset hlmFieldSet>
      <legend hlmFieldLegend>
        {{ label() }}
      </legend>

      @for (option of options(); track option.value) {
        <div hlmField orientation="horizontal">
          <hlm-checkbox
            [inputId]="field().name + '-' + option.value"
            [checked]="(value() ?? []).includes(option.value)"
            [forceInvalid]="!!message()"
            (checkedChange)="toggle(option.value, $event)"
          />

          <label hlmFieldLabel [for]="field().name + '-' + option.value">
            {{ option.label }}
          </label>
        </div>
      }

      @if (message(); as text) {
        <hlm-field-error forceShow [attr.data-field]="label()">
          {{ text }}
        </hlm-field-error>
      }
    </fieldset>
  `,
})
export class FormCheckboxGroup {
  readonly field = input.required<FieldRef<string[] | undefined>>();
  readonly label = input<string>();
  readonly options = input.required<CheckboxOption[]>();

  protected readonly control = formField(this.field);
  protected readonly value = this.control.value;
  protected readonly message = this.control.message;

  /** Emite o array novo a cada marcação, como o Checkbox do PrimeVue com array como modelo. */
  protected toggle(option: string, checked: boolean) {
    const current = this.value() ?? [];
    this.control.update(checked ? [...current, option] : current.filter((value) => value !== option));
  }
}
