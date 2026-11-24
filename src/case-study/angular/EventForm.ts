import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormCheckboxGroup } from '../../angular/FormCheckboxGroup';
import { FormList } from '../../angular/FormList';
import { FormNumber } from '../../angular/FormNumber';
import { FormText } from '../../angular/FormText';
import { FormTextarea } from '../../angular/FormTextarea';
import { HlmButtonImports } from '../../angular/ui/button';
import { validatedForm } from '../../angular/validatedForm';
import { descriptionSchema, eventFormOptions, eventSchema, type EventForm as EventFormData } from '../eventSchema';

const CATEGORY_OPTIONS = [
  { value: 'music', label: 'Música' },
  { value: 'tech', label: 'Tecnologia' },
];

@Component({
  selector: 'event-form',
  imports: [FormText, FormTextarea, FormNumber, FormCheckboxGroup, FormList, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form novalidate (submit)="submit($event)">
      <form-text label="Nome" [field]="event.field('name')" />

      <form-text label="E-mail" [field]="event.field('email')" />

      <form-text label="Senha" type="password" [field]="event.field('password')" />

      <form-text label="Confirmação" type="password" [field]="event.field('password_confirmation')" />

      <form-number label="Capacidade" [field]="event.field('capacity')" />

      <form-text label="CEP" [field]="event.field('address.zip')" />

      <form-text label="Cidade" [field]="event.field('address.city')" />

      <form-checkbox-group label="Categorias" [options]="categoryOptions" [field]="event.field('categories')" />

      <form-list label="Descrições" [field]="event.field('descriptions')">
        @for (item of event.form().descriptions; track item.uid; let index = $index) {
          <div>
            <form-text [label]="'Título ' + (index + 1)" [field]="event.field('descriptions[' + index + '].title')" />

            <form-textarea [label]="'Conteúdo ' + (index + 1)" [field]="event.field('descriptions[' + index + '].content')" />

            <button hlmBtn variant="ghost" type="button" (click)="event.removeItem('descriptions', index)">
              Remover {{ index + 1 }}
            </button>
          </div>
        }

        <button hlmBtn variant="outline" type="button" (click)="event.addItem('descriptions', descriptionSchema.getDefault())">
          Adicionar descrição
        </button>
      </form-list>

      <button hlmBtn type="submit">
        Salvar
      </button>
    </form>
  `,
})
export class EventForm {
  readonly submitted = output<EventFormData>();

  protected readonly event = validatedForm(eventSchema, eventFormOptions);
  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly descriptionSchema = descriptionSchema;

  protected submit(domEvent: Event) {
    domEvent.preventDefault();
    if (!this.event.validateForm()) return;
    this.submitted.emit(eventSchema.cast(this.event.form()));
  }
}
