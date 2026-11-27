import {
  Component,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';

import { FormGroup } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import {
  CdkDragDrop,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { PopUpManager } from 'src/app/managers/popUpManager';
import { UtilidadesService } from 'src/app/services/utilidades.service';
import { MODALS } from 'src/app/models/diccionario';
import { FORM_PLAN_ESTUDIO } from 'src/app/form-plan_estudio';
import { FormParams } from 'src/app/models/define-form-fields';

import { ProyectoAcademicoService } from 'src/app/services/proyecto_academico.service';
import { SgaMidService } from 'src/app/services/sga_mid.service';
import { EspaciosAcademicosService } from 'src/app/services/espacios_academicos.service';

interface CrearPlanesDialogData {
  proyectos: any[];
}

type CampoTotal = 'creditos' | 'htd' | 'htc' | 'hta';

@Component({
  selector: 'app-crear-planes',
  templateUrl: './crear-planes.component.html',
  styleUrl: './crear-planes.component.scss',
  standalone: false
})
export class CrearPlanesComponent implements OnInit {
  
  private readonly translate = inject(TranslateService);

  private readonly dialogRef =
    inject<MatDialogRef<CrearPlanesComponent>>(MatDialogRef);

  private readonly popUpManager = inject(PopUpManager);

  private readonly projectService = inject(ProyectoAcademicoService);

  private readonly sgaMidService = inject(SgaMidService);

  private readonly espaciosService = inject(EspaciosAcademicosService);

  readonly data = inject<CrearPlanesDialogData>(MAT_DIALOG_DATA);

  // ---------------------------------------------------------
  // FORMULARIO
  // ---------------------------------------------------------

  readonly formPlanEstudio = signal<FormParams | null>(null);

  formGroupPlanEstudio = new FormGroup({});

  readonly proyectoSeleccionado = signal<any | null>(null);

  // ---------------------------------------------------------
  // INFORMACIÓN PARAMÉTRICA
  // ---------------------------------------------------------

  readonly niveles = signal<any[]>([]);

  readonly proyectos = signal<any[]>([]);

  // ---------------------------------------------------------
  // ESPACIOS ACADÉMICOS
  // ---------------------------------------------------------

  /**
   * Catálogo original.
   *
   * Esta lista nunca se filtra ni se modifica al agregar materias.
   * Es la fuente de verdad para reconstruir los disponibles.
   */
  readonly ListEspacios = signal<any[]>([]);

  /**
   * DataSource que alimenta la tabla de disponibles.
   *
   * Solo contiene espacios que no están asignados
   * a ninguno de los semestres.
   */
  readonly dataEspaciosAcademicos =
    new MatTableDataSource<any>([]);

  readonly filtroEspacios = signal('');

  @ViewChild('paginatorEspacios')
  set paginatorEspacios(paginator: MatPaginator | undefined) {
    if (paginator) {
      this.dataEspaciosAcademicos.paginator = paginator;
    }
  }

  // ---------------------------------------------------------
  // SEMESTRES
  // ---------------------------------------------------------

  readonly dataSemestre =
    new MatTableDataSource<any[]>([]);

  readonly dataSemestreTotal = signal<any[][]>([]);

  readonly dataSemestreTotalTotal =
    new MatTableDataSource<any>([]);

  readonly punteroSemestrePlan = signal(0);

  // ---------------------------------------------------------
  // ESTADO
  // ---------------------------------------------------------

  readonly loading = signal(false);

  readonly enEdicionPlanEstudio = signal(true);

  readonly modoCreacion = signal(true);

  readonly numSemestresCompletado = signal(false);

  readonly habilitadoGenerarPlan = signal(false);

  readonly proyecto_id = signal<number | null>(null);

  // ---------------------------------------------------------
  // COLUMNAS
  // ---------------------------------------------------------

  readonly displayedColumnsEspaciosAcademicos = [
    '#',
    'codigo',
    'nombre',
    'creditos',
    'htd',
    'htc',
    'hta',
    'espacios_requeridos',
    'acciones'
  ];

  readonly displayedColumnsSemestre = [
    'codigo',
    'nombre',
    'creditos',
    'htd',
    'htc',
    'hta',
    'espacios_requeridos',
    'acciones'
  ];
  

  readonly camposTotales: CampoTotal[] = [
    'creditos',
    'htd',
    'htc',
    'hta'
  ];

  readonly formatototal = {
    nombre: 'TOTAL',
    creditos: 0,
    htd: 0,
    htc: 0,
    hta: 0
  };
  

  // ---------------------------------------------------------
  // INICIALIZACIÓN
  // ---------------------------------------------------------

  ngOnInit(): void {
    void this.inicializarFormulario();
  }

  private async inicializarFormulario(): Promise<void> {
    this.loading.set(true);

    try {
      this.cargarProyectosRecibidos();

      const niveles = await this.loadNivel();

      this.niveles.set(niveles);

      this.crearFormulario(FORM_PLAN_ESTUDIO);

    } catch (error) {
      console.error(
        'Error inicializando formulario de plan:',
        error
      );

      await this.popUpManager.showErrorAlert(
        this.translate.instant(
          'ERROR.persiste_error_comunique_OAS'
        )
      );

    } finally {
      this.loading.set(false);
    }
  }

  private cargarProyectosRecibidos(): void {
    const proyectosRecibidos = this.data?.proyectos;

    if (!Array.isArray(proyectosRecibidos)) {
      console.error(
        'Los proyectos recibidos no tienen el formato esperado.'
      );

      this.proyectos.set([]);
      return;
    }

    this.proyectos.set(proyectosRecibidos);
  }

  private async loadNivel(): Promise<any[]> {
    const respuesta: any = await firstValueFrom(
      this.projectService.get(
        'nivel_formacion?query=Activo:true&sortby=Id&order=asc&limit=0'
      )
    );

    if (!Array.isArray(respuesta) || respuesta.length === 0) {
      throw new Error(
        'No se encontraron niveles de formación.'
      );
    }

    return respuesta;
  }

  private crearFormulario(formulario: FormParams): void {
    const formularioCopia =
      UtilidadesService.hardCopy(formulario) as FormParams;

    formularioCopia['nivel'].opciones =
      this.niveles().filter(
        nivel => nivel.NivelFormacionPadreId === null
      );

    formularioCopia['subnivel'].opciones = [];

    formularioCopia['proyectoCurricular'].opciones = [];

    this.formPlanEstudio.set(formularioCopia);
  }

  // ---------------------------------------------------------
  // CAMBIOS EN LOS CAMPOS DEL FORMULARIO
  // ---------------------------------------------------------

  cambioEn(event: any): void {
    if (!event) return;

    if (event.nivel) {
      const idNivel = Number(event.nivel.Id);

      if (!Number.isFinite(idNivel)) return;

      this.actualizarOpcionesPorNivel(idNivel);
      return;
    }

    if (event.subnivel) {
      const idSubnivel = Number(event.subnivel.Id);

      const idNivel = this.proyecto_id();

      if (!Number.isFinite(idSubnivel) || idNivel === null) {
        return;
      }

      const proyectosFiltrados =
        this.filtrarProyectos(idNivel, idSubnivel);

      this.actualizarProyectosFormulario(proyectosFiltrados);
      return;
    }

    if (event.proyectoCurricular) {
      this.seleccionarProyectoCurricular(
        event.proyectoCurricular
      );
    }
  }

  private filtrarSubniveles(idNivel: number): any[] {
    return this.niveles().filter(
      nivel => nivel.NivelFormacionPadreId?.Id === idNivel
    );
  }

  private filtrarProyectos(
    idNivel: number,
    idSubnivel?: number | null
  ): any[] {

    return this.proyectos().filter(proyecto => {
      const nivelProyecto = proyecto.NivelFormacionId;

      if (!nivelProyecto) return false;

      if (idSubnivel !== null && idSubnivel !== undefined) {
        return Number(nivelProyecto.Id) === idSubnivel;
      }

      const nivelPrincipalProyecto =
        nivelProyecto.NivelFormacionPadreId?.Id ??
        nivelProyecto.Id;

      return Number(nivelPrincipalProyecto) === idNivel;
    });
  }

  private actualizarOpcionesPorNivel(idNivel: number): void {
    const formulario = this.formPlanEstudio();

    if (!formulario) return;

    this.proyecto_id.set(idNivel);

    const subniveles = this.filtrarSubniveles(idNivel);

    const proyectosFiltrados =
      this.filtrarProyectos(idNivel);

    formulario['subnivel'].opciones = subniveles;

    formulario['proyectoCurricular'].opciones =
      proyectosFiltrados;
  }

  private actualizarProyectosFormulario(
    proyectosFiltrados: any[]
  ): void {
    const formulario = this.formPlanEstudio();

    if (!formulario) return;

    formulario['proyectoCurricular'].opciones =
      proyectosFiltrados;
  }

  asignarForm(event: FormGroup): void {
    queueMicrotask(() => {
      this.formGroupPlanEstudio = event;
    });
  }

  actualizarForm(event: FormGroup): void {
    if (this.formGroupPlanEstudio !== event) {
      this.formGroupPlanEstudio = event;
    }
  }

  private seleccionarProyectoCurricular(proyecto: any): void {
    if (!proyecto) return;

    this.proyectoSeleccionado.set(proyecto);

    const codigoProyecto = proyecto.Id;

    const planPorCiclos = 'No';

    const formulario = this.formPlanEstudio();

    if (formulario) {
      formulario['codigoProyecto'].valor = codigoProyecto;
      formulario['planPorCiclos'].valor = planPorCiclos;
    }

    this.formGroupPlanEstudio.patchValue({
      codigoProyecto,
      planPorCiclos
    });
  }

  // ---------------------------------------------------------
  // AVANZAR A PARAMETRIZACIÓN
  // ---------------------------------------------------------

  async guardar(stepper: MatStepper): Promise<void> {
    if (this.loading()) return;

    this.formGroupPlanEstudio.markAllAsTouched();

    this.formGroupPlanEstudio.updateValueAndValidity();

    if (this.formGroupPlanEstudio.invalid) {
      await this.popUpManager.showErrorAlert(
        'Debes completar correctamente todos los campos obligatorios antes de continuar.'
      );

      return;
    }

    const proyectoFormulario =
      this.formGroupPlanEstudio.get(
        'proyectoCurricular'
      )?.value;

    if (proyectoFormulario) {
      this.seleccionarProyectoCurricular(
        proyectoFormulario
      );
    }

    const proyecto = this.proyectoSeleccionado();

    if (!proyecto?.Id) {
      await this.popUpManager.showErrorAlert(
        'Debes seleccionar un proyecto curricular.'
      );

      return;
    }

    const numeroSemestres = Number(
      this.formGroupPlanEstudio.get(
        'numeroSemestres'
      )?.value
    );

    if (
      !Number.isInteger(numeroSemestres) ||
      numeroSemestres <= 0
    ) {
      await this.popUpManager.showErrorAlert(
        'Debes indicar una cantidad válida de semestres.'
      );

      return;
    }

    const result = await this.popUpManager.showPopUpGeneric(
      this.translate.instant(
        'plan_estudios.plan_estudios'
      ),
      this.translate.instant(
        'plan_estudios.seguro_crear'
      ),
      MODALS.INFO,
      true
    );

    if (!result.isConfirmed) return;

    // No se ejecuta POST.
    // Solo se consulta la información y se abre el segundo paso.

    await this.cargarVistaEspaciosAcademicos(
      Number(proyecto.Id),
      numeroSemestres,
      stepper
    );
  }

  private async cargarVistaEspaciosAcademicos(
    idProyecto: number,
    numeroSemestres: number,
    stepper: MatStepper
  ): Promise<void> {

    this.loading.set(true);

    try {
      await this.consultarEspaciosAcademicos(idProyecto);

      this.inicializarSemestres(numeroSemestres);

      this.modoCreacion.set(false);

      this.enEdicionPlanEstudio.set(false);

      stepper.next();

    } catch (error) {
      console.error(
        'Error cargando espacios académicos:',
        error
      );

      await this.popUpManager.showErrorAlert(
        'No fue posible consultar los espacios académicos del proyecto seleccionado.'
      );

    } finally {
      this.loading.set(false);
    }
  }

  // ---------------------------------------------------------
  // CONSULTA DE ESPACIOS ACADÉMICOS
  // ---------------------------------------------------------

  private async consultarEspaciosAcademicos(
    idProyecto: number
  ): Promise<any[]> {
    try {
      const respuesta: any = await firstValueFrom(
        this.espaciosService.get(
          // `espacio-academico?query=proyecto_academico_id:${idProyecto}`
          `espacio-academico?query=proyecto_academico_id:26`
        )
      );

      const espacios = Array.isArray(respuesta?.Data)
        ? respuesta.Data
        : [];

      const espaciosNormalizados = espacios.map(
        (espacio: any) => this.normalizarEspacio(espacio)
      );

      this.ListEspacios.set(espaciosNormalizados);

      this.actualizarEspaciosDisponibles();

      return espaciosNormalizados;

    } catch (error) {
      console.error('Error consultando espacios académicos:', error);

      this.ListEspacios.set([]);
      this.dataEspaciosAcademicos.data = [];

      return [];
    }
  }

  // ---------------------------------------------------------
  // INICIALIZAR SEMESTRES
  // ---------------------------------------------------------

  private inicializarSemestres(
    cantidadSemestres: number
  ): void {

    const semestres: any[][] = Array.from(
      { length: cantidadSemestres },
      () => []
    );

    this.dataSemestre.data = semestres;

    this.punteroSemestrePlan.set(0);

    this.numSemestresCompletado.set(true);

    this.actualizarEspaciosDisponibles();

    this.actualizarTotales();
  }

  seleccionarSemestre(numero: number): void {
    if (
      numero < 0 ||
      numero >= this.dataSemestre.data.length
    ) {
      return;
    }

    this.punteroSemestrePlan.set(numero);
  }

  // ---------------------------------------------------------
  // IDENTIFICACIÓN DE ESPACIOS
  // ---------------------------------------------------------

  /**
   * Normaliza el identificador.
   *
   * Es importante que el ID que se utiliza para comparar
   * el catálogo sea exactamente el mismo que el de los
   * espacios almacenados en los semestres.
   */
  private obtenerIdEspacio(espacio: any): string {
    const id =
      espacio?._id ??
      espacio?.Id ??
      espacio?.id;

    return id !== null && id !== undefined
      ? String(id).trim()
      : '';
  }


  /**
   * Obtiene una clave para comparar espacios.
   * Si el registro no trae identificador, intenta utilizar
   * una combinación de atributos del espacio.
   */
  private obtenerClaveEspacio(espacio: any): string {
    const id = this.obtenerIdEspacio(espacio);

    if (id) {
      return `id:${id}`;
    }

    const codigo = espacio?.codigo ?? espacio?.codigo_abreviacion;

    if (codigo) {
      return `codigo:${String(codigo).trim()}`;
    }

    return [
      espacio?.nombre ?? '',
      espacio?.creditos ?? 0,
      espacio?.grupo ?? ''
    ].join('|');
  }

  // ---------------------------------------------------------
  // FILTRAR ESPACIOS DISPONIBLES
  // ---------------------------------------------------------

  /**
   * Reconstruye la tabla de disponibles desde el catálogo original.
   *
   * No se modifica ListEspacios.
   *
   * Una materia desaparece de disponibles si su clave está
   * presente en cualquiera de los semestres.
   */
  private actualizarEspaciosDisponibles(): void {
    const espaciosAsignados = new Set(
      this.dataSemestre.data
        .flat()
        .map(espacio => this.obtenerClaveEspacio(espacio))
    );

    const disponibles = this.ListEspacios().filter(
      espacio =>
        !espaciosAsignados.has(
          this.obtenerClaveEspacio(espacio)
        )
    );

    this.dataEspaciosAcademicos.data = disponibles;

    this.dataEspaciosAcademicos.filter = 
      this.dataEspaciosAcademicos.filter;

    this.dataEspaciosAcademicos.paginator?.firstPage();
  }

  // ---------------------------------------------------------
  // BUSCADOR
  // ---------------------------------------------------------

  aplicarFiltro(event: Event): void {
    const valor = (
      event.target as HTMLInputElement
    ).value;

    this.filtroEspacios.set(valor);

    this.dataEspaciosAcademicos.filter =
      valor.trim().toLowerCase();

    if (this.dataEspaciosAcademicos.paginator) {
      this.dataEspaciosAcademicos.paginator.firstPage();
    }
  }

  // ---------------------------------------------------------
  // AGREGAR ESPACIO A SEMESTRE
  // ---------------------------------------------------------

  aniadirASemestre(espacio: any): void {
    const numeroSemestre = this.punteroSemestrePlan();
    const semestresActuales = this.dataSemestre.data;

    if (!semestresActuales[numeroSemestre]) {
      return;
    }

    const clave = this.obtenerClaveEspacio(espacio);

    const yaExiste = semestresActuales.some(semestre =>
      semestre.some(
        item => this.obtenerClaveEspacio(item) === clave
      )
    );

    if (yaExiste) {
      this.popUpManager.showInfoToast(
        'Este espacio académico ya fue asignado a un semestre.'
      );
      return;
    }

    this.dataSemestre.data = semestresActuales.map(
      (semestre, indice) =>
        indice === numeroSemestre
          ? [...semestre, espacio]
          : [...semestre]
    );

    this.actualizarEspaciosDisponibles();
    this.actualizarTotales();
  }

  // ---------------------------------------------------------
  // REORDENAR ESPACIOS ACADÉMICOS
  // ---------------------------------------------------------

  reordenarEspacios(
    event: CdkDragDrop<any[]>,
    numeroSemestre: number
  ): void {

    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const semestresActuales = this.dataSemestre.data;

    if (!semestresActuales[numeroSemestre]) {
      return;
    }

    const nuevosSemestres = semestresActuales.map(
      semestre => [...semestre]
    );

    const semestre = nuevosSemestres[numeroSemestre];

    moveItemInArray(
      semestre,
      event.previousIndex,
      event.currentIndex
    );

    this.dataSemestre.data = nuevosSemestres;

    this.actualizarTotales();
  }

  // ---------------------------------------------------------
  // RETIRAR ESPACIO DE UN SEMESTRE
  // ---------------------------------------------------------

  removeFromSemester(
    espacio: any,
    numeroSemestre: number
  ): void {

    const semestresActuales = this.dataSemestre.data;

    if (!semestresActuales[numeroSemestre]) {
      return;
    }

    const claveEspacio = this.obtenerClaveEspacio(espacio);

    const nuevosSemestres = semestresActuales.map(
      (semestre, indice) => {

        if (indice !== numeroSemestre) {
          return [...semestre];
        }

        return semestre.filter(
          item =>
            this.obtenerClaveEspacio(item) !== claveEspacio
        );
      }
    );

    this.dataSemestre.data = nuevosSemestres;

    // La materia vuelve a la tabla de disponibles.
    this.actualizarEspaciosDisponibles();

    this.actualizarTotales();
  }

  // ---------------------------------------------------------
  // LIMPIAR SEMESTRE
  // ---------------------------------------------------------

  limpiarSemestre(numeroSemestre: number): void {

    const semestresActuales = this.dataSemestre.data;

    if (!semestresActuales[numeroSemestre]) {
      return;
    }

    const nuevosSemestres = semestresActuales.map(
      (semestre, indice) => {

        if (indice === numeroSemestre) {
          return [];
        }

        return [...semestre];
      }
    );

    this.dataSemestre.data = nuevosSemestres;

    // Todas las materias del semestre limpiado
    // regresan a la tabla de disponibles.
    this.actualizarEspaciosDisponibles();

    this.actualizarTotales();
  }

  // ---------------------------------------------------------
  // TOTALES
  // ---------------------------------------------------------

  calcularTotal(semestre: any[]): any {
    const total = { ...this.formatototal };

    semestre.forEach(espacio => {
      this.camposTotales.forEach((campo: CampoTotal) => {
        total[campo] += Number(espacio[campo] ?? 0);
      });
    });

    return total;
  }

  private actualizarTotales(): void {

    const semestres = this.dataSemestre.data;

    const totalesPorSemestre = semestres.map(
      semestre => [
        this.calcularTotal(semestre)
      ]
    );

    this.dataSemestreTotal.set(
      totalesPorSemestre
    );

    const todosLosEspacios = semestres.flat();

    this.dataSemestreTotalTotal.data = [
      this.calcularTotal(todosLosEspacios)
    ];
  }

  totalMateriasAsignadas(): number {
    return this.dataSemestre.data.reduce(
      (total, semestre) => total + semestre.length,
      0
    );
  }

  // ---------------------------------------------------------
  // LIMPIAR FORMULARIO
  // ---------------------------------------------------------

  limpiar(): void {

    this.formGroupPlanEstudio.reset();

    this.proyecto_id.set(null);

    this.proyectoSeleccionado.set(null);

    const formulario = this.formPlanEstudio();

    if (formulario) {
      formulario['subnivel'].opciones = [];

      formulario['proyectoCurricular'].opciones = [];

      formulario['codigoProyecto'].valor = null;

      formulario['planPorCiclos'].valor = 'No';
    }

    this.formGroupPlanEstudio.patchValue({
      planPorCiclos: 'No'
    });

    this.formGroupPlanEstudio.markAsPristine();

    this.formGroupPlanEstudio.markAsUntouched();
  }

  // ---------------------------------------------------------
  // CERRAR DIÁLOGO
  // ---------------------------------------------------------

  cancelar(): void {
    this.dialogRef.close(false);
  }

  // ---------------------------------------------------------
  // CONSTRUIR DISTRIBUCIÓN PARA EL PLAN
  // ---------------------------------------------------------

  obtenerDistribucionSemestres(): any {
    const resultado: any = {};

    this.dataSemestre.data.forEach((semestre, indiceSemestre) => {
      const nombreSemestre = `semestre_${indiceSemestre + 1}`;

      resultado[nombreSemestre] = {
        espacios_academicos: semestre.map(
          (espacio, indiceEspacio) => ({
            [`espacio_${indiceEspacio + 1}`]: {
              Id: this.obtenerIdEspacio(espacio),
              OrdenTabla: indiceEspacio + 1,
              EspaciosRequeridos: {
                Id: 'NA'
              }
            }
          })
        )
      };
    });

    return resultado;
  }

  private normalizarEspacio(espacio: any): any {
    const distribucion = espacio?.distribucion_horas ?? {};

    return {
      ...espacio,

      // Identificación
      Id: String(espacio?._id ?? espacio?.Id ?? ''),
      codigo: espacio?.codigo ?? '',
      codigo_abreviacion: espacio?.codigo_abreviacion ?? '',
      nombre: espacio?.nombre ?? 'Sin nombre',

      // Información académica
      creditos: Number(espacio?.creditos ?? 0),

      // Distribución de horas
      htd: Number(distribucion?.HTD ?? distribucion?.htd ?? 0),
      htc: Number(distribucion?.HTC ?? distribucion?.htc ?? 0),
      hta: Number(distribucion?.HTA ?? distribucion?.hta ?? 0),

      // Se conservan para compatibilidad con el cálculo anterior
      OB: Number(distribucion?.OB ?? 0),
      OC: Number(distribucion?.OC ?? 0),
      EI: Number(distribucion?.EI ?? 0),
      EE: Number(distribucion?.EE ?? 0),
      CP: Number(distribucion?.CP ?? 0),
      ENFQ_TEO: Number(distribucion?.ENFQ_TEO ?? 0),
      ENFQ_PRAC: Number(distribucion?.ENFQ_PRAC ?? 0),
      ENFQ_TEOPRAC: Number(distribucion?.ENFQ_TEOPRAC ?? 0)
    };
  }
  obtenerEspaciosRequeridos(espacio: any): string {
    const requeridos = espacio?.espacios_requeridos;

    if (!requeridos) {
      return 'Ninguno';
    }

    if (Array.isArray(requeridos)) {
      if (requeridos.length === 0) {
        return 'Ninguno';
      }

      return requeridos
        .map(item =>
          item?.nombre ??
          item?.Nombre ??
          item?.codigo ??
          item?.Id ??
          String(item)
        )
        .join(', ');
    }

    if (typeof requeridos === 'object') {
      return requeridos.requeridos ?? 'Ninguno';
    }

    return String(requeridos);
  }
}