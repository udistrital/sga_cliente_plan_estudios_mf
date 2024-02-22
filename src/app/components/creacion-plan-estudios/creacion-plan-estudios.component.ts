import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { UtilidadesService } from 'src/app/services/utilidades.service';
import { FORM_PLAN_ESTUDIO, FORM_PLAN_ESTUDIO_EDICION } from 'src/app/form-plan_estudio';
import { ProyectoAcademicoService } from 'src/app/services/proyecto_academico.service';
//import { LocalDataSource } from 'ng2-smart-table';
//import { Ng2StButtonComponent } from '../../../@theme/components';
import { MatTableDataSource } from '@angular/material/table';
import { ACTIONS, MODALS, ROLES, VIEWS } from 'src/app/models/diccionario';
import { animate, style, transition, trigger } from '@angular/animations';
import { SgaMidService } from 'src/app/services/sga_mid.service';
import { PlanEstudiosService } from 'src/app/services/plan_estudios.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { HttpErrorResponse } from '@angular/common/http';
import { PlanEstudio } from 'src/app/models/plan_estudio';
import { NewNuxeoService } from 'src/app/services/new_nuxeo.service';
import { EstadoAprobacion, STD } from 'src/app/models/estado_aprobacion';
import { PlanEstudioBaseComponent } from '../plan-estudio-base/plan-estudio-base.component';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { ImplicitAutenticationService } from 'src/app/services/implicit_autentication.service';
import { DialogVerObservacionComponent } from '../dialog-ver-observacion/dialog-ver-observacion.component';

@Component({
  selector: 'creacion-plan-estudios',
  templateUrl: './creacion-plan-estudios.component.html',
  styleUrls: ['./creacion-plan-estudios.component.scss'],
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
      useValue: { displayDefaultIndicatorType: false },
    },
  ]
})
export class CreacionPlanEstudiosComponent extends PlanEstudioBaseComponent implements OnInit {
  displayedColumnsPlanesEstudio: string[] = ['plan_estudios', 'proyecto_curricular', 'resolucion', 'estado', 'total_creditos', 'plan_estudios_ciclos', 'ver_editar', 'observacion', 'enviar'];
  displayedColumnsEspaciosAcademicos: string[] = ['#', 'nombre', 'pre_requisitos', 'clase', 'creditos', 'acciones'];
  displayedColumnsSemestre: string[] = ['nombre', 'creditos', 'htd', 'htc', 'hta', 'OB', 'OC', 'EI', 'EE', 'CP', 'ENFQ_TEO', 'ENFQ_PRAC', 'ENFQ_TEOPRAC', 'acciones'];
  displayedColumnsStudy: string[] = ['plan_estudio', 'proyectoCurricular', 'resolucion', 'estado', 'totalCreditos', 'planPorCiclos', 'acciones'];

  constructor(
    translate: TranslateService,
    popUpManager: PopUpManager,
    projectService: ProyectoAcademicoService,
    sgaMidService: SgaMidService,
    domSanitizer: DomSanitizer,
    planEstudiosService: PlanEstudiosService,
    gestorDocumentalService: NewNuxeoService,
    autenticationService: ImplicitAutenticationService,
    private dialog: MatDialog
  ) {
    super(translate, popUpManager, projectService,
      sgaMidService, domSanitizer, planEstudiosService,
      gestorDocumentalService, autenticationService);
    //this.dataPlanesEstudio = new LocalDataSource();
    // this.dataSimpleStudyPlans = new LocalDataSource();
    // this.dataOrganizedStudyPlans = new LocalDataSource();
    // this.dataEspaciosAcademicos = new LocalDataSource();
    this.dataSemestre = [];
    this.dataSemestreTotal = [];
    //this.dataSemestreTotalTotal = new LocalDataSource();
    this.translate.onLangChange.subscribe(() => {
      //this.createTablePlanesEstudio();
      //this.createTableEspaciosAcademicos();
      //this.createTableSemestre();
      //this.createTableSemestreTotal();
    })
  }

