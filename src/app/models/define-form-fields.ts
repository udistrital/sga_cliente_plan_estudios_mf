import { ValidatorFn } from '@angular/forms';
export class FormParams {
  [name: string]: Param;
}

export class Param {
  // Información general
  label_i18n?: string;
  label?: string;
  placeholder_i18n?: string;
  placeholder?: string;
  placeholder_info?: string;
  tipo!: string;
  tipoDato?: string;

  // Validaciones
  validador?: ValidatorFn[];
  requerido?: boolean;
  soloLectura?: boolean;
  desabilitado?: boolean;

  // Valores
  valor?: any;
  valorDefecto?: any;

  // Para números
  oculto?: boolean;
  minimo?: number;
  maximo?: number;
  paso?: number;

  // Para selects
  opciones?: any[];

  // Para archivos
  archivosLocal?: any[];
  archivosLinea?: any[];
  archivosDelete?: any[];
  tipoArchivos?: string;
  tamMBArchivos?: number;
  validaArchivos?: { errTipo: boolean; errTam: boolean };

  // Para comprobar contenido
  coincidencia?: RegExp;
  error?: string;
  info?: string;
  notificar?: boolean;

  // Clases y presentación
  claseGrid!: string;
  claseAux?: string;
  descripcion?: string;

  
}