
import { FormParams } from "./models/define-form-fields";
import * as lo_ from "lodash";
import { ValidatorFn } from '@angular/forms';

export let FORM_PLAN_ESTUDIO: FormParams = {

    // =========================================
    // 1. INFORMACIÓN ACADÉMICA
    // =========================================

    "seccionAcademica": {
        tipo: 'separator',
        label_i18n: 'Información académica',
        descripcion: 'Selecciona el nivel de formación y el proyecto curricular.',
        claseGrid: 'col-12',
    },

    "nivel": {
        label_i18n: 'GLOBAL.nivel',
        placeholder_i18n: 'GLOBAL.nivel',
        tipo: 'select',
        tipoDato: 'text',
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-6 col-sm-12 col-xs-12',
        opciones: [],
        notificar: true,
    },

    "subnivel": {
        label_i18n: 'GLOBAL.subnivel',
        placeholder_i18n: 'GLOBAL.subnivel',
        tipo: 'select',
        tipoDato: 'text',
        requerido: false,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-6 col-sm-12 col-xs-12',
        opciones: [],
        notificar: true,
    },

    "proyectoCurricular": {
        label_i18n: 'GLOBAL.proyecto_academico',
        placeholder_i18n: 'GLOBAL.proyecto_academico',
        tipo: 'select',
        tipoDato: 'text',
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-12',
        opciones: [],
        notificar: true,
    },

    // =========================================
    // 2. IDENTIFICACIÓN DEL PLAN
    // =========================================

    "seccionIdentificacion": {
        tipo: 'separator',
        label_i18n: 'Identificación del plan',
        descripcion: 'Define el nombre y los datos generales del plan de estudios.',
        claseGrid: 'col-12',
    },

    "codigoProyecto": {
        label_i18n: 'plan_estudios.codigo_proyecto',
        placeholder_i18n: 'plan_estudios.codigo_proyecto',
        tipo: 'input',
        tipoDato: 'text',
        requerido: false,
        soloLectura: true,
        valor: undefined,
        claseGrid: 'col-lg-3 col-md-4 col-sm-6 col-xs-12',
    },

    "planPorCiclos": {
        label_i18n: 'plan_estudios.plan_estudios_ciclos',
        placeholder_i18n: 'plan_estudios.plan_estudios_ciclos',
        tipo: 'input',
        tipoDato: 'text',
        requerido: false,
        soloLectura: true,
        valor: undefined,
        claseGrid: 'col-lg-3 col-md-4 col-sm-6 col-xs-12',
    },

    "nombrePlanEstudio": {
        label_i18n: 'plan_estudios.nombre_plan_estudios',
        placeholder_i18n: 'plan_estudios.nombre_plan_estudios',
        tipo: 'input',
        tipoDato: 'text',
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-12 col-sm-12 col-xs-12',
    },

    "codigoPlanEstudio": {
        label_i18n: 'plan_estudios.codigo_plan',
        placeholder_i18n: 'plan_estudios.codigo_plan',
        tipo: 'input',
        tipoDato: 'text',
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-lg-4 col-md-6 col-sm-6 col-xs-12',
    },

    "totalCreditosPrograma": {
        label_i18n: 'plan_estudios.total_creditos',
        placeholder_i18n: 'plan_estudios.placeholder_total_creditos',
        tipo: 'input',
        tipoDato: 'number',
        minimo: 1,
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-lg-4 col-md-6 col-sm-6 col-xs-12',
    },

    "numeroSemestres": {
        label_i18n: 'plan_estudios.numero_semestres',
        placeholder_i18n: 'plan_estudios.placeholder_numero_semestres',
        tipo: 'input',
        tipoDato: 'number',
        minimo: 1,
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-lg-4 col-md-6 col-sm-6 col-xs-12',
    },

    // =========================================
    // 3. INFORMACIÓN DE LA RESOLUCIÓN
    // =========================================

    "seccionResolucion": {
        tipo: 'separator',
        label_i18n: 'Información de la resolución',
        descripcion: 'Registra los datos del acto administrativo que respalda el plan.',
        claseGrid: 'col-12',
    },

    "numeroResolucion": {
        label_i18n: 'plan_estudios.numero_resolucion',
        placeholder_i18n: 'plan_estudios.numero_resolucion',
        tipo: 'input',
        tipoDato: 'number',
        minimo: 0,
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-6 col-sm-6 col-xs-12',
    },

    "anioResolucion": {
        label_i18n: 'plan_estudios.anio_resolucion',
        placeholder_i18n: 'plan_estudios.anio_resolucion',
        tipo: 'input',
        tipoDato: 'number',
        minimo: 1900,
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-6 col-sm-6 col-xs-12',
    },

    // =========================================
    // 4. DOCUMENTACIÓN
    // =========================================

    "seccionDocumentacion": {
        tipo: 'separator',
        label_i18n: 'Documentación de soporte',
        descripcion: 'Adjunta los documentos PDF correspondientes al plan de estudios.',
        claseGrid: 'col-12',
    },

    "soportes": {
        label_i18n: 'plan_estudios.soporte_plan',
        placeholder_i18n: 'plan_estudios.placeholder_soporte_plan',
        tipo: 'fileMultiple',
        tipoDato: '',
        tipoArchivos: 'pdf',
        tamMBArchivos: 2,
        requerido: true,
        soloLectura: false,
        valor: undefined,
        claseGrid: 'col-12',
        archivosLocal: [],
        archivosLinea: [],
        archivosDelete: [],
        validaArchivos: {
            errTipo: false,
            errTam: false
        },
    }
};


