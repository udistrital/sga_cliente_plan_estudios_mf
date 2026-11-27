
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';

import {
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { Subscription } from 'rxjs';

import {
  FormParams,
  Param
} from 'src/app/models/define-form-fields';

import {
  LangChangeEvent,
  TranslateService
} from '@ngx-translate/core';

@Component({
  selector: 'dinamic-form-group',
  templateUrl: './dinamic-form-group.component.html',
  styleUrls: ['./dinamic-form-group.component.scss'],
  standalone: false
})
export class DinamicFormGroupComponent
  implements OnChanges, OnDestroy {

  @Input() defineForm!: FormParams;

  @Output() subsChanges = new EventEmitter<Object>();
  @Output() createdForm = new EventEmitter<FormGroup>();
  @Output() updatedForm = new EventEmitter<FormGroup>();

  formFields: string[] = [];
  formGroup!: FormGroup;

  builded = false;

  private formSubscriptions = new Subscription();
  private translateSubscription?: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {
    this.translateSubscription =
      this.translate.onLangChange.subscribe(
        (_event: LangChangeEvent) => {
          if (this.defineForm) {
            this.traducePlease(this.defineForm);
          }
        }
      );
  }

  // --------------------------------------------------
  // Cambios en el formulario recibido
  // --------------------------------------------------

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defineForm'] && this.defineForm) {
      this.builded = false;

      this.formSubscriptions.unsubscribe();
      this.formSubscriptions = new Subscription();

      this.formFields = Object.keys(this.defineForm);

      this.formGroup = this.buildForm(this.defineForm);

      this.traducePlease(this.defineForm);

      this.suscribeToForm(this.defineForm, this.formGroup);

      this.builded = true;
    }
  }

  // --------------------------------------------------
  // Identificar campos reales
  // --------------------------------------------------

  isField(field: Param): boolean {
    return field.tipo !== 'empty' &&
           field.tipo !== 'separator';
  }

  // --------------------------------------------------
  // Construcción de validadores
  // --------------------------------------------------

  prepareValidators(campo: Param): ValidatorFn[] {
    const validadores: ValidatorFn[] = [
      ...(campo.validador ?? [])
    ];

    if (campo.requerido) {
      validadores.push(Validators.required);
    }

    if (
      campo.tipoDato === 'number' &&
      campo.minimo !== undefined &&
      campo.minimo !== null
    ) {
      validadores.push(
        Validators.min(campo.minimo)
      );
    }

    if (
      campo.tipoDato === 'number' &&
      campo.maximo !== undefined &&
      campo.maximo !== null
    ) {
      validadores.push(
        Validators.max(campo.maximo)
      );
    }

    // Validación específica para archivos.
    if (campo.tipo === 'fileMultiple') {
      validadores.push(
        this.validarArchivos(campo)
      );
    }

    return validadores;
  }

  // --------------------------------------------------
  // Construcción del FormGroup
  // --------------------------------------------------

  buildForm(formParams: FormParams): FormGroup {
    const controles: Record<string, FormControl> = {};

    Object.keys(formParams).forEach(nombre => {
      const campo = formParams[nombre];

      if (!this.isField(campo)) {
        return;
      }

      controles[nombre] = new FormControl(
        campo.valor ?? null,
        this.prepareValidators(campo)
      );
    });

    const formulario = this.formBuilder.group(controles);

    this.createdForm.emit(formulario);

    return formulario;
  }

  // --------------------------------------------------
  // Traducciones
  // --------------------------------------------------

  traducePlease(formParams: FormParams): void {
    Object.keys(formParams).forEach(nombre => {
      if (!this.isField(formParams[nombre])) {
        return;
      }

      const campo = formParams[nombre];

      campo.label = campo.label_i18n
        ? this.translate.instant(campo.label_i18n)
        : '';

      campo.placeholder = campo.placeholder_i18n
        ? this.translate.instant(campo.placeholder_i18n)
        : '';
    });
  }

  // --------------------------------------------------
  // Suscripciones a cambios
  // --------------------------------------------------

  suscribeToForm(
    formParams: FormParams,
    form: FormGroup
  ): void {

    this.formSubscriptions.add(
      form.valueChanges.subscribe(() => {
        this.updatedForm.emit(form);
      })
    );

    Object.keys(formParams).forEach(nombre => {
      const campo = formParams[nombre];

      if (!this.isField(campo)) {
        return;
      }

      const control = form.get(nombre);

      if (!control) {
        return;
      }

      if (campo.notificar) {
        this.formSubscriptions.add(
          control.valueChanges.subscribe(valor => {
            this.subsChanges.emit({
              [nombre]: valor
            });
          })
        );
      }

      if (campo.tipo === 'fileMultiple') {
        this.formSubscriptions.add(
          control.valueChanges.subscribe(valor => {
            if (valor === null) {
              this.resetFileInput(nombre);
              control.updateValueAndValidity({
                emitEvent: false
              });
            }
          })
        );
      }
    });
  }

  // --------------------------------------------------
  // Validación de archivos
  // --------------------------------------------------

  private validarArchivos(campo: Param): ValidatorFn {
    return () => {
      const archivosLocal = campo.archivosLocal ?? [];

      const archivosLinea = campo.archivosLinea ?? [];

      const archivosValidosEnLinea = archivosLinea.length > 0;

      const archivosValidosLocales =
        archivosLocal.some(archivo => !archivo.err);

      const hayArchivos =
        archivosValidosEnLinea || archivosValidosLocales;

      const errores = {
        tipoArchivo: archivosLocal.some(
          archivo => archivo.errTipo
        ),
        tamanoArchivo: archivosLocal.some(
          archivo => archivo.errTam
        )
      };

      const archivosInvalidos = archivosLocal.some(
        archivo => archivo.err
      );

      if (!hayArchivos && campo.requerido) {
        return { required: true };
      }

      if (archivosInvalidos) {
        return {
          archivoInvalido: true,
          ...errores
        };
      }

      return null;
    };
  }

  private actualizarValidacionArchivo(nombre: string): void {
    const control = this.formGroup.get(nombre);

    if (!control) return;

    control.updateValueAndValidity({
      emitEvent: false
    });

    control.markAsTouched();
    control.markAsDirty();
  }

  // --------------------------------------------------
  // Reiniciar archivos
  // --------------------------------------------------

  resetFileInput(nombre: string): void {
    this.defineForm[nombre].archivosLocal = [];
    this.defineForm[nombre].archivosLinea = [];
    this.defineForm[nombre].archivosDelete = [];

    this.defineForm[nombre].validaArchivos = {
      errTipo: false,
      errTam: false
    };
  }

  // --------------------------------------------------
  // Seleccionar archivos
  // --------------------------------------------------

  onChangeSelectFiles(nombre: string, event: Event): void {
    const input = event.target as HTMLInputElement;

    const files = Array.from(input.files ?? []);

    if (!files.length) return;

    const campo = this.defineForm[nombre];

    const nuevosArchivos = files.map(file => ({
      file,
      urlTemp: URL.createObjectURL(file),
      err: false,
      errTipo: false,
      errTam: false
    }));

    campo.archivosLocal = [
      ...(campo.archivosLocal ?? []),
      ...nuevosArchivos
    ];

    this.validarListaArchivos(nombre);

    const nombres = this.passFilesToFormControl(
      campo.archivosLocal ?? [],
      campo.archivosLinea ?? []
    );

    this.formGroup.patchValue({
      [nombre]: nombres
    });

    this.actualizarValidacionArchivo(nombre);

    // Permite volver a seleccionar el mismo archivo.
    input.value = '';
  }

  // --------------------------------------------------
  // Eliminar archivo local
  // --------------------------------------------------

  deleteSelectedFile(
    nombre: string,
    fileName: string
  ): void {

    const campo = this.defineForm[nombre];

    const archivos = campo.archivosLocal ?? [];

    const indice = archivos.findIndex(
      archivo => archivo.file.name === fileName
    );

    if (indice === -1) return;

    const archivoEliminado = archivos[indice];

    URL.revokeObjectURL(archivoEliminado.urlTemp);

    archivos.splice(indice, 1);

    this.validarListaArchivos(nombre);

    const nombres = this.passFilesToFormControl(
      campo.archivosLocal ?? [],
      campo.archivosLinea ?? []
    );

    this.formGroup.patchValue({
      [nombre]: nombres
    });

    this.actualizarValidacionArchivo(nombre);
  }

  // --------------------------------------------------
  // Eliminar archivo existente
  // --------------------------------------------------

  deleteSelectedFileLinea(
    nombre: string,
    idFile: number
  ): void {

    const campo = this.defineForm[nombre];

    const archivos = campo.archivosLinea ?? [];

    const indice = archivos.findIndex(
      archivo => archivo.Id === idFile
    );

    if (indice === -1) return;

    archivos.splice(indice, 1);

    campo.archivosDelete ??= [];
    campo.archivosDelete.push(idFile);

    const nombres = this.passFilesToFormControl(
      campo.archivosLocal ?? [],
      campo.archivosLinea ?? []
    );

    this.formGroup.patchValue({
      [nombre]: nombres
    });

    this.actualizarValidacionArchivo(nombre);
  }

  // --------------------------------------------------
  // Validar lista completa de archivos
  // --------------------------------------------------

  private validarListaArchivos(nombre: string): void {
    const campo = this.defineForm[nombre];

    const archivos = campo.archivosLocal ?? [];

    const tipoPermitido = (
      campo.tipoArchivos ?? ''
    ).toLowerCase()
      .split(',')
      .map(tipo => tipo.trim().replace('.', ''));

    const tamanoMaximo =
      (campo.tamMBArchivos ?? 0) * 1024 * 1024;

    let errTipo = false;
    let errTam = false;

    archivos.forEach(archivo => {
      const file = archivo.file;

      const extension = file.name
        .split('.')
        .pop()
        ?.toLowerCase() ?? '';

      const tipoMime = file.type.toLowerCase();

      const tipoValido =
        tipoPermitido.includes(extension) &&
        (
          tipoMime === '' ||
          tipoMime === 'application/pdf'
        );

      const tamanoValido =
        file.size <= tamanoMaximo;

      archivo.errTipo = !tipoValido;
      archivo.errTam = !tamanoValido;

      archivo.err = !tipoValido || !tamanoValido;

      if (!tipoValido) {
        errTipo = true;
      }

      if (!tamanoValido) {
        errTam = true;
      }
    });

    campo.validaArchivos = {
      errTipo,
      errTam
    };
  }

  // --------------------------------------------------
  // Pasar archivos al control
  // --------------------------------------------------

  passFilesToFormControl(
    archivosLocal: any[],
    archivosLinea: any[]
  ): string {

    const nombres = [
      ...archivosLocal.map(archivo => archivo.file.name),
      ...archivosLinea.map(archivo => archivo.nombre)
    ];

    return nombres.join(', ');
  }

  // --------------------------------------------------
  // Previsualizar archivo
  // --------------------------------------------------

  previewFile(url: string): void {
    const alto = screen.height * 0.65;
    const ancho = alto * 3 / 4;

    const left = (screen.width * 3 / 4) - (ancho / 2);
    const top = (screen.height / 2) - (alto / 2);

    window.open(
      url,
      '',
      'toolbar=no,location=no,directories=no,status=no,' +
      'menubar=no,scrollbars=no,resizable=no,copyhistory=no,' +
      `width=${ancho},height=${alto},top=${top},left=${left}`
    );
  }

  // --------------------------------------------------
  // Destrucción
  // --------------------------------------------------

  ngOnDestroy(): void {
    this.formSubscriptions.unsubscribe();
    this.translateSubscription?.unsubscribe();

    Object.keys(this.defineForm ?? {}).forEach(nombre => {
      const campo = this.defineForm[nombre];

      if (campo.tipo === 'fileMultiple') {
        (campo.archivosLocal ?? []).forEach(archivo => {
          if (archivo.urlTemp) {
            URL.revokeObjectURL(archivo.urlTemp);
          }
        });
      }
    });
  }
}