  async ngOnInit() {
    this.personaId = await Number(window.localStorage.getItem('persona_id'));
    await this.setRoles();
    this.loading = false;
    this.vista = VIEWS.LIST;
    await this.loadSelects().then(async () => {
      await this.loadStudyPlanTable();
    });
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
  //     title: this.translate.instant('GLOBAL.ver_editar'),
  //     editable: false,
  //     width: '5%',
  //     filter: false,
  //     type: 'custom',
  //     renderComponent: Ng2StButtonComponent,
  //     onComponentInitFunction: (instance: any) => {
  //       instance.valueChanged.subscribe((out: any) => {
  //         if (out.rowData.ver.type == "editar") {
  //           this.prepareFormUpdateStudyPlan(out.rowData);
  //         } else {
  //           this.viewStudyPlan(out.rowData);
  //         }
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
  //     onComponentInitFunction: (instance: any) => {
  //       instance.valueChanged.subscribe((out: any) => {
  //         this.viewObservation(out.rowData);
  //       })
  //     }
  //   };
  //   tableColumns['enviar'] = {
  //     title: this.translate.instant('GLOBAL.enviar'),
  //     editable: false,
  //     width: '5%',
  //     filter: false,
  //     type: 'custom',
  //     renderComponent: Ng2StButtonComponent,
  //     onComponentInitFunction: (instance: any) => {
  //       instance.valueChanged.subscribe((out: any) => {
  //         this.send2ReviewStudyPlan(out.rowData);
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
      let rolAdmin = this.personaRoles.find(role => (role == ROLES.ADMIN_SGA || role == ROLES.VICERRECTOR || role == ROLES.ASESOR_VICE));
      let rolCoordinador = this.personaRoles.find(role => (role == ROLES.COORDINADOR || role == ROLES.COORDINADOR_PREGADO || role == ROLES.COORDINADOR_POSGRADO || role == ROLES.ADMIN_DOCENCIA));

      // Datos de la tabla planes de estudio
      if (rolAdmin) {
        this.loading = true;
        await this.loadPlanesEstudio().then(planes => {
          this.planesEstudio = planes;
          this.planesEstudio.forEach(plan => {
            this.organizarDatosTablaPlanEstudio(plan);
          });
          //this.dataPlanesEstudio.load(this.planesEstudio);
          this.dataPlanesEstudio = new MatTableDataSource<any>(this.planesEstudio);
          this.loading = false;
        }).catch(err => {
          this.loading = false;
          this.popUpManager.showPopUpGeneric(
            this.translate.instant('plan_estudios.plan_estudios'),
            this.translate.instant('ERROR.sin_informacion_en') + ': <b>' + this.translate.instant('plan_estudios.plan_estudios') + '</b>.',
            MODALS.WARNING, false);
        });
      } else if (rolCoordinador) {
        await this.loadPlanesEstudioPorTerceroVinculacion(this.personaId).then((planes) => {
          if (planes.length > 0) {
            this.planesEstudio = planes;
            this.planesEstudio.forEach(plan => {
              this.organizarDatosTablaPlanEstudio(plan);
            });
            //this.dataPlanesEstudio.load(this.planesEstudio);
            this.dataPlanesEstudio = new MatTableDataSource<any>(this.planesEstudio);

            this.loading = false;
          } else {
            this.hideButtons = true;
            this.loading = false;
            this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.plan_estudios_sin_vinculacion_error'));
          }
        }).catch((error) => {
          this.hideButtons = true;
          this.loading = false;
          this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.plan_estudios_sin_vinculacion_error'));
        });
      } else {
        this.hideButtons = true;
        this.loading = false;
        this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.plan_estudios_sin_vinculacion_error'));
      }
    } catch (error: any) {
      this.loading = false;
      this.hideButtons = true;
      const falloEn = Object.keys(error)[0];
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('ERROR.fallo_informacion_en') + ': <b>' + falloEn + '</b>.<br><br>' +
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
    }
  }

  organizarDatosTablaPlanEstudio(plan: any) {
    const proyecto = this.proyectos.find(proyecto => proyecto.Id == plan.ProyectoAcademicoId);
    if (proyecto) {
      plan["proyectoCurricular"] = proyecto["Nombre"];
    } else {
      plan["proyectoCurricular"] = "";
    }


    plan["plan_estudio"] = plan["Nombre"];
    plan["resolucion"] = plan["NumeroResolucion"];
    plan["totalCreditos"] = plan["TotalCreditos"];

    const estado = plan["EstadoAprobacionId"];
    if (estado) {
      plan["estado"] = estado["Nombre"];
    } else {
      plan["estado"] = "";
    }

    plan["planPorCiclos"] = plan["EsPlanEstudioPadre"] ? this.translate.instant('GLOBAL.si') : this.translate.instant('GLOBAL.no');

    this.setButtonByStatePlan(plan);
  }

  setButtonByStatePlan(plan: any) {
    const estado = plan["EstadoAprobacionId"];

    if (estado) {
      if (estado["CodigoAbreviacion"] == STD.IN_EDIT || estado["CodigoAbreviacion"] == STD.WITH_OB) {
        plan["ver"] = { value: ACTIONS.EDIT, type: 'editar', disabled: false };
        plan["enviar"] = { value: ACTIONS.SEND, type: 'enviar', disabled: false };
        if (plan["RevisorId"] == 0 || plan["RevisorId"] == undefined || plan["RevisorId"] == null) {
          plan["ver_ob"] = { value: undefined, type: 'ver', disabled: true, hidden: true };
        } else {
          plan["ver_ob"] = { value: ACTIONS.VIEW, type: 'ver', disabled: false };
        }
      } else {
        plan["ver"] = { value: ACTIONS.VIEW, type: 'ver', disabled: false };
        plan["enviar"] = { value: undefined, type: 'enviar', disabled: true, hidden: true };
        plan["ver_ob"] = { value: undefined, type: 'ver', disabled: true, hidden: true };
      }
    } else {
      plan["ver"] = { value: ACTIONS.VIEW, type: 'ver', disabled: false };
      plan["enviar"] = { value: ACTIONS.SEND, type: 'enviar', disabled: false };
      plan["ver_ob"] = { value: undefined, type: 'ver', disabled: true, hidden: true };
    }
  }

  override async salirEdicionFormulario() {
    await super.cancelar();
    await this.loadStudyPlanTable();
  }

  nuevoPlanEstudio() {
    this.mainAction = ACTIONS.CREATE;
    this.enEdicionPlanEstudio = true;
    this.modoCreacion = true;
    this.esPlanEstudioPadre = false;
    this.crearFormulario(FORM_PLAN_ESTUDIO);
    //this.createTableEspaciosAcademicos();
    //this.createTableSemestreTotal();
    this.totalTotal();
    this.vista = VIEWS.FORM;
    // this.dataEspaciosAcademicos.load([]);
    this.dataEspaciosAcademicos = new MatTableDataSource<any>([]);
  }

  guardar(stepper: MatStepper) {
    this.formGroupPlanEstudio.markAllAsTouched();
    if (this.formGroupPlanEstudio.valid) {
      this.popUpManager.showPopUpGeneric(
        this.translate.instant('plan_estudios.plan_estudios'),
        this.translate.instant('plan_estudios.seguro_crear'),
        MODALS.INFO,
        true).then(
          (action) => {
            if (action.value) {
              if (this.modoCreacion) {
                this.prepareCreate(stepper);
              } else {
                this.prepareUpdate(stepper);
              }
            }
          });
    }
  }

  async prepareCreate(stepper: MatStepper) {
    this.loading = true;
    let newPlanEstudio = new PlanEstudio();
    newPlanEstudio.Nombre = this.formGroupPlanEstudio.get('nombrePlanEstudio')!.value;
    newPlanEstudio.NumeroResolucion = Number(this.formGroupPlanEstudio.get('numeroResolucion')!.value);
    newPlanEstudio.NumeroSemestres = Number(this.formGroupPlanEstudio.get('numeroSemestres')!.value);
    newPlanEstudio.ProyectoAcademicoId = Number(this.formGroupPlanEstudio.get('proyectoCurricular')!.value["Id"]);
    newPlanEstudio.TotalCreditos = Number(this.formGroupPlanEstudio.get('totalCreditosPrograma')!.value);
    newPlanEstudio.AnoResolucion = Number(this.formGroupPlanEstudio.get('anioResolucion')!.value);
    newPlanEstudio.Codigo = this.formGroupPlanEstudio.get('codigoPlanEstudio')!.value;
    newPlanEstudio.EsPlanEstudioPadre = this.esPlanEstudioPadre;

    const archivos = this.prepararArchivos();
    let idsArchivos: any[] = [];
    if (Array.isArray(archivos) && archivos.length) {
      idsArchivos = await this.cargarArchivos(archivos);
    }
    newPlanEstudio.SoporteDocumental = this.prepareIds2Stringify(idsArchivos, "SoporteDocumental");
    this.loading = false;

    this.createStudyPlan(newPlanEstudio).then((res: any) => {
      this.planEstudioBody = res;
      if (this.esPlanEstudioPadre) {
        this.modoCreacion = false;
        this.planEstudioPadreAsignado2Form = false;
        //this.dataOrganizedStudyPlans = new LocalDataSource();
        stepper.next();
      } else {
        this.modoCreacion = false;
        this.consultarEspaciosAcademicos(this.proyecto_id).then((result) => {
          this.ListEspacios = result;
          //this.dataEspaciosAcademicos.load(this.ListEspacios);
          this.dataEspaciosAcademicos = new MatTableDataSource<any>(this.ListEspacios);
          this.planEstudioPadreAsignado2Form = false;
          stepper.next();
        }, (error) => {
          this.ListEspacios = [];
          const falloEn = Object.keys(error)[0];
          this.popUpManager.showPopUpGeneric(
            this.translate.instant('ERROR.titulo_generico'),
            this.translate.instant('ERROR.fallo_informacion_en') + ': <b>' + falloEn + '</b>.<br><br>' +
            this.translate.instant('ERROR.persiste_error_comunique_OAS'),
            MODALS.ERROR, false);
        });
      }
    });
  }

  createStudyPlan(planEstudioBody: PlanEstudio) {
    return new Promise((resolve, reject) => {
      this.loading = true;
      this.sgaMidService.post('plan_estudios/base', planEstudioBody)
        .subscribe((res: any) => {
          this.loading = false;
          this.popUpManager.showSuccessAlert(this.translate.instant('plan_estudios.plan_estudios_creacion_ok'));
          resolve(res.Data);
        },
          (error: HttpErrorResponse) => {
            this.loading = false;
            this.popUpManager.showErrorAlert(
              this.translate.instant('plan_estudios.plan_estudios_creacion_error')
            );
          });
    });
  }
  //#endregion
  // * ----------

  // * ----------
  // * Actualizar plan de estudios datos básicos 
  //#region
  async prepareUpdate(stepper: MatStepper) {
    this.loading = true;
    const archivos = await this.prepararArchivos();
    let idsArchivos: any[] = [];
    if (Array.isArray(archivos) && archivos.length) {
      idsArchivos = await this.cargarArchivos(archivos);
    }

    let soportesPlan = this.str2JsonValidated(this.planEstudioBody.SoporteDocumental);
    let totalSoportes = [];
    if (soportesPlan) {
      const listaIdsSoporte = soportesPlan["SoporteDocumental"];
      if (Array.isArray(listaIdsSoporte)) {
        totalSoportes.push(...listaIdsSoporte);
      }
    }
    if (Array.isArray(idsArchivos)) {
      totalSoportes.push(...idsArchivos);
    }

    this.planEstudioBody.Nombre = this.formGroupPlanEstudio.get('nombrePlanEstudio')!.value;
    this.planEstudioBody.NumeroResolucion = Number(this.formGroupPlanEstudio.get('numeroResolucion')!.value);
    this.planEstudioBody.NumeroSemestres = Number(this.formGroupPlanEstudio.get('numeroSemestres')!.value);
    this.planEstudioBody.TotalCreditos = Number(this.formGroupPlanEstudio.get('totalCreditosPrograma')!.value);
    this.planEstudioBody.AnoResolucion = Number(this.formGroupPlanEstudio.get('anioResolucion')!.value);
    this.planEstudioBody.Codigo = this.formGroupPlanEstudio.get('codigoPlanEstudio')!.value;
    this.planEstudioBody.SoporteDocumental = await this.prepareIds2Stringify(totalSoportes, "SoporteDocumental");
    this.updateStudyPlan(this.planEstudioBody).then((res) => {
      if (res) {
        const semestresMax = Number(this.formGroupPlanEstudio.get('numeroSemestres')!.value);
        this.numSemestresCompletado = this.dataSemestre.length === semestresMax;
        stepper.next();
      }
    });
  }

  limpiar() {
    this.popUpManager.showPopUpGeneric(this.translate.instant('plan_estudios.plan_estudios'),
      this.translate.instant('plan_estudios.seguro_limpiar'), MODALS.QUESTION, true).then(
        (action) => {
          if (action.value) {
            this.formGroupPlanEstudio.reset();
            let valorEsPlanPadre = this.esPlanEstudioPadre ? this.translate.instant('GLOBAL.si') : this.translate.instant('GLOBAL.no');
            this.formGroupPlanEstudio.patchValue({ planPorCiclos: valorEsPlanPadre });
          }
        }
      );
  }
  //#endregion
  // * ----------

  // * ----------
  // * Reaccionar a cambios de formularios 
  //#region
  cambioEn(event: any): void {
    if (this.modoCreacion) {
      const fieldNombre = Object.keys(event)[0];
      switch (fieldNombre) {
        case 'nivel':
          if (event.nivel) {
            this.formPlanEstudio['subnivel'].opciones = this.niveles.filter(nivel => nivel.NivelFormacionPadreId && (nivel.NivelFormacionPadreId.Id == event.nivel.Id));
          } else {
            this.formPlanEstudio['subnivel'].opciones = [];
            this.formGroupPlanEstudio.patchValue({ subnivel: undefined });
          }
          break;

        case 'subnivel':
          if (event.subnivel) {
            this.formPlanEstudio['proyectoCurricular'].opciones = this.proyectos.filter(proyecto => proyecto.NivelFormacionId && (proyecto.NivelFormacionId.Id == event.subnivel.Id));
          } else {
            this.formPlanEstudio['proyectoCurricular'].opciones = [];
            this.formGroupPlanEstudio.patchValue({ proyectoCurricular: undefined });
          }
          break;

        case 'proyectoCurricular':
          if (event.proyectoCurricular) {
            this.formPlanEstudio['codigoProyecto'].valor = event.proyectoCurricular.Codigo;
            this.formGroupPlanEstudio.patchValue({ codigoProyecto: event.proyectoCurricular.Codigo });
            this.proyecto_id = event.proyectoCurricular.Id;
          } else {
            this.formPlanEstudio['codigoProyecto'].valor = undefined;
            this.formGroupPlanEstudio.patchValue({ codigoProyecto: undefined });
          }
          break;

        default:
          break;
      }
    }
  }
  //#endregion
  // * ----------

  //--------------- AQUIIII -----------------//
  /*
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

  // * ----------
  // * Crear plan de estudios datos básicos 
  //#region

  // * ----------
  // * Enviar plan de estudios a revision
  //#region
  send2ReviewStudyPlan(planEstudioBody: PlanEstudio) {
    this.popUpManager.showPopUpGeneric(
      this.translate.instant('plan_estudios.plan_estudios'),
      this.translate.instant('plan_estudios.enviar_revision_pregunta'), MODALS.INFO, true).
      then(
        action => {
          if (action.value) {
            this.loading = true;
            if (this.estadosAprobacion) {
              const matchingEstado = this.estadosAprobacion.find(estado => estado.CodigoAbreviacion === STD.IN_REV);
              if (matchingEstado) {
                planEstudioBody.EstadoAprobacionId = matchingEstado;
              }
            }
            this.planEstudiosService.put('plan_estudio/', planEstudioBody).
              subscribe(
                async (resp: any) => {
                  if (resp.Status == "200") {
                    this.loading = false;
                    const reload = new Promise(resolve => {
                      this.loadStudyPlanTable();
                      this.vista = VIEWS.LIST;
                      resolve(true);
                    });
                    this.popUpManager.showSuccessAlert(
                      this.translate.instant('plan_estudios.enviar_revision_ok'));
                    await reload;
                  } else {
                    this.loading = false;
                    this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.enviar_revision_fallo'));
                  }
                },
                err => {
                  this.loading = false;
                  this.popUpManager.showErrorAlert(this.translate.instant('plan_estudios.enviar_revision_fallo'));
                });
          }
        });
  }
  //#endregion
  // * ----------

  prepareFormUpdateStudyPlan(planEstudioBody: PlanEstudio) {
    const idPlan = planEstudioBody.Id;
    this.mainAction = ACTIONS.EDIT;
    this.enEdicionPlanEstudio = true;

    this.consultarPlanEstudio(idPlan).then((res) => {
      this.planEstudioBody = res;
      this.esPlanEstudioPadre = this.planEstudioBody.EsPlanEstudioPadre ? true : false;
      this.proyecto_id = this.planEstudioBody.ProyectoAcademicoId;
      this.crearFormulario(FORM_PLAN_ESTUDIO_EDICION);
      if (this.esPlanEstudioPadre) {
        this.createSimpleTableStudyPlan();
        this.createTableOrganizedStudyPlan();
        this.dataOrganizedStudyPlans = new LocalDataSource();
        this.vista = VIEWS.SECONDARY_FORM;
      } else {
        this.createTableEspaciosAcademicos();
        this.createTableSemestreTotal();
        this.totalTotal();
        this.vista = VIEWS.FORM;
        this.enEdicionSemestreNuevo = false;
        this.enEdicionSemestreViejo = false;
      }
    }, (error) => {
      this.loading = false;
      this.vista = VIEWS.LIST;
      this.popUpManager.showPopUpGeneric(
        this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('plan_estudios.error_cargando_datos_formulario') + '</b>.<br><br>' +
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
    }
    );
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
  */
}
