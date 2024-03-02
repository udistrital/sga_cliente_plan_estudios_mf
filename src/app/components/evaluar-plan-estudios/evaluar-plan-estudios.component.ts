import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';  
import { UtilidadesService } from 'src/app/services/utilidades.service'; 
import { FORM_PLAN_ESTUDIO } from 'src/app/form-plan_estudio'; 
import { ProyectoAcademicoService } from 'src/app/services/proyecto_academico.service';
//import { LocalDataSource } from 'ng2-smart-table';
//import { Ng2StButtonComponent } from '../../../@theme/components';
import { ACTIONS, MODALS, ROLES, VIEWS } from 'src/app/models/diccionario'; 
import { animate, style, transition, trigger } from '@angular/animations';
import { SgaMidService } from 'src/app/services/sga_mid.service'; 
import { PlanEstudiosService } from 'src/app/services/plan_estudios.service'; 
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { MatTableDataSource } from '@angular/material/table';
import { HttpErrorResponse } from '@angular/common/http';
import { PlanEstudio } from 'src/app/models/plan_estudio'; 
import { NewNuxeoService } from 'src/app/services/new_nuxeo.service';
import { PlanEstudioBaseComponent } from '../plan-estudio-base/plan-estudio-base.component'; 
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { ImplicitAutenticationService } from 'src/app/services/implicit_autentication.service';
import { PlanEstudioSummary } from 'src/app/models/plan_estudio_summary'; 
import { DialogoEvaluarComponent } from '../dialogo-evaluar/dialogo-evaluar.component';
import { DialogVerObservacionComponent } from '../dialog-ver-observacion/dialog-ver-observacion.component';
import { UserService } from "src/app/services/users.service";

import { EspaciosAcademicosService } from "src/app/services/espacios_academicos.service";
import { ParametrosService } from "src/app/services/parametros.service";
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'evaluar-plan-estudios',
  templateUrl: './evaluar-plan-estudios.component.html',
  styleUrls: ['./evaluar-plan-estudios.component.scss'],
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
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false }
    }
  ]
})
export class EvaluarPlanEstudiosComponent extends PlanEstudioBaseComponent implements OnInit {

  override dataPlanes?: PlanEstudioSummary = undefined;
  role!: Array<String>
  @ViewChild(MatPaginator) paginator!: MatPaginator
  
  displayedColumnsStudy: string[] = ['plan_estudio', 'proyectoCurricular', 'resolucion', 'estado', 'totalCreditos', 'planPorCiclos', 'acciones'];
  override displayedColumnsPlanesEstudio: string[] = ['plan_estudios', 'proyecto_curricular', 'resolucion', 'estado', 'total_creditos', 'plan_estudios_ciclos', 'ver', 'observacion', 'evaluar'];

  constructor(
    public dialog: MatDialog,
    translate: TranslateService,
    popUpManager: PopUpManager,
    projectService: ProyectoAcademicoService,
    sgaMidService: SgaMidService,
    domSanitizer: DomSanitizer,
    planEstudiosService: PlanEstudiosService,
    gestorDocumentalService: NewNuxeoService,
    userService: UserService,
    autenticationService: ImplicitAutenticationService,
    espaciosAcademicosService: EspaciosAcademicosService,
    parametrosService: ParametrosService
  ) {
    super(translate, popUpManager, projectService,
      sgaMidService, domSanitizer, planEstudiosService,
      gestorDocumentalService, userService, autenticationService, espaciosAcademicosService, parametrosService);

    // this.dataPlanesEstudio = new LocalDataSource();
    // this.dataSimpleStudyPlans = new LocalDataSource();
    // this.dataOrganizedStudyPlans = new LocalDataSource();
    // this.dataEspaciosAcademicos = new LocalDataSource();
    // this.dataSemestre = [];
    // this.dataSemestreTotal = [];
    // this.dataSemestreTotalTotal = new LocalDataSource();

    // this.translate.onLangChange.subscribe(() => {
    //   this.createTablePlanesEstudio();
    //   this.createTableEspaciosAcademicos();
    //   this.createTableSemestre();
    //   this.createTableSemestreTotal();
    // })
   }

