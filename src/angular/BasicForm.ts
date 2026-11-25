import { ChangeDetectionStrategy, Component, input, output, type OnInit } from '@angular/core';
import { FormCheckboxGroup } from './FormCheckboxGroup';
import { FormList } from './FormList';
import { FormNumber } from './FormNumber';
import { FormText } from './FormText';
import { FormTextarea } from './FormTextarea';
import { HlmButtonImports } from './ui/button';
import { validatedForm, type ValidatedForm } from './validatedForm';
import { descriptionSchema, basicFormOptions, basicSchema, type BasicFormValues } from '../schemas/basicSchema';

const CATEGORY_OPTIONS = [
  { value: 'music', label: 'Música' },
  { value: 'tech', label: 'Tecnologia' },
];

@Component({
  selector: 'basic-form',
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
            <form-text [label]="'Título ' + (index + 1)" [field]="basic.field('descriptions[' + index + '].title')" />

            <form-textarea [label]="'Conteúdo ' + (index + 1)" [field]="basic.field('descriptions[' + index + '].content')" />

            <button hlmBtn variant="ghost" type="button" (click)="basic.removeItem('descriptions', index)">
              Remover {{ index + 1 }}
            </button>
          </div>
        }

        <button hlmBtn variant="outline" type="button" (click)="basic.addItem('descriptions', descriptionSchema.getDefault())">
          Adicionar descrição
        </button>
      </form-list>

      <button hlmBtn type="submit">
        Salvar
      </button>
    </form>
  `,
})
export class BasicForm implements OnInit {
  /** false = árvore ingênua, sem a chave :root (só para a demonstração da seção 7.2), como nas versões React e Vue */
  readonly rootSuffix = input(true);
  readonly submitted = output<BasicFormValues>();
  /** Entrega o formulário criado, para a demo exibir estado e erros (o renderDebug do React, o slot debug do Vue). */
  readonly formReady = output<ValidatedForm<BasicFormValues>>();

  /** Criado quando a entrada rootSuffix já está disponível. */
  protected basic!: ValidatedForm<BasicFormValues>;

  ngOnInit() {
    this.basic = validatedForm(basicSchema, { ...basicFormOptions, rootSuffix: this.rootSuffix() });
    this.formReady.emit(this.basic);
  }

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly descriptionSchema = descriptionSchema;

  protected submit(domEvent: Event) {
    domEvent.preventDefault();
    if (!this.basic.validateForm()) return;
    this.submitted.emit(basicSchema.cast(this.basic.form()));
  }
}
