import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormCheckboxGroup } from '../../../src/angular/FormCheckboxGroup';
import { FormList } from '../../../src/angular/FormList';
import { FormNumber } from '../../../src/angular/FormNumber';
import { FormText } from '../../../src/angular/FormText';
import { FormTextarea } from '../../../src/angular/FormTextarea';
import { HlmButtonImports } from '../../../src/angular/ui/button';
import { descriptionSchema, basicFormOptions, basicSchema, type BasicFormValues } from './basicSchema';
import { getDefaults } from './schemaForm';
import { schemaFormAngular } from './schemaFormAngular';

const CATEGORY_OPTIONS = [
  { value: 'music', label: 'Música' },
  { value: 'tech', label: 'Tecnologia' },
];

/** O formulário do estudo de caso com Zod, usando os mesmos wrappers de src/angular da versão com Yup. */
@Component({
  selector: 'basic-form-zod',
  imports: [FormText, FormTextarea, FormNumber, FormCheckboxGroup, FormList, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form novalidate (submit)="submit($event)">
      <form-text label="Nome" [field]="basic.field('name')" />
      <form-text label="E-mail" [field]="basic.field('email')" />
      <form-text label="Senha" type="password" [field]="basic.field('password')" />
      <form-text label="Confirmação" type="password" [field]="basic.field('password_confirmation')" />
      <form-number label="Capacidade" [field]="basic.field('capacity')" />
      <form-text label="CEP" [field]="basic.field('address.zip')" />
      <form-text label="Cidade" [field]="basic.field('address.city')" />
      <form-checkbox-group label="Categorias" [options]="categoryOptions" [field]="basic.field('categories')" />

      <form-list label="Descrições" [field]="basic.field('descriptions')">
        @for (item of basic.form().descriptions; track item.uid; let index = $index) {
          <div>
            <form-text [label]="'Título ' + (index + 1)" [field]="basic.field('descriptions.' + index + '.title')" />
            <form-textarea [label]="'Conteúdo ' + (index + 1)" [field]="basic.field('descriptions.' + index + '.content')" />
            <button hlmBtn variant="ghost" type="button" (click)="basic.removeItem('descriptions', index)">
              Remover {{ index + 1 }}
            </button>
          </div>
        }

        <button hlmBtn variant="outline" type="button" (click)="basic.addItem('descriptions', newDescription())">
          Adicionar descrição
        </button>
      </form-list>

      <button hlmBtn type="submit">
        Salvar
      </button>
    </form>
  `,
})
export class BasicFormAngular {
  readonly submitted = output<BasicFormValues>();

  protected readonly basic = schemaFormAngular(basicSchema, basicFormOptions);
  protected readonly categoryOptions = CATEGORY_OPTIONS;

  protected newDescription() {
    return getDefaults(descriptionSchema);
  }

  protected submit(domEvent: Event) {
    domEvent.preventDefault();
    if (!this.basic.validateForm()) return;
    this.submitted.emit(basicSchema.parse(this.basic.form()));
  }
}