  async ngOnInit() {
    this.loading = false;
    this.vista = VIEWS.LIST;
    this.dataPlanesEstudio = new MatTableDataSource<any>([])
    this.dataSimpleStudyPlans = new MatTableDataSource<any>([])
    this.dataOrganizedStudyPlans = new MatTableDataSource<any>([])
    this.dataEspaciosAcademicos = new MatTableDataSource<any>([])
    this.dataSemestre = new MatTableDataSource<any>([])
    this.dataSemestreTotal = [];
    this.dataSemestreTotalTotal = new MatTableDataSource<any>([])
    // this.loadSelects().then(() => {
    //   this.loadStudyPlanTable();
    // });
    await this.loadSelects();
    await this.loadStudyPlanTable();
    //this.createTablePlanesEstudio();
    this.gestorDocumentalService.clearLocalFiles();
    this.habilitarGenerarPlan();
  }

  async getRole(){
    this.loading = true;
    try {
      await this.autenticationService.getRole().then((rol: any) => {
        this.role = rol;
        this.loading = false;
      });
    } catch (error: any) {
      const falloEn = Object.keys(error)[0];
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('ERROR.fallo_informacion_en') + ': <b>' + falloEn + '</b>.<br><br>' +
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
      this.loading = false;
    }
  }

  // * ----------
  // * Crear tabla de lista planes estudio
  //#region
  // createTablePlanesEstudio() {
  //   let tableColumns = <any>UtilidadesService.hardCopy(this.studyPlanTableColumns);
  //   tableColumns['ver'] = {
  //     title: this.translate.instant('GLOBAL.ver'),
  //     editable: false,
  //     width: '5%',
  //     filter: false,
  //     type: 'custom',
  //     renderComponent: Ng2StButtonComponent,
  //     onComponentInitFunction: (instance) => {
  //       instance.valueChanged.subscribe((out) => {
  //         this.viewStudyPlan(out.rowData);
  //       })
  //     }
  //   };
  //   tableColumns['ver_ob'] = {
  //     title: this.translate.instant('GLOBAL.ver_ob'),
  //     editable: false,
  //     width: '5%',
  //     filter: false,
  //     type: 'custom',
  //     renderComponent: Ng2StButtonComponent,
  //     onComponentInitFunction: (instance) => {
  //       instance.valueChanged.subscribe((out) => {
  //         this.viewObservation(out.rowData);
  //       })
  //     }
  //   };
  //   tableColumns['evaluar'] = {
  //     title: this.translate.instant('GLOBAL.evaluar'),
  //     editable: false,
  //     width: '5%',
  //     filter: false,
  //     type: 'custom',
  //     renderComponent: Ng2StButtonComponent,
  //     onComponentInitFunction: (instance) => {
  //       instance.valueChanged.subscribe((out) => {
  //         this.approve2StudyPlan(out.rowData);
  //       })
  //     }
  //   }
  //   this.tbPlanesEstudio = {
  //     columns: tableColumns,
  //     hideSubHeader: false,
  //     mode: 'external',
  //     actions: false,
  //     noDataMessage: this.translate.instant('GLOBAL.table_no_data_found')
  //   };
  // }
  //#endregion
  // * ----------

  // * ----------
  // * Cargar datos plan de estudio tabla
  //#region
  async loadStudyPlanTable() {
    this.loading = true;
    try {
      this.planesEstudio = await this.loadPlanesEstudio();
      this.planesEstudio.forEach(plan => {
        this.organizarDatosTablaPlanEstudio(plan);
      });
      //this.dataPlanesEstudio.load(this.planesEstudio);
      this.dataPlanesEstudio = new MatTableDataSource<any>(this.planesEstudio);
      this.dataPlanesEstudio.paginator = this.paginator
      this.loading = false;
    } catch (error: any) {
      const falloEn = Object.keys(error)[0];
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('ERROR.fallo_informacion_en') + ': <b>' + falloEn + '</b>.<br><br>' +
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
      this.loading = false;
    }
  }