// =========================================
// FORMULARIO DE EDICIÓN
// =========================================

function getFormPlanEstudioEdicion(): FormParams {

    const formulario = lo_.cloneDeep(FORM_PLAN_ESTUDIO);

    formulario['nivel'] = {
        label_i18n: 'GLOBAL.nivel',
        placeholder_i18n: 'GLOBAL.nivel',
        tipo: 'input',
        tipoDato: 'text',
        requerido: false,
        soloLectura: true,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-6 col-sm-12 col-xs-12',
    };

    formulario['subnivel'] = {
        label_i18n: 'GLOBAL.subnivel',
        placeholder_i18n: 'GLOBAL.subnivel',
        tipo: 'input',
        tipoDato: 'text',
        requerido: false,
        soloLectura: true,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-6 col-sm-12 col-xs-12',
    };

    formulario['proyectoCurricular'] = {
        label_i18n: 'GLOBAL.proyecto_academico',
        placeholder_i18n: 'GLOBAL.proyecto_academico',
        tipo: 'input',
        tipoDato: 'text',
        requerido: false,
        soloLectura: true,
        valor: undefined,
        claseGrid: 'col-12',
        opciones: [],
        notificar: true,
    };

    return formulario;
}


// =========================================
// FORMULARIO DE VISUALIZACIÓN
// =========================================

function getFormPlanEstudioVisualizacion(): FormParams {

    const formulario = lo_.cloneDeep(FORM_PLAN_ESTUDIO);

    formulario['nivel'] = {
        label_i18n: 'GLOBAL.nivel',
        placeholder_i18n: 'GLOBAL.nivel',
        tipo: 'input',
        tipoDato: 'text',
        requerido: false,
        soloLectura: true,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-6 col-sm-12 col-xs-12',
    };

    formulario['subnivel'] = {
        label_i18n: 'GLOBAL.subnivel',
        placeholder_i18n: 'GLOBAL.subnivel',
        tipo: 'input',
        tipoDato: 'text',
        requerido: false,
        soloLectura: true,
        valor: undefined,
        claseGrid: 'col-lg-6 col-md-6 col-sm-12 col-xs-12',
    };

    formulario['proyectoCurricular'] = {
        label_i18n: 'GLOBAL.proyecto_academico',
        placeholder_i18n: 'GLOBAL.proyecto_academico',
        tipo: 'input',
        tipoDato: 'text',
        requerido: false,
        soloLectura: true,
        valor: undefined,
        claseGrid: 'col-12',
        opciones: [],
        notificar: true,
    };

    for (const key in formulario) {
        if (formulario[key].tipo !== 'separator') {
            formulario[key].soloLectura = true;
            formulario[key].requerido = false;
        }
    }

    return formulario;
}


// =========================================
// EXPORTACIONES
// =========================================

export let FORM_PLAN_ESTUDIO_EDICION: FormParams =
    getFormPlanEstudioEdicion();

export let FORM_PLAN_ESTUDIO_VISUALIZACION: FormParams =
    getFormPlanEstudioVisualizacion();
