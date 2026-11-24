import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { HlmFieldImports } from './ui/field';
import type { FieldRef } from './validatedForm';

/**
 * Contêiner sem input: só exibe o erro do próprio array.
 * Quem valida o array são as operações addItem/removeItem do formulário.
 */
@Component({
  selector: 'form-list',
  imports: [HlmFieldImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset hlmFieldSet>
      <legend hlmFieldLegend>
        {{ label() }}
      </legend>

      <ng-content />

      @if (message(); as text) {
        <hlm-field-error forceShow [attr.data-field]="label()">
          {{ text }}
        </hlm-field-error>
      }
    </fieldset>
  `,
})
export class FormList {
  readonly field = input.required<FieldRef<unknown[]>>();
  readonly label = input<string>();

  protected readonly message = computed(() => this.field().error());
}