  organizarDatosTablaPlanEstudio(plan: any) {
    const proyecto = this.proyectos.find(proyecto => proyecto.Id == plan.ProyectoAcademicoId);
    plan["proyectoCurricular"] = proyecto["Nombre"];

    plan["plan_estudio"] = plan["Nombre"];
    plan["resolucion"] = plan["NumeroResolucion"];
    plan["totalCreditos"] = plan["TotalCreditos"];

    const estado = plan["EstadoAprobacionId"];
    plan["estado"] = estado["Nombre"];
    plan["planPorCiclos"] = plan["EsPlanEstudioPadre"] ? this.translate.instant('GLOBAL.si') : this.translate.instant('GLOBAL.no');

    plan["ver"] = { value: ACTIONS.VIEW, type: 'ver', disabled: false };
    plan["evaluar"] = { value: ACTIONS.EVALUATE, type: 'evaluar', disabled: false };
    if (plan["RevisorId"] == 0 || plan["RevisorId"] == undefined || plan["RevisorId"] == null) {
      plan["ver_ob"] = { value: undefined, type: 'ver', disabled: true, hidden: true };
    } else {
      plan["ver_ob"] = { value: ACTIONS.VIEW, type: 'ver', disabled: false };
    }
  }

  async recargarPlanEstudios() {
    this.loading = true;
    this.loadPlanesEstudio().then(planes => {
      this.planesEstudio = planes;
      this.planesEstudio.forEach(plan => {
        this.organizarDatosTablaPlanEstudio(plan);
      });
      //this.dataPlanesEstudio.load(this.planesEstudio);
      this.dataPlanesEstudio = new MatTableDataSource<any>(this.planesEstudio);
      this.dataPlanesEstudio.paginator = this.paginator
      this.loading = false;
    }).catch(err => {
      this.loading = false;
      this.popUpManager.showPopUpGeneric(
        this.translate.instant('plan_estudios.plan_estudios'),
        this.translate.instant('ERROR.sin_informacion_en') + ': <b>' + this.translate.instant('plan_estudios.plan_estudios') + '</b>.',
        MODALS.WARNING, false);
    });
  }
  //#endregion
  // * ----------

  // * ----------
  // * Reaccionar a cambios de formularios
  //#region
  cambioEn(event: any): void {
  }
  //#endregion
  // * ----------

  // * ----------
  // * Acciones botones
  //#region
  override async cancelar() {
    await super.cancelar();
    this.loadStudyPlanTable();
  }
  override async salirEdicionFormulario() {
    await super.cancelar();
    this.loadStudyPlanTable();
  }
  //#endregion
  // * ----------

  // * ----------
  // * Enviar plan de estudios a aprobación
  //#region

  async approve2StudyPlan(planEstudioBody: PlanEstudio) {
    await this.getRole();
    this.showEvaluationDialog(planEstudioBody);
  }
  //#endregion
  // * ----------

  // * ----------
  // * Visualización de ventana evaluación
  // #region
  showEvaluationDialog(planEstudioBody: PlanEstudio) {
    let persona_id = Number(localStorage.getItem('persona_id'));
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '80vw';
    dialogConfig.height = '590px';
    dialogConfig.data = {
      "tercero_id": persona_id,
      "rol": this.role,
      "estadosAprobacion": this.estadosAprobacion,
      "planEstudioId": planEstudioBody.Id
    };
    const aprobacionDialog = this.dialog.open(DialogoEvaluarComponent, dialogConfig);
    aprobacionDialog.afterClosed().subscribe((response: any) => {
      this.recargarPlanEstudios();
      this.vista = VIEWS.LIST;
    });
  }
  //#endregion
  // * ----------

  // * ----------
  // * Visualización de ventana aprobación
  // #region

  viewObservation(planEstudioBody: PlanEstudio) {
    let persona_id = Number(localStorage.getItem('persona_id'));
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '80vw';
    dialogConfig.height = '510px';
    dialogConfig.data = {
      "tercero_id": persona_id,
      "estadosAprobacion": this.estadosAprobacion,
      "planEstudioId": planEstudioBody.Id
    };
    this.dialog.open(DialogVerObservacionComponent, dialogConfig);
  }

  //#endregion
  // * ----------
}
