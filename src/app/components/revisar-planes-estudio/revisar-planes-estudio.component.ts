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
import { MatStepper } from '@angular/material/stepper';
import { HttpErrorResponse } from '@angular/common/http';
import { PlanEstudio } from 'src/app/models/plan_estudio'; 
import { NewNuxeoService } from 'src/app/services/new_nuxeo.service'; 
import { STD } from 'src/app/models/estado_aprobacion'; 
import { PlanEstudioBaseComponent } from '../plan-estudio-base/plan-estudio-base.component'; 
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { ImplicitAutenticationService } from 'src/app/services/implicit_autentication.service'; 
import { PlanEstudioSummary } from 'src/app/models/plan_estudio_summary';
import { MatTableDataSource } from '@angular/material/table';

import { EspaciosAcademicosService } from "src/app/services/espacios_academicos.service";
import { ParametrosService } from "src/app/services/parametros.service";
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'revisar-planes-estudio',
  templateUrl: './revisar-planes-estudio.component.html',
  styleUrls: ['./revisar-planes-estudio.component.scss'],
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
      useValue: {displayDefaultIndicatorType: false},
    },
  ]
})
export class RevisarPlanesEstudioComponent extends PlanEstudioBaseComponent implements OnInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator
  override displayedColumnsPlanesEstudio: string[] = ['plan_estudios', 'proyecto_curricular', 'resolucion', 'estado', 'total_creditos', 'plan_estudios_ciclos', 'ver'];

  constructor(
    translate: TranslateService,
    popUpManager: PopUpManager,
    projectService: ProyectoAcademicoService,
    sgaMidService: SgaMidService,
    domSanitizer: DomSanitizer,
    planEstudiosService: PlanEstudiosService,
    gestorDocumentalService: NewNuxeoService,
    autenticationService: ImplicitAutenticationService,
    espaciosAcademicosService: EspaciosAcademicosService,
    parametrosService: ParametrosService
  ) {
    super(translate, popUpManager, projectService, 
      sgaMidService, domSanitizer, planEstudiosService, 
      gestorDocumentalService, autenticationService, espaciosAcademicosService, parametrosService);
    // this.dataPlanesEstudio = new LocalDataSource();
    // this.dataSimpleStudyPlans = new LocalDataSource();
    // this.dataOrganizedStudyPlans = new LocalDataSource();
    // this.dataEspaciosAcademicos = new LocalDataSource();
    // this.dataSemestre = [];
    // this.dataSemestreTotal = [];
    // this.dataSemestreTotalTotal = new LocalDataSource();
    this.translate.onLangChange.subscribe(() => {
    //   this.createTablePlanesEstudio();
    //   this.createTableEspaciosAcademicos();
    //   this.createTableSemestre();
    //   this.createTableSemestreTotal();
    })
   }

  async ngOnInit() {
    this.personaId = await Number(window.localStorage.getItem('persona_id'));
    await this.setRoles();
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
  //         this.generarPlanEstudioVisualizacion(out.rowData);
  //       })
  //     }
  //   };
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
  loadStudyPlanTable() {
    this.loading = true;
    try {
      console.log("Roles encontrados, ", this.personaRoles)
      let rolAdmin = this.personaRoles.find(role => (role == ROLES.ADMIN_SGA || role == ROLES.VICERRECTOR || role == ROLES.ASESOR_VICE));
      let rolCoordinador = this.personaRoles.find(role => (role == ROLES.COORDINADOR || role == ROLES.COORDINADOR_PREGADO || role == ROLES.COORDINADOR_POSGRADO));
      
      // Datos de la tabla planes de estudio
      if (rolAdmin) {
        console.log("Rol admin");
        
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
      } else if (rolCoordinador) {
        console.log("Rol coordinador filtrando tercero");
        this.loadPlanesEstudioPorTerceroVinculacion(this.personaId).then((planes) => {
          if (planes.length > 0) {
            this.planesEstudio = planes;
            this.planesEstudio.forEach(plan => {
              this.organizarDatosTablaPlanEstudio(plan);
            });
            //this.dataPlanesEstudio.load(this.planesEstudio);
            this.dataPlanesEstudio = new MatTableDataSource<any>(this.planesEstudio);
            this.dataPlanesEstudio.paginator = this.paginator
            this.loading = false;
          } else {
            this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.plan_estudios_sin_vinculacion_error'));
            this.loading = false;
          }
        }).catch((error) => {
          this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.plan_estudios_sin_vinculacion_error'));
          this.loading = false;
        });
      } else {
        this.loadPlanesEstudioPorTerceroVinculacion(this.personaId).then((planes) => {
          if (planes.length > 0) {
            this.planesEstudio = planes;
            this.planesEstudio.forEach(plan => {
              this.organizarDatosTablaPlanEstudio(plan);
            });
            //this.dataPlanesEstudio.load(this.planesEstudio);
            this.dataPlanesEstudio = new MatTableDataSource<any>(this.planesEstudio);
            this.dataPlanesEstudio.paginator = this.paginator
            this.loading = false;
          } else {
            this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.plan_estudios_sin_vinculacion_error'));
            this.loading = false;
          }
        }).catch((error) => {
          this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.plan_estudios_sin_vinculacion_error'));
          this.loading = false;
        });
      }
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
  }
  //#endregion
  // * ----------

  // * ----------
  // * Cargar datos plan de estudio tabla
  //#region
  generarPlanEstudioVisualizacion(planEstudioBody: PlanEstudio){
    this.loading = true;
    const idPlan = planEstudioBody.Id;
    this.consultarPlanEstudio(idPlan).then((res) => {
      this.planEstudioBody = res;
      this.generarPlanEstudio();
    }, (error) => {
      this.loading = false;
      this.vista = VIEWS.LIST;
      this.popUpManager.showPopUpGeneric(
        this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('plan_estudios.error_cargando_datos_formulario') + '</b>.<br><br>' +
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
    });
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
  //#endregion
  // * ----------
}
