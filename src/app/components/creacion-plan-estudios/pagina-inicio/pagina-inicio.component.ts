
import {
  Component,
  OnInit,
  ViewChild,
  signal,
  computed,
  effect
} from '@angular/core';


import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

import { TranslateService } from '@ngx-translate/core';

import { animate, style, transition, trigger } from '@angular/animations';

import { firstValueFrom } from 'rxjs';

import { ProyectoAcademicoService } from 'src/app/services/proyecto_academico.service';
import { PlanEstudiosService } from 'src/app/services/plan_estudios.service';
import { SgaMidService } from 'src/app/services/sga_mid.service';
import { EstadoAprobacion } from 'src/app/models/estado_aprobacion';

import { PopUpManager } from 'src/app/managers/popUpManager';

import { ROLES, ACTIONS } from 'src/app/models/diccionario';
import { PlanEstudio } from 'src/app/models/plan_estudio';

import { ImplicitAutenticationService } from
  'src/app/services/implicit_autentication.service';
import { decrypt } from 'src/utils/util-encrypt';

import { MatDialog } from '@angular/material/dialog';
import { CrearPlanesComponent } from '../crear-planes/crear-planes.component';

interface PlanEstudioFila extends Record<string, any> {
  Id: number;
  ProyectoAcademicoId: number;

  plan_estudio: string;
  proyectoCurricular: string;
  resolucion: string | number;
  estado: string;
  totalCreditos: number;
  planPorCiclos: string;

  ver: AccionPlan;
  enviar: AccionPlan;
  ver_ob: AccionPlan;
}

interface AccionPlan {
  value: symbol | undefined;
  type: 'editar' | 'ver' | 'enviar';
  disabled: boolean;
  hidden?: boolean;
}

@Component({
  selector: 'app-pagina-inicio',
  templateUrl: './pagina-inicio.component.html',
  styleUrl: './pagina-inicio.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateY(150%)' }))
      ])
    ])
  ],
  standalone: false,
})
export class PaginaInicioComponent implements OnInit{
  // --------------------------------------------------
  // Columnas de la tabla
  // --------------------------------------------------

  readonly displayedColumnsPlanesEstudio = [
    'plan_estudios',
    'proyecto_curricular',
    'estado_proyecto',
    'resolucion',
    'estado',
    'total_creditos',
    'plan_estudios_ciclos',
    'ver_editar',
    'observacion',
    'enviar'
  ];

  // --------------------------------------------------
  // Signals: estado del componente
  // --------------------------------------------------

  readonly planesEstudio = signal<PlanEstudioFila[]>([]);

  readonly estadosAprobacion = signal<EstadoAprobacion[]>([]);

  readonly proyectos = signal<any[]>([]);

  readonly filtro = signal<string>('');

  readonly cargando = signal<boolean>(false);

  readonly errorCarga = signal<boolean>(false);

  // --------------------------------------------------
  // Datos derivados
  // --------------------------------------------------

  readonly planesFiltrados = computed(() => {
    const planes = this.planesEstudio();
    const termino = this.filtro().trim().toLocaleLowerCase();

    if (!termino) {
      return planes;
    }

    return planes.filter(plan =>
      (plan.plan_estudio ?? '')
        .toLocaleLowerCase()
        .includes(termino)
    );
  });

  readonly hayPlanes = computed(() => this.planesEstudio().length > 0);

  readonly hayResultados = computed(() => this.planesFiltrados().length > 0);

  // --------------------------------------------------
  // Angular Material
  // --------------------------------------------------

  readonly dataPlanesEstudio = new MatTableDataSource<PlanEstudioFila>([]);

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataPlanesEstudio.paginator = paginator;
    }
  }

  // --------------------------------------------------
  // Información del usuario
  // --------------------------------------------------

  private personaId = 0;

  private personaRoles: string[] = [];

  private readonly rolesAdministrativos: string[] = [
    ROLES.ADMIN_SGA,
    ROLES.VICERRECTOR,
    ROLES.ASESOR_VICE
  ];

  private readonly rolesCoordinacion: string[] = [
    ROLES.COORDINADOR,
    ROLES.COORDINADOR_PREGADO,
    ROLES.COORDINADOR_POSGRADO,
    ROLES.ADMIN_DOCENCIA
  ];

  // --------------------------------------------------
  // Constructor
  // --------------------------------------------------

  constructor(
    private readonly translate: TranslateService,
    private readonly popUpManager: PopUpManager,
    private readonly proyectoService: ProyectoAcademicoService,
    private readonly planEstudiosService: PlanEstudiosService,
    private readonly sgaMidService: SgaMidService,
    private readonly autenticationService: ImplicitAutenticationService,
    private readonly dialog: MatDialog
  ) {
    effect(() => {
      this.dataPlanesEstudio.data = this.planesFiltrados();
    });
  }

  // --------------------------------------------------
  // Inicialización
  // --------------------------------------------------

  async ngOnInit(): Promise<void> {
    await this.inicializarListado();
  }

  private async inicializarListado(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(false);

    try {
      const personaEncriptada = localStorage.getItem('persona_id');

      if (!personaEncriptada) {
        throw new Error('No se encontró el identificador del usuario.');
      }

      this.personaId = Number(decrypt(personaEncriptada));

      // Recuperar roles.
      this.personaRoles = await this.autenticarRoles();

      // Cargar proyectos y estados en paralelo.
      const [proyectos, estados] = await Promise.all([
        this.loadProyectos(),
        this.loadEstadosAprobacion()
      ]);

      this.proyectos.set(proyectos);
      this.estadosAprobacion.set(estados);

      // Cargar planes según el rol.
      await this.loadStudyPlanTable();

    } catch (error) {
      console.error('Error inicializando el listado de planes:', error);

      this.errorCarga.set(true);

      this.popUpManager.showErrorAlert(
        this.translate.instant('ERROR.persiste_error_comunique_OAS')
      );

    } finally {
      this.cargando.set(false);
    }
  }

  // --------------------------------------------------
  // Roles
  // --------------------------------------------------

  private async autenticarRoles(): Promise<string[]> {
    const roles = await this.getRoles();

    return Array.isArray(roles) ? roles : [];
  }

  private async getRoles(): Promise<string[]> {
    const roles: unknown = await this.autenticationService.getRole();

    if (!Array.isArray(roles)) {
      return [];
    }

    return roles.filter(
      (rol): rol is string => typeof rol === 'string'
    );
  }

  // --------------------------------------------------
  // Cargar proyectos curriculares
  // --------------------------------------------------

  private async loadProyectos(): Promise<any[]> {
    const respuesta = await firstValueFrom(
      this.proyectoService.get(
        'proyecto_academico_institucion?sortby=Nombre&order=asc&limit=0'
      )
    );

    return Array.isArray(respuesta) ? respuesta : [];
  }

  // --------------------------------------------------
  // Cargar planes de estudio
  // --------------------------------------------------

  private async loadPlanesEstudio(): Promise<PlanEstudio[]> {
    const respuesta: any = await firstValueFrom(
      this.planEstudiosService.get(
        'plan_estudio?query=activo:true&limit=0'
      )
    );

    return Array.isArray(respuesta?.Data)
      ? respuesta.Data
      : [];
  }

  // --------------------------------------------------
  // Cargar planes asociados al tercero
  // --------------------------------------------------

  private async loadPlanesEstudioPorTerceroVinculacion(
    terceroId: number
  ): Promise<PlanEstudio[]> {

    const respuesta: any = await firstValueFrom(
      this.sgaMidService.get(
        `plan_estudio/dependencia_vinculacion_tercero/${terceroId}`
      )
    );

    return Array.isArray(respuesta?.Data)
      ? respuesta.Data
      : [];
  }

  // --------------------------------------------------
  // Consulta de estados
  // --------------------------------------------------

  loadEstadosAprobacion(): Promise<EstadoAprobacion[]> {
      return new Promise<any>((resolve, reject) => {
        this.planEstudiosService.get("estado_aprobacion?query=activo:true&limit=0").
          subscribe(
            (resp: any) => {
              if (Object.keys(resp.Data[0]).length > 0) {
                resolve(resp.Data);
              } else {
                reject({ "estado_aprobacion": null });
              }
            }, (err) => {
              reject({ "estado_aprobacion": err });
            }
          )
      });
    }

  // --------------------------------------------------
  // Determinar consulta según el rol
  // --------------------------------------------------

  private async loadStudyPlanTable(): Promise<void> {

    const esAdministrador = this.personaRoles.some(
      rol => this.rolesAdministrativos.includes(rol)
    );

    const esCoordinador = this.personaRoles.some(
      rol => this.rolesCoordinacion.includes(rol)
    );

    let planes: PlanEstudio[] = [];

    if (esAdministrador) {

      planes = await this.loadPlanesEstudio();

    } else if (esCoordinador) {

      planes = await this.loadPlanesEstudioPorTerceroVinculacion(
        this.personaId
      );

      if (planes.length === 0) {
        this.popUpManager.showErrorAlert(
          this.translate.instant(
            'plan_estudios.plan_estudios_sin_vinculacion_error'
          )
        );
      }

    } else {

      this.popUpManager.showErrorAlert(
        this.translate.instant(
          'plan_estudios.plan_estudios_sin_vinculacion_error'
        )
      );

      this.planesEstudio.set([]);
      return;
    }

    // Transformar los datos para la presentación.
    const planesPreparados = planes.map(plan =>
      this.organizarDatosTablaPlanEstudio(plan)
    );

    this.planesEstudio.set(planesPreparados);
  }

  // --------------------------------------------------
  // Preparar datos para la tabla
  // --------------------------------------------------

  private organizarDatosTablaPlanEstudio(plan: PlanEstudio): PlanEstudioFila {
    const proyecto = this.proyectos().find(
      proyecto => proyecto.Id === (plan as any)['ProyectoAcademicoId']
    );

    const estadoAprobacion = (plan as any)['EstadoAprobacionId'];

    const fila: PlanEstudioFila = {
      ...(plan as any),
      plan_estudio: (plan as any)['Nombre'] ?? '',
      proyectoCurricular: proyecto?.Nombre ?? '',
      resolucion: (plan as any)['NumeroResolucion'] ?? '',
      estado: estadoAprobacion?.Id ?? '',
      totalCreditos: (plan as any)['TotalCreditos'] ?? 0,
      planPorCiclos: (plan as any)['EsPlanEstudioPadre']
        ? this.translate.instant('GLOBAL.si')
        : this.translate.instant('GLOBAL.no')
    };

    this.setButtonByStatePlan(fila);
    return fila;
  }

  private setButtonByStatePlan(plan: PlanEstudioFila): void {
    const estadoPlan = plan['EstadoAprobacionId'];

    // Buscar el estado correspondiente en el catálogo.
    const estado = this.estadosAprobacion().find(
      item => item.Id === estadoPlan?.Id
    );

    const codigoEstado = estado?.CodigoAbreviacion;

    const permiteEditar = codigoEstado === 'ED' || codigoEstado === 'OB';

    if (permiteEditar) {
      plan['ver'] = {
        value: ACTIONS.EDIT,
        type: 'editar',
        disabled: false
      };

      plan['enviar'] = {
        value: ACTIONS.SEND,
        type: 'enviar',
        disabled: false
      };

      const revisorId = plan['RevisorId'];

      if (
        revisorId === 0 ||
        revisorId === undefined ||
        revisorId === null
      ) {
        plan['ver_ob'] = {
          value: undefined,
          type: 'ver',
          disabled: true,
          hidden: true
        };
      } else {
        plan['ver_ob'] = {
          value: ACTIONS.VIEW,
          type: 'ver',
          disabled: false
        };
      }

    } else {
      plan['ver'] = {
        value: ACTIONS.VIEW,
        type: 'ver',
        disabled: false
      };

      plan['enviar'] = {
        value: undefined,
        type: 'enviar',
        disabled: true,
        hidden: true
      };

      plan['ver_ob'] = {
        value: undefined,
        type: 'ver',
        disabled: true,
        hidden: true
      };
    }
  }

  // --------------------------------------------------
  // Estado del proyecto curricular
  // --------------------------------------------------

  obtenerEstadoProyecto(plan: PlanEstudioFila): string {

    const proyecto = this.proyectos().find(
      p => p.Id === plan.ProyectoAcademicoId
    );

    if (!proyecto) {
      return '';
    }

    return proyecto.Activo ? 'Activo' : 'Inactivo';
  }

  // --------------------------------------------------
  // Filtro
  // --------------------------------------------------

  aplicarFiltro(event: Event): void {

    const input = event.target as HTMLInputElement;

    this.filtro.set(input.value);

    // Reiniciar la paginación al aplicar un filtro.
    this.dataPlanesEstudio.paginator?.firstPage();
  }

  limpiarFiltro(): void {
    this.filtro.set('');
    this.dataPlanesEstudio.paginator?.firstPage();
  }

  crearPlan(): void {
    console.log(this.proyectos)
    const dialogRef = this.dialog.open(CrearPlanesComponent, {
      width: '95vw',
      height: '92vh',
      maxWidth: '1600px',
      maxHeight: '95vh',
      disableClose: true,
      panelClass: 'dialog-crear-plan',
      data: {
        proyectos: this.proyectos()
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado === true) {
        this.loadStudyPlanTable();
      }
    });
  }
}