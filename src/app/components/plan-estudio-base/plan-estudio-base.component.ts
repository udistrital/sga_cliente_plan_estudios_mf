import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { PopUpManager } from "src/app/managers/popUpManager";
import { UtilidadesService } from "src/app/services/utilidades.service";
import { FORM_PLAN_ESTUDIO, FORM_PLAN_ESTUDIO_VISUALIZACION } from "src/app/form-plan_estudio";
import { FormParams } from "src/app/models/define-form-fields";
import { FormGroup } from "@angular/forms";
import { ProyectoAcademicoService } from "src/app/services/proyecto_academico.service";
//import { LocalDataSource } from "ng2-smart-table";
import { MatTableDataSource } from '@angular/material/table';
import { ACTIONS, MODALS, VIEWS } from "src/app/models/diccionario";
import { SgaMidService } from "src/app/services/sga_mid.service";
import { EspaciosAcademicosService } from "src/app/services/espacios_academicos.service";
import { ParametrosService } from "src/app/services/parametros.service";
import { PlanEstudiosService } from "src/app/services/plan_estudios.service";
import { DomSanitizer } from "@angular/platform-browser";
import { HttpErrorResponse } from "@angular/common/http";
import { PlanEstudio, EspacioEspaciosSemestreDistribucion, PlanCiclosOrdenado } from "src/app/models/plan_estudio";
import { NewNuxeoService } from "src/app/services/new_nuxeo.service";
import { EstadoAprobacion } from "src/app/models/estado_aprobacion";
import { ImplicitAutenticationService } from "src/app/services/implicit_autentication.service";
import { PlanEstudioSummary } from "src/app/models/plan_estudio_summary";

/*@Component({
  selector: "plan-estudio-base",
  template: "",
})*/
export abstract class PlanEstudioBaseComponent {
  loading!: boolean;

  readonly VIEWS = VIEWS;
  vista!: Symbol;

  planEstudioBody: any;
  formPlanEstudio!: FormParams;
  formGroupPlanEstudio!: FormGroup;

  tbPlanesEstudio!: Object;
  planesEstudio!: any[];
  dataPlanesEstudio!: MatTableDataSource<any>;

  tbEspaciosAcademicos!: any;
  dataEspaciosAcademicos!: MatTableDataSource<any>;

  tbSemestre!: any;
  //dataSemestre!: any[];
  dataSemestre!: MatTableDataSource<any>;

  tbSemestreTotal!: any;
  dataSemestreTotal!: any[];
  dataSemestreTotalTotal!: MatTableDataSource<any>;

  planEstudioOrdenadoBody: any;
  tbSimpleStudyPlans!: any;
  simpleStudyPlans!: any[];
  dataSimpleStudyPlans!: MatTableDataSource<any>;

  tbOrganizedStudyPlans!: any;
  dataOrganizedStudyPlans!: MatTableDataSource<any>;

  niveles!: any[];
  proyectos!: any[];

  enEdicionPlanEstudio: boolean = false;
  enEdicionSemestreNuevo: boolean = false;
  enEdicionSemestreViejo: boolean = false;
  modoCreacion: boolean = false;

  numSemestresCompletado: boolean = false;
  habilitadoGenerarPlan: boolean = false;
  esPlanEstudioPadre: boolean = false;
  planEstudioPadreAsignado2Form: boolean = false;

  mainAction!: Symbol;

  punteroSemestrePlan: number = 0;

  estadosAprobacion: EstadoAprobacion[] = [];

  proyecto_id!: number;
  ListEspacios: any[] = [];
  readonly formatototal = {
    nombre: "TOTAL",
    creditos: 0,
    htd: 0,
    htc: 0,
    hta: 0,
    OB: 0,
    OC: 0,
    EI: 0,
    EE: 0,
    CP: 0,
    ENFQ_TEO: 0,
    ENFQ_PRAC: 0,
    ENFQ_TEOPRAC: 0,
  };

  //dataPlanes = undefined as unknown as PlanEstudioSummary
  dataPlanes?: PlanEstudioSummary = undefined;
  personaId!: number;
  personaRoles!: String[];

  hideButtons: boolean = false;

  readonly studyPlanTableColumns = {
    plan_estudio: {
      title: this.translate.instant("plan_estudios.plan_estudios"),
      editable: false,
      width: "20%",
      filter: true,
    },
    proyectoCurricular: {
      title: this.translate.instant("inscripcion.proyecto_curricular"),
      editable: false,
      width: "15%",
      filter: true,
    },
    resolucion: {
      title: this.translate.instant("plan_estudios.resolucion"),
      editable: false,
      width: "10%",
      filter: true,
    },
    estado: {
      title: this.translate.instant("GLOBAL.estado"),
      editable: false,
      width: "10%",
      filter: true,
    },
    totalCreditos: {
      title: this.translate.instant("plan_estudios.total_creditos"),
      editable: false,
      width: "10%",
      filter: true,
    },
    planPorCiclos: {
      title: this.translate.instant("plan_estudios.plan_estudios_ciclos"),
      editable: false,
      width: "10%",
      filter: true,
    },
  };

  readonly ACTIONS = ACTIONS;


  constructor(
    protected translate: TranslateService,
    protected popUpManager: PopUpManager,
    protected projectService: ProyectoAcademicoService,
    protected sgaMidService: SgaMidService,
    protected domSanitizer: DomSanitizer,
    protected planEstudiosService: PlanEstudiosService,
    protected gestorDocumentalService: NewNuxeoService,
    protected autenticationService: ImplicitAutenticationService,
    protected espaciosAcademicosService: EspaciosAcademicosService,
    protected parametrosService: ParametrosService
  ) { }


  setRoles() {
    this.autenticationService.getRole().then((rol: any) => {
      this.personaRoles = rol;
    })
  }

  // * ----------
  // * Insertar info parametrica en formulario 
  //#region
  async loadSelects() {
    this.loading = true;
    try {
      // ? carga paralela de parametricas
      let promesas = [];
      promesas.push(this.loadNivel().then(niveles => {
        this.niveles = niveles;
      }));
      promesas.push(this.loadProyectos().then(proyectos => {
        this.proyectos = proyectos;
      }));
      await Promise.all(promesas);

      this.estadosAprobacion = await this.loadEstadosAprobacion();

      this.loading = false;
    } catch (error: any) {
      this.loading = false;
      const falloEn = Object.keys(error)[0];
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('ERROR.fallo_informacion_en') + ': <b>' + falloEn + '</b>.<br><br>' +
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
    }
  }
  //#endregion
  // * ----------

  // * ----------
  // * Carga información paramétrica (selects)
  //#region
  async loadNivel(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.projectService.get('nivel_formacion?query=Activo:true&sortby=Id&order=asc&limit=0').subscribe(
        (resp: any) => {
          if (Object.keys(resp[0]).length > 0) {
            resolve(resp);
          } else {
            reject({ "nivel": null });
          }
        }, (err) => {
          reject({ "nivel": err });
        }
      );
    });
  }

  async loadProyectos(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.projectService.get('proyecto_academico_institucion?query=Activo:true&sortby=Nombre&order=asc&limit=0').subscribe(
        (resp: any) => {
          if (Object.keys(resp[0]).length > 0) {
            resolve(resp);
          } else {
            reject({ "proyecto": null });
          }
        }, (err) => {
          reject({ "proyecto": err });
        }
      );
    });
  }

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
  //#endregion
  // * ----------

  habilitarGenerarPlan() {
    if (this.dataPlanesEstudio.data.length > 0) {
      this.habilitadoGenerarPlan = true;
    }
  }

  async loadPlanesEstudio(queryComplement?: string): Promise<PlanEstudio[]> {
    return new Promise<any>((resolve, reject) => {
      let endpoint: string;
      if (queryComplement) {
        endpoint = "plan_estudio?query=activo:true," + queryComplement + "&limit=0"
      } else {
        endpoint = "plan_estudio?query=activo:true&limit=0";
      }
      this.planEstudiosService.get(endpoint).subscribe(
        (resp: any) => {
          if (Object.keys(resp.Data[0]).length > 0) {
            resolve(resp.Data);
          } else {
            resolve([]);
          }
        }, (err) => {
          reject({ "plan_estudio": err })
        }
      );
    });
  }

  loadPlanesEstudioPorTerceroVinculacion(terceroId: any): Promise<PlanEstudio[]> {
    return new Promise<any>((resolve, reject) => {
      this.sgaMidService.get("plan_estudio/dependencia_vinculacion_tercero/" + terceroId).subscribe(
        (resp: any) => {
          if (Object.keys(resp.Data[0]).length > 0) {
            resolve(resp.Data);
          } else {
            resolve([]);
          }
        }, (err: any) => {
          reject({ "plan_estudio": err })
        }
      );
    });
  }

  async salirEdicionFormulario() {
    this.popUpManager.showPopUpGeneric(
      this.translate.instant('plan_estudios.plan_estudios'),
      this.translate.instant('plan_estudios.seguro_salir_formulario'),
      MODALS.WARNING, true).then(
        async (action) => {
          if (action.value) {
            this.planEstudioPadreAsignado2Form = false;
            this.formGroupPlanEstudio.reset();
            //this.dataSemestre = [];
            this.dataSemestre = new MatTableDataSource<any>([])
            //this.dataOrganizedStudyPlans = undefined;
            this.dataOrganizedStudyPlans.data = [];
            this.planEstudioBody = undefined;
            this.planEstudioOrdenadoBody = undefined;
            this.vista = VIEWS.LIST;
            this.enEdicionPlanEstudio = false;
            await this.loadSelects();
          }
        }
      );
  }
  //#endregion
  // * ----------

  // * ----------
  // * Acciones botones
  //#region
  async cancelar() {
    let message = "";
    if (this.enEdicionPlanEstudio) {
      message = this.translate.instant('plan_estudios.seguro_cancelar');
    } else {
      message = this.translate.instant('plan_estudios.seguro_salir_formulario');
    }
    this.popUpManager.showPopUpGeneric(this.translate.instant('plan_estudios.plan_estudios'),
      message, MODALS.WARNING, true).then(
        async (action) => {
          if (action.value) {
            this.planEstudioPadreAsignado2Form = false;
            this.formGroupPlanEstudio.reset();
            //this.dataSemestre = [];
            this.dataSemestre = new MatTableDataSource<any>([])
            this.simpleStudyPlans = [];
            //this.dataOrganizedStudyPlans = undefined;
            this.dataOrganizedStudyPlans.data = [];
            this.planEstudioBody = undefined;
            this.planEstudioOrdenadoBody = undefined;
            this.enEdicionPlanEstudio = false;
            this.modoCreacion = false;
            this.vista = VIEWS.LIST;
            await this.loadSelects();
          }
        }
      );
  }

  // * ----------
  // * Visualizador dinámico planes de estudio
  //#region
  generarPlanEstudio() {
    this.loading = true;
    this.sgaMidService.get('plan_estudios/study_plan_visualization/' + this.planEstudioBody.Id).subscribe((resp: any) => {
      this.loading = false;
      if (resp !== null && resp.Status == "200") {
        this.dataPlanes = resp.Data;
        this.vista = VIEWS.SUMMARY;
      } else {
        this.dataPlanes = undefined;
        this.popUpManager.showPopUpGeneric(
          this.translate.instant('ERROR.titulo_generico'),
          this.translate.instant('ERROR.persiste_error_comunique_OAS'),
          MODALS.ERROR, false);
      }
    }, (error: any) => {
      this.loading = false;
      this.dataPlanes = undefined;
      this.popUpManager.showPopUpGeneric(
        this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
    });
  }
  //#endregion
  // * ----------

  async registrarPlanOrdenado(): Promise<any> {
    this.loading = true;
    let newPlanCicloOrdenado = await new PlanCiclosOrdenado();
    await this.formatearOrdenPlanesCiclos().then((ordenPlanes) => {
      newPlanCicloOrdenado.PlanEstudioId = this.planEstudioBody;
      newPlanCicloOrdenado.OrdenPlan = JSON.stringify(ordenPlanes);
    });
    return new Promise((resolve) => {
      if (this.planEstudioOrdenadoBody != undefined && Object.keys(this.planEstudioOrdenadoBody).length) {
        this.planEstudioOrdenadoBody.OrdenPlan = newPlanCicloOrdenado.OrdenPlan;
        this.planEstudiosService.put('plan_estudio_proyecto_academico', this.planEstudioOrdenadoBody)
          .subscribe((res: any) => {
            this.loading = false;
            if (Object.keys(res.Data).length > 0) {
              this.popUpManager.showSuccessAlert(this.translate.instant('plan_estudios.plan_estudios_actualizacion_ok'));
              this.planEstudioOrdenadoBody = res.Data;
              resolve(res.Data);
            } else {
              this.popUpManager.showErrorAlert(
                this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
              );
            }
          },
            (error: HttpErrorResponse) => {
              this.loading = false;
              this.popUpManager.showErrorAlert(
                this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
              );
            });
      } else {
        this.planEstudiosService.post('plan_estudio_proyecto_academico', newPlanCicloOrdenado)
          .subscribe((res: any) => {
            this.loading = false;
            if (Object.keys(res.Data).length > 0) {
              this.popUpManager.showSuccessAlert(this.translate.instant('plan_estudios.plan_estudios_actualizacion_ok'));
              this.planEstudioOrdenadoBody = res.Data;
              resolve(res.Data);
            } else {
              this.popUpManager.showErrorAlert(
                this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
              );
            }
          },
            (error: HttpErrorResponse) => {
              this.loading = false;
              this.popUpManager.showErrorAlert(
                this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
              );
            });
      }
    });
  }

  // * ----------
  // * Gestión plan de estudio por ciclos
  //#region
  async formatearOrdenPlanesCiclos() {
    let ordenPlanes: any = {};
    let planes = this.dataOrganizedStudyPlans.data
    console.log(planes, this.dataOrganizedStudyPlans, this.dataOrganizedStudyPlans.data)
    planes.forEach((plan: any, index: any) => {
      ordenPlanes['plan_'.concat((index + 1).toString())] = {
        "Id": plan.Id,
        "Orden": plan.orden,
      };
    });
    // await this.dataOrganizedStudyPlans.getAll().then((planes: any) => {
    //   planes.forEach((plan: any, index: any) => {
    //     ordenPlanes['plan_'.concat((index + 1).toString())] = {
    //       "Id": plan.Id,
    //       "Orden": plan.orden,
    //     };
    //   });
    // });
    return ordenPlanes;
  }

  crearFormulario(formPlanEstudio: FormParams) {
    this.planEstudioPadreAsignado2Form = false;
    this.formPlanEstudio = <FormParams>(
      UtilidadesService.hardCopy(formPlanEstudio)
    );
    this.formPlanEstudio['nivel'].opciones = this.niveles.filter(
      (nivel) => nivel.NivelFormacionPadreId == undefined
    );
  }

  // totalTotal() {
  //   let total = <any>UtilidadesService.hardCopy(this.formatototal);
  //   console.log(total, this.dataSemestre);
  //   this.dataSemestre.forEach((semestre) => {
  //     semestre.getAll().then((data: any) => {
  //       if (data.length > 0) {
  //         data.forEach((dataind: any) => {
  //           total.creditos += dataind.creditos;
  //           total.htd += dataind.htd;
  //           total.htc += dataind.htc;
  //           total.hta += dataind.hta;
  //           total.OB += dataind.OB;
  //           total.OC += dataind.OC;
  //           total.EI += dataind.EI;
  //           total.EE += dataind.EE;
  //           total.CP += dataind.CP;
  //           total.ENFQ_TEO += dataind.ENFQ_TEO;
  //           total.ENFQ_PRAC += dataind.ENFQ_PRAC;
  //           total.ENFQ_TEOPRAC += dataind.ENFQ_TEOPRAC;
  //         });
  //       }
  //     });
  //   });
  //   //this.dataSemestreTotalTotal.load([total]);
  //   this.dataSemestreTotalTotal = new MatTableDataSource<any>([total])
  //   //this.dataSemestreTotalTotal.refresh();
  // }
  totalTotal() {
    let total = <any>UtilidadesService.hardCopy(this.formatototal);
    console.log(total, this.dataSemestre);
    // Recorrer directamente los datos en cada array interno
    this.dataSemestre.data.forEach((semestre) => {
      semestre.data.forEach((dataind: any) => {
        total.creditos += dataind.creditos;
        total.htd += dataind.htd;
        total.htc += dataind.htc;
        total.hta += dataind.hta;
        total.OB += dataind.OB;
        total.OC += dataind.OC;
        total.EI += dataind.EI;
        total.EE += dataind.EE;
        total.CP += dataind.CP;
        total.ENFQ_TEO += dataind.ENFQ_TEO;
        total.ENFQ_PRAC += dataind.ENFQ_PRAC;
        total.ENFQ_TEOPRAC += dataind.ENFQ_TEOPRAC;
      });
    });

    this.dataSemestreTotalTotal = new MatTableDataSource<any>([total]);
    // this.dataSemestreTotalTotal.load([total]);
    // this.dataSemestreTotalTotal.refresh();
  }
  //#endregion
  // * ----------

  async cargarFormularioPlanEstudios(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.loading = true;
        let proyectoCurricular: any;
        let subnivel: any;
        let nivel: any;
        if (this.proyecto_id) {
          proyectoCurricular = this.proyectos.find(proyecto => proyecto.Id == this.proyecto_id);
          subnivel = proyectoCurricular ? proyectoCurricular.NivelFormacionId : undefined;
          nivel = subnivel ? subnivel.NivelFormacionPadreId : undefined;
        }
        this.formGroupPlanEstudio.patchValue({
          nivel: nivel ? nivel.Nombre : undefined,
          subnivel: subnivel ? subnivel.Nombre : undefined,
          proyectoCurricular: proyectoCurricular ? proyectoCurricular.Nombre : undefined,
          codigoProyecto: proyectoCurricular ? proyectoCurricular.Codigo : undefined,
          planPorCiclos: this.planEstudioBody.EsPlanEstudioPadre ? this.translate.instant('GLOBAL.si') : this.translate.instant('GLOBAL.no'),
          nombrePlanEstudio: this.planEstudioBody.Nombre,
          codigoPlanEstudio: this.planEstudioBody.Codigo,
          totalCreditosPrograma: this.planEstudioBody.TotalCreditos,
          numeroSemestres: this.planEstudioBody.NumeroSemestres,
          numeroResolucion: this.planEstudioBody.NumeroResolucion,
          anioResolucion: this.planEstudioBody.AnoResolucion
        });

        // Cargar soportes
        let nombresSoporte = '';
        let soporteDocumental = this.str2JsonValidated(this.planEstudioBody.SoporteDocumental);
        if (Object.keys(soporteDocumental).length) {
          const listaSoportes = soporteDocumental['SoporteDocumental'] ? soporteDocumental['SoporteDocumental'] : [];
          console.log("Carga form 1")
          this.descargarArchivos(listaSoportes).then(() => {
            console.log("Carga form 1")
            listaSoportes.forEach((idSoporte: number) => {
              this.gestorDocumentalService.getByIdLocal(idSoporte).subscribe(supportFile => {
                this.formPlanEstudio['soportes'].archivosLinea!.push(supportFile);
                nombresSoporte += supportFile.nombre + ', ';
                this.formGroupPlanEstudio.patchValue({
                  soportes: nombresSoporte
                });
              });
            });
            resolve(true);
          }, (error) => {
            reject(false);
          });
        }
        this.loading = false;
      } catch (error) {
        this.loading = false;
        reject(false);
      }
    });
  }

  async asignarForm(event: any) {
    this.formGroupPlanEstudio = event;
    // Carga de datos en la acción de visualizar o editar
    if ((this.mainAction === ACTIONS.VIEW || this.mainAction === ACTIONS.EDIT) && this.planEstudioBody != undefined) {
      this.cargarFormularioPlanEstudios().then(async (res) => {
        if (res) {
          if (this.esPlanEstudioPadre) {
            this.cargarPlanesOrdenados(this.mainAction === ACTIONS.EDIT);
          } else {
            await this.cargarParametrizacionSemestres(this.mainAction === ACTIONS.EDIT);
            this.enEdicionSemestreNuevo = false;
            this.enEdicionSemestreViejo = false;

          }
        }
      }, (error) => {
        this.popUpManager.showPopUpGeneric(
          this.translate.instant('ERROR.titulo_generico'),
          this.translate.instant('plan_estudios.error_cargando_datos_formulario') + '</b>.<br><br>' +
          this.translate.instant('ERROR.persiste_error_comunique_OAS'),
          MODALS.ERROR, false).then(async () => {
            this.loading = false;
            this.planEstudioPadreAsignado2Form = false;
            this.formGroupPlanEstudio.reset();
            //this.dataSemestre = [];
            this.dataSemestre = new MatTableDataSource<any>([])
            this.vista = VIEWS.LIST;
            await this.loadSelects();
          });
      });
    }

    // Asignación del tipo de plan al formulario
    if (!this.planEstudioPadreAsignado2Form) {
      this.planEstudioPadreAsignado2Form = true;
      let valorEsPlanPadre = this.esPlanEstudioPadre ? this.translate.instant('GLOBAL.si') : this.translate.instant('GLOBAL.no');
      this.formGroupPlanEstudio.patchValue({ planPorCiclos: valorEsPlanPadre });
    }
  }

  async cargarParametrizacionSemestres(withActions: boolean = true) {
    try {
      this.loading = true;
      let semestreDistribucion = this.str2JsonValidated(this.planEstudioBody.EspaciosSemestreDistribucion);

      await this.consultarEspaciosAcademicos(this.proyecto_id).then((espacios) => {
        this.ListEspacios = espacios;

        if (Object.keys(semestreDistribucion).length && Array.isArray(this.ListEspacios)) {
          let idEspacio: any;
          let espacio;
          let indexEspacio;
          for (const semestreKey in semestreDistribucion) {
            //this.dataSemestre.push(new LocalDataSource());
            this.dataSemestre.data.push(new MatTableDataSource<any>([]));
            this.punteroSemestrePlan = this.dataSemestre.data.length - 1;
            let espaciosSemestre = semestreDistribucion[semestreKey].espacios_academicos;

            if (espaciosSemestre) {
              espaciosSemestre.forEach((espacioSemestre: any, idx: any) => {
                idEspacio = espacioSemestre['espacio_'.concat((idx + 1).toString())].Id;
                espacio = this.ListEspacios.find(espacio => espacio._id == idEspacio);
                if (espacio) {
                  console.log(this.dataSemestre);
                  //this.dataSemestre[this.punteroSemestrePlan].add(espacio);
                  this.dataSemestre.data[this.punteroSemestrePlan].data.push(espacio);
                  console.log(this.dataSemestre);
                  indexEspacio = this.ListEspacios.findIndex(espacio => espacio._id == idEspacio);
                  this.ListEspacios.splice(indexEspacio, 1);
                }
              });
            }

            //let total = <any>UtilidadesService.hardCopy(this.formatototal);
            //this.dataSemestreTotal.push(new LocalDataSource([total]));
            this.dataSemestreTotal.push(UtilidadesService.hardCopy(this.formatototal));


            //const totalSemestre = this.filaTotal(this.dataSemestre[this.punteroSemestrePlan]);
            //this.dataSemestreTotal[this.punteroSemestrePlan].load(totalSemestre);
            //this.dataSemestreTotal[this.punteroSemestrePlan].refresh();
            //MODIFICAR FUNCIÓN FILA TOTAAAAL

            const totalSemestre = this.filaTotal(this.dataSemestre.data[this.punteroSemestrePlan].data);
            this.dataSemestreTotal.splice(this.punteroSemestrePlan, 1, totalSemestre);
          }

          //this.createTableSemestre(withActions);
          //this.createTableSemestreTotal(withActions);
        }
        this.planEstudioPadreAsignado2Form = false;
        //this.dataEspaciosAcademicos.load(this.ListEspacios);
        this.dataEspaciosAcademicos = new MatTableDataSource<any>(this.ListEspacios);


        this.numSemestresCompletado = this.dataSemestre.data.length === this.planEstudioBody.NumeroSemestres;
        this.formPlanEstudio['numeroSemestres'].minimo = this.dataSemestre.data.length;
        this.loading = false;
      }, (error) => {
        this.loading = false;
        this.popUpManager.showPopUpGeneric(
          this.translate.instant('ERROR.titulo_generico'),
          this.translate.instant('plan_estudios.error_cargando_datos_formulario') + '</b>.<br><br>' +
          this.translate.instant('ERROR.persiste_error_comunique_OAS'),
          MODALS.ERROR, false);
      });
    } catch (error) {
      this.loading = false;
      this.popUpManager.showErrorAlert(
        this.translate.instant('plan_estudios.error_cargando_datos_formulario'));
    }
  }

  str2JsonValidated(valueStr: any): any {
    if (valueStr === "" || valueStr === "{}" || valueStr === undefined) {
      return {};
    } else {
      return JSON.parse(valueStr);
    }
  }

  async descargarArchivos(idArchivos: any[]): Promise<any> {
    this.loading = true;
    return new Promise<any>((resolve, reject) => {
      console.log("descarga 1")
      this.checkIfAlreadyDownloaded(idArchivos).then(
        faltantes => {
          console.log("descarga 2")
          const limitQuery = faltantes.length;
          let idsForQuery = "";
          faltantes.forEach((id, i) => {
            idsForQuery += String(id);
            if (i < limitQuery - 1) idsForQuery += '|';
          });
          if (limitQuery > 0) {
            this.gestorDocumentalService.getManyFiles('?query=Id__in:' + idsForQuery + '&limit=' + limitQuery).subscribe(
              r => {
                if (!r.downloadProgress) {
                  this.loading = false;
                  resolve(true);
                }
              }, e => {
                this.loading = false;
                reject(false);
              }
            );
          } else {
            this.loading = false;
            resolve(true)
          }
        });
    });
  }

  async cargarPlanesOrdenados(withActions: boolean = true) {
    try {
      this.loading = true;
      this.simpleStudyPlans = await this.loadPlanesEstudio("EsPlanEstudioPadre:false");
      for (const plan of this.simpleStudyPlans) {
        this.organizarDatosTablaSimplePlanEstudio(plan);
      }
      this.consultarPlanOrdenadoQuery("PlanEstudioId:".concat(this.planEstudioBody.Id).toString()).then(
        (planCiclos) => {
          if (Array.isArray(planCiclos) && planCiclos.length) {
            const valorPlanClicos = planCiclos[0];
            if (valorPlanClicos != undefined && Object.keys(valorPlanClicos).length) {
              this.planEstudioOrdenadoBody = valorPlanClicos;
              const ordenPlanes = this.str2JsonValidated(this.planEstudioOrdenadoBody.OrdenPlan);
              let idOrdenPlan: any;
              let plan2add;
              let indexPlan;

              for (const oPlan in ordenPlanes) {
                idOrdenPlan = ordenPlanes[oPlan].Id;
                plan2add = this.simpleStudyPlans.find(plan => plan.Id == idOrdenPlan);
                if (plan2add) {
                  console.log(plan2add, this.dataOrganizedStudyPlans);
                  //this.dataOrganizedStudyPlans.addData(plan2add);
                  this.dataOrganizedStudyPlans.data.push(plan2add);
                  console.log(this.dataOrganizedStudyPlans, this.simpleStudyPlans);
                  indexPlan = this.simpleStudyPlans.findIndex(plan => plan.Id == idOrdenPlan);
                  this.simpleStudyPlans.splice(indexPlan, 1);
                }
              }
            } else {
              this.planEstudioOrdenadoBody = undefined;
            }
            //this.dataOrganizedStudyPlans.refresh();
            //this.dataSimpleStudyPlans.load(this.simpleStudyPlans);
            console.log(this.dataSimpleStudyPlans, this.simpleStudyPlans);
            this.dataSimpleStudyPlans = new MatTableDataSource<any>(this.simpleStudyPlans);
            console.log(this.dataSimpleStudyPlans);
            this.loading = false;
          }
        }, (error) => {
          this.loading = false;
          this.popUpManager.showPopUpGeneric(
            this.translate.instant('ERROR.titulo_generico'),
            this.translate.instant('plan_estudios.error_cargando_datos_formulario') + '</b>.<br><br>' +
            this.translate.instant('ERROR.persiste_error_comunique_OAS'),
            MODALS.ERROR, false);
        });

    } catch (error) {
      this.loading = false;
      this.popUpManager.showErrorAlert(
        this.translate.instant('plan_estudios.error_cargando_datos_formulario'));
    }
  }
  //#endregion
  // * ----------

  organizarDatosTablaSimplePlanEstudio(plan: any) {
    const proyecto = this.proyectos.find(proyecto => proyecto.Id == plan.ProyectoAcademicoId);
    plan["proyectoCurricular"] = proyecto["Nombre"];

    plan["plan_estudio"] = plan["Nombre"];
    plan["resolucion"] = plan["NumeroResolucion"];
    plan["totalCreditos"] = plan["TotalCreditos"];

    const estado = plan["EstadoAprobacionId"];
    plan["estado"] = estado["Nombre"];
    plan["planPorCiclos"] = plan["EsPlanEstudioPadre"] ? this.translate.instant('GLOBAL.si') : this.translate.instant('GLOBAL.no');
  }
  //#endregion
  // * ----------

  consultarPlanOrdenadoQuery(queryComplement: string): Promise<any> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.planEstudiosService.get('plan_estudio_proyecto_academico?query=activo:true,' + queryComplement)
        .subscribe((resp: any) => {
          this.loading = false;
          resolve(resp.Data);
        }, (err) => {
          this.loading = false;
          reject({ "plan_estudio_proyecto": err });
        });
    });
  }

  // * ----------
  // * Cargar informacion particular 
  //#region
  // async consultarEspaciosAcademicos(id_proyecto: number): Promise<any> {
  //   this.loading = true;
  //   console.log('Consulta espacios 1');
  //   return new Promise((resolve, reject) => {
  //     this.sgaMidService.get('espacios_academicos/byProject/' + id_proyecto).subscribe((resp: any) => {
  //       this.loading = false;
  //       console.log('Consulta espacios 2o');
  //       resolve(resp.Data);
  //     }, (err: any) => {
  //       this.loading = false;
  //       console.log('Consulta espacios 2e');
  //       reject({ "espacios": err });
  //     })
  //   })
  // }
  async consultarEspaciosAcademicos(id_proyecto: number): Promise<any> {
    console.log("Consultar 1");
    let espaciosA = await this.recuperarEspaciosAcademicos(id_proyecto);
    console.log("Consultar 2");
    //let espaciosAll = await this.getLineaEspacioAcademico();
    //console.log("Consultar 3", espaciosAll);
    let clases = await this.recuperarClase();
    console.log("Consultar 3");
    let enfoques = await this.recuperarEnfoque();
    console.log("Consultar 4");
    console.log(espaciosA, clases, enfoques);
    let EspaciosAcademicos: any[] = [];
    // espaciosA.forEach(async (espacio: any) => {
    for (const espacio of espaciosA) {
      console.log(espacio);
      let nombres_espacios: any[] = [];
      let nombres_espacios_str: any = ""
      for (const requerido of espacio.espacios_requeridos) {
        console.log(requerido);
        await this.getLineaEspacioAcademico(requerido)
        //console.log("Consultar 4.0");
        //let aux = await this.getLineaEspacioAcademico();
        console.log("Consultar 4.1");
        let nombreEspacio: string = this.getLocalEspacioAcademico(requerido, espaciosA);
        console.log("Consultar 4.2");
        if (nombreEspacio == "") {
          console.log("Consultar 4.3");
          //console.log(espaciosAll);
          nombreEspacio = await this.getLineaEspacioAcademico(requerido)
          //const espacioAux = espaciosAll.find((espacioItem: any) => espacioItem._id == requerido)
          // if (espacioAux) {
          //   nombreEspacio = await this.getLineaEspacioAcademico()
          //   nombreEspacio = espacioAux.nombre
          //   console.log("Consultar 4.4");
          // } else {
          //   nombreEspacio = "No encontrado..."
          // }
        }
        console.log(nombreEspacio);
        nombres_espacios.push({
          "_id": requerido,
          "nombre": nombreEspacio
        });
        nombres_espacios_str += nombreEspacio + ", "
      }
      // espacio.espacios_requeridos.forEach(async (requerido: any) => {
      //   console.log(requerido);
      //   await this.getLineaEspacioAcademico(requerido)
      //   //console.log("Consultar 4.0");
      //   //let aux = await this.getLineaEspacioAcademico();
      //   console.log("Consultar 4.1");
      //   let nombreEspacio: string = this.getLocalEspacioAcademico(requerido, espaciosA);
      //   console.log("Consultar 4.2");
      //   if (nombreEspacio == "") {
      //     console.log("Consultar 4.3");
      //     //console.log(espaciosAll);
      //     nombreEspacio = await this.getLineaEspacioAcademico(requerido)
      //     //const espacioAux = espaciosAll.find((espacioItem: any) => espacioItem._id == requerido)
      //     // if (espacioAux) {
      //     //   nombreEspacio = await this.getLineaEspacioAcademico()
      //     //   nombreEspacio = espacioAux.nombre
      //     //   console.log("Consultar 4.4");
      //     // } else {
      //     //   nombreEspacio = "No encontrado..."
      //     // }
      //   }
      //   console.log(nombreEspacio);
      //   nombres_espacios.push({
      //     "_id": requerido,
      //     "nombre": nombreEspacio
      //   });
      //   nombres_espacios_str += nombreEspacio + ", "
      // });
      let nombreClase: any = this.getClase(espacio.clasificacion_espacio_id, clases);
      if (!nombreClase) {
        nombreClase = "No encontrado..."
      }
      let formatoEspacio: any = {
        "_id": espacio._id,
        "nombre": espacio.nombre,
        "prerequisitos": nombres_espacios,
        "prerequisitos_str": nombres_espacios_str,
        "clase": nombreClase,
        "creditos": espacio.creditos,
        "htd": espacio.distribucion_horas.HTD,
        "htc": espacio.distribucion_horas.HTC,
        "hta": espacio.distribucion_horas.HTA
      }
      clases.forEach((clase: any) => {
        let code = clase.CodigoAbreviacion;
        let value = 0;
        if (clase.Id == espacio.clasificacion_espacio_id) {
          value = 1;
        }
        formatoEspacio[code] = value;
      });
      enfoques.forEach((enfoque: any) => {
        let code = enfoque.CodigoAbreviacion;
        code = code.replace(/-/g, "_");
        let value = 0
        if (enfoque.Id == espacio.enfoque_id) {
          value = 1;
        }
        formatoEspacio[code] = value;
      });
      EspaciosAcademicos.push(formatoEspacio)
      console.log(EspaciosAcademicos, formatoEspacio)
    }

    return EspaciosAcademicos;
  }

  //*******************************************************//
  //***************** FUNCIONES DE AYUDA ******************//

  async recuperarEspaciosAcademicos(id_proyecto: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.espaciosAcademicosService.get('espacio-academico?query=activo:true,proyecto_academico_id:' + id_proyecto + ',espacio_academico_padre&limit=0').subscribe((resp: any) => {
        console.log(resp, resp.Data);
        resolve(resp.Data);
      }, (err: any) => {
        reject(err);
      })
    })
  }

  async recuperarEspacioAcademicosAll(id: any): Promise<any> {
    console.log("recup 1");
    return new Promise((resolve, reject) => {
      this.espaciosAcademicosService.get('espacio-academico/' + id).subscribe((resp: any) => {
        console.log("recup 2");
        console.log(resp, resp.Data);
        resolve(resp.Data);
      }, (err: any) => {
        console.log("error", err);
        reject(err);
      })
    })
  }

  async recuperarClase(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.parametrosService.get('parametro?query=TipoParametroId:51&limit=0&fields=Id,Nombre,CodigoAbreviacion').subscribe((resp: any) => {
        console.log(resp, resp.Data);
        resolve(resp.Data);
      }, (err: any) => {
        reject(err);
      })
    })
  }

  async recuperarEnfoque(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.parametrosService.get('parametro?query=TipoParametroId:68&limit=0&fields=Id,CodigoAbreviacion').subscribe((resp: any) => {
        console.log(resp, resp.Data);
        resolve(resp.Data);
      }, (err: any) => {
        reject(err);
      })
    })
  }

  getLocalEspacioAcademico(id: string, espacios: any[]) {
    espacios.forEach((espacio: any) => {
      if (id == espacio._id) {
        return espacio.nombre
      }
    });
    return "";
  }

  async getLineaEspacioAcademico(id: any) {
    console.log("Linea 1");
    let nombreEspacio = await this.recuperarEspacioAcademicosAll(id);
    console.log("Linea 2");
    console.log(nombreEspacio.nombre);
    if (nombreEspacio.nombre) {
      return nombreEspacio.nombre;
    } else {
      return "";
    }
  }

  getClase(id: number, clases: any[]): string | null {
    let claseEncontrada: string | null = null;

    clases.forEach((clase: any) => {
      if (id == clase.Id) {
        claseEncontrada = clase.Nombre;
        return;
      }
    });

    return claseEncontrada;
  }

  //*******************************************************//
  //*******************************************************//

  //#endregion
  // * ----------

  // filaTotal(semestre: any): any {
  //   let total = <any>UtilidadesService.hardCopy(this.formatototal);
  //   semestre.getAll().then((data: any) => {
  //     if (data.length > 0) {
  //       data.forEach((dataind: any) => {
  //         total.creditos += dataind.creditos;
  //         total.htd += dataind.htd;
  //         total.htc += dataind.htc;
  //         total.hta += dataind.hta;
  //         total.OB += dataind.OB;
  //         total.OC += dataind.OC;
  //         total.EI += dataind.EI;
  //         total.EE += dataind.EE;
  //         total.CP += dataind.CP;
  //         total.ENFQ_TEO += dataind.ENFQ_TEO;
  //         total.ENFQ_PRAC += dataind.ENFQ_PRAC;
  //         total.ENFQ_TEOPRAC += dataind.ENFQ_TEOPRAC;
  //       });
  //     }
  //   });
  //   this.totalTotal();
  //   return [total];
  // }

  filaTotal(semestre: any[]): any {
    let total = <any>UtilidadesService.hardCopy(this.formatototal);
    semestre.forEach((dataind) => {
      total.creditos += dataind.creditos;
      total.htd += dataind.htd;
      total.htc += dataind.htc;
      total.hta += dataind.hta;
      total.OB += dataind.OB;
      total.OC += dataind.OC;
      total.EI += dataind.EI;
      total.EE += dataind.EE;
      total.CP += dataind.CP;
      total.ENFQ_TEO += dataind.ENFQ_TEO;
      total.ENFQ_PRAC += dataind.ENFQ_PRAC;
      total.ENFQ_TEOPRAC += dataind.ENFQ_TEOPRAC;
    });
    this.totalTotal();
    return [total];
  }

  // * ----------
  // * Visualizar plan de estudio 
  //#region
  viewStudyPlan(id: any) {
    const idPlan = id;
    this.dataEspaciosAcademicos = new MatTableDataSource<any>([]);
    console.log("View 1")
    this.consultarPlanEstudio(idPlan).then((res) => {
      console.log("View 2", res)
      this.enEdicionPlanEstudio = false;
      this.enEdicionSemestreNuevo = false;
      this.enEdicionSemestreViejo = false;
      this.planEstudioBody = res;
      this.esPlanEstudioPadre = this.planEstudioBody.EsPlanEstudioPadre ? true : false;
      this.proyecto_id = this.planEstudioBody.ProyectoAcademicoId;
      this.crearFormulario(FORM_PLAN_ESTUDIO_VISUALIZACION);
      if (this.esPlanEstudioPadre) {
        // this.createSimpleTableStudyPlan(false);
        // this.createTableOrganizedStudyPlan(false);
        //this.dataOrganizedStudyPlans = new LocalDataSource();
        this.dataOrganizedStudyPlans = new MatTableDataSource<any>([]);
        console.log(this.dataOrganizedStudyPlans);
        this.vista = VIEWS.SECONDARY_FORM;
      } else {
        // this.createTableEspaciosAcademicos(false);
        // this.createTableSemestreTotal(false);
        this.totalTotal();
        this.vista = VIEWS.FORM;
      }
      this.mainAction = ACTIONS.VIEW;
      this.loading = false;
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

  // * ----------
  // * Cargar datos del plan de estudio actual
  //#region
  async consultarPlanEstudio(idPlan: number): Promise<any> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.planEstudiosService.get('plan_estudio/' + idPlan).subscribe((resp: any) => {
        this.loading = false;
        resolve(resp.Data);
      }, (err) => {
        this.loading = false;
        this.popUpManager.showErrorAlert(
          this.translate.instant('plan_estudios.error_cargando_datos_formulario')
        );
        reject({ "plan_estudios": err });
      })
    });
  }
  //#endregion
  // * ----------

  async loadStudyPlanSimpleTable() {
    this.loading = true;
    try {
      // Datos de la tabla planes de estudio por ciclos
      //ToDo agregar filtro de solo planes aprobados, actualmente muestra todos los que
      // no son hijos
      this.simpleStudyPlans = await this.loadPlanesEstudio("EsPlanEstudioPadre:false");
      this.simpleStudyPlans.forEach(plan => {
        this.organizarDatosTablaSimplePlanEstudio(plan);
      });
      //this.dataSimpleStudyPlans.load(this.simpleStudyPlans);
      this.dataSimpleStudyPlans = new MatTableDataSource<any>(this.simpleStudyPlans);

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

  organizarPlanEstudioCompuesto() {
    this.enEdicionPlanEstudio = true;
    this.modoCreacion = true;
    this.esPlanEstudioPadre = true;
    this.crearFormulario(FORM_PLAN_ESTUDIO);
    //this.createSimpleTableStudyPlan();
    //this.createTableOrganizedStudyPlan();
    this.vista = VIEWS.SECONDARY_FORM;
    this.loadStudyPlanSimpleTable();
  }

  // * ----------
  // * Funciones para carga y descarga de archivos
  //#region
  prepararArchivos(): any[] {
    const idTipoDocument = 72; // carpeta Nuxeo
    const archivos = <any[]>this.formPlanEstudio['soportes'].archivosLocal;

    return archivos.map(archivo => {
      return {
        IdDocumento: idTipoDocument,
        nombre: (archivo.file.name).split('.')[0],
        descripcion: "Soporte Plan de Estudios",
        file: archivo.file
      }
    })
  }

  cargarArchivos(archivos: any): Promise<number[]> {
    return new Promise<number[]>((resolve) => {
      this.gestorDocumentalService.uploadFiles(archivos).subscribe(
        (respuesta: any[]) => {
          const listaIds = respuesta.map(f => {
            return f.res.Id;
          });
          resolve(listaIds);
        }
      );
    });
  }

  async checkIfAlreadyDownloaded(idArchivos: any[]): Promise<number[]> {
    let notDonwloaded: any = []
    return new Promise<number[]>((resolve) => {
      if (idArchivos.length > 0) {
        idArchivos.forEach((id, i) => {
          this.gestorDocumentalService.getByIdLocal(id).subscribe(
            () => {/* Ya está */ },
            () => { notDonwloaded.push(id); }
          );
          if ((i + 1) == idArchivos.length) {
            resolve(notDonwloaded);
          }
        });
      } else {
        resolve(notDonwloaded);
      }
    });
  }

  // * ----------
  // * Estructuracion plan de estudio
  //#region
  prepareIds2Stringify(idsArchivos: number[], nameField: string): string {
    let result: any = {}
    result[nameField] = []
    if (idsArchivos) {
      result[nameField] = idsArchivos;
    }
    return JSON.stringify(result);
  }

  updateStudyPlan(planEstudioBody: PlanEstudio): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loading = true;
      this.planEstudiosService.put('plan_estudio/', planEstudioBody)
        .subscribe((res: any) => {
          this.loading = false;
          if (Object.keys(res.Data).length > 0) {
            this.popUpManager.showSuccessAlert(this.translate.instant('plan_estudios.plan_estudios_actualizacion_ok'));
            resolve(res.Data);
          } else {
            this.popUpManager.showErrorAlert(
              this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
            );
            reject(undefined);
          }
        },
          (error: HttpErrorResponse) => {
            this.loading = false;
            this.popUpManager.showErrorAlert(
              this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
            );
            reject(undefined);
          });
    });
  }
  //#endregion
  // * ----------

  actualizarForm(event: any) {
    this.formGroupPlanEstudio = event;
  }

  finalizarSemestre() {
    this.popUpManager.showPopUpGeneric(this.translate.instant('plan_estudios.plan_estudios'),
      this.translate.instant('plan_estudios.seguro_finalizar'), MODALS.INFO, true).then(
        (action) => {
          if (action.value) {
            this.prepareUpdateBySemester().then((res) => {
              if (res) {
                this.enEdicionSemestreNuevo = false;
                this.enEdicionSemestreViejo = false;
              }
            });
          }
        }
      );
  }

  // * ----------
  // * Actualizar plan de estudios datos básicos 
  //#region
  async prepareUpdateBySemester(): Promise<boolean> {
    this.loading = true;
    await this.formatearResumenTotal();
    return new Promise((resolve) => {
      this.formatearEspaciosPlanEstudio().then((res) => {
        if (res) {
          this.loading = true;
          this.updateStudyPlan(this.planEstudioBody).then((updatedPlan) => {
            this.loading = false;
            this.planEstudioBody = updatedPlan;
            resolve(true);
          });
        } else {
          this.loading = false;
          this.popUpManager.showErrorAlert(
            this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
          );
          resolve(false);
        }
      }).catch((error) => {
        console.log(error);
        this.loading = false;
        this.popUpManager.showErrorAlert(
          this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
        );
        resolve(false);
      });
    });
  }

  // * ----------
  // * Procesamiento almacenamiento de semestre con espacios académicos 
  //#region
  formatearResumenTotal() {
    let resumenTotal: any = {};
    let dataResumen = this.dataSemestreTotalTotal.data;
    resumenTotal = dataResumen[0];
    resumenTotal["numero_semestres"] = this.dataSemestre.data.length;
    this.planEstudioBody.ResumenPlanEstudios = JSON.stringify(resumenTotal);
    // this.dataSemestreTotalTotal.getAll().then((data: any) => {
    //   resumenTotal = data[0];
    //   resumenTotal["numero_semestres"] = this.dataSemestre.length;
    //   this.planEstudioBody.ResumenPlanEstudios = JSON.stringify(resumenTotal);
    // })
  }
  //#endregion
  // * ----------

  async formatearEspaciosPlanEstudio(): Promise<any> {
    try {
      console.log(this.planEstudioBody.EspaciosSemestreDistribucion)
      console.log(this.planEstudioBody)
      let espaciosSemestre = await this.str2JsonValidated(this.planEstudioBody.EspaciosSemestreDistribucion);
      console.log(espaciosSemestre)

      return new Promise((resolve, reject) => {
        let semestreRes = this.organizarEspaciosSemestreActual();
        if (Object.keys(semestreRes).length > 0) {
          const semestreEt = Object.keys(semestreRes)[0];
          if (Object.keys(espaciosSemestre).length > 0) {
            espaciosSemestre[semestreEt] = semestreRes[semestreEt];
          } else {
            espaciosSemestre = semestreRes;
          }
          this.planEstudioBody.EspaciosSemestreDistribucion = JSON.stringify(espaciosSemestre);
          resolve(true);
        } else {
          reject(false);
        }
        // this.organizarEspaciosSemestreActual().then((semestreRes) => {
        //   if (Object.keys(semestreRes).length > 0) {
        //     const semestreEt = Object.keys(semestreRes)[0];
        //     if (Object.keys(espaciosSemestre).length > 0) {
        //       espaciosSemestre[semestreEt] = semestreRes[semestreEt];
        //     } else {
        //       espaciosSemestre = semestreRes;
        //     }
        //     this.planEstudioBody.EspaciosSemestreDistribucion = JSON.stringify(espaciosSemestre);
        //     resolve(true);
        //   } else {
        //     reject(false);
        //   }
        // });
      });
    } catch (error) {
      this.loading = false;
      this.popUpManager.showPopUpGeneric(this.translate.instant('ERROR.titulo_generico'),
        this.translate.instant('ERROR.fallo_informacion_en') + ': <b>' + this.translate.instant('plan_estudios.organizar') +
        '</b>.<br><br>' + this.translate.instant('ERROR.persiste_error_comunique_OAS'),
        MODALS.ERROR, false);
    }
  }
  //#endregion
  // * ----------

  // * ----------
  // * Procesamiento almacenamiento de semestre con espacios académicos 
  //#region
  organizarEspaciosSemestreActual() {
    let numSemestre = this.punteroSemestrePlan + 1;
    let etiquetaSemestre = "semestre_".concat(numSemestre.toString());
    let semestre: any = {};
    let espaciosAcademicosOrdenados: any = [];
    let espacios = this.dataSemestre.data[this.punteroSemestrePlan].data
    console.log(espacios)

    if (espacios.length == 0) {
      semestre[etiquetaSemestre] = {
        espacios_academicos: []
      }
    } else {
      espacios.forEach((espacio: any, index: any) => {
        let etiquetaEspacio = "espacio_".concat((index + 1).toString());
        let newEspacio = new EspacioEspaciosSemestreDistribucion();
        let espaciosRequeridosId = espacio["prerequisitos"] ? espacio["prerequisitos"].map((e: any) => e._id) : "NA";
        newEspacio.Id = espacio["_id"];
        newEspacio.OrdenTabla = index + 1;
        newEspacio.EspaciosRequeridos = {
          Id: espaciosRequeridosId,
        };
        espaciosAcademicosOrdenados.push({
          [etiquetaEspacio]: newEspacio
        });

        if (index >= (espacios.length - 1)) {
          semestre[etiquetaSemestre] = {
            espacios_academicos: espaciosAcademicosOrdenados
          };
        }
      });
    }

    // this.dataSemestre[this.punteroSemestrePlan].then((espacios: any) => {
    //   if (espacios.length == 0) {
    //     semestre[etiquetaSemestre] = {
    //       espacios_academicos: []
    //     }
    //   } else {
    //     espacios.forEach((espacio: any, index: any) => {
    //       let etiquetaEspacio = "espacio_".concat((index + 1).toString());
    //       let newEspacio = new EspacioEspaciosSemestreDistribucion();
    //       let espaciosRequeridosId = espacio["prerequisitos"] ? espacio["prerequisitos"].map((e: any) => e._id) : "NA";
    //       newEspacio.Id = espacio["_id"];
    //       newEspacio.OrdenTabla = index + 1;
    //       newEspacio.EspaciosRequeridos = {
    //         Id: espaciosRequeridosId,
    //       };
    //       espaciosAcademicosOrdenados.push({
    //         [etiquetaEspacio]: newEspacio
    //       });

    //       if (index >= (espacios.length - 1)) {
    //         semestre[etiquetaSemestre] = {
    //           espacios_academicos: espaciosAcademicosOrdenados
    //         };
    //       }
    //     });
    //   }
    // });
    return semestre;
  }

  editarSemestre(index: number) {
    this.punteroSemestrePlan = index;
    if (index == (this.dataSemestre.data.length - 1)) {
      this.enEdicionSemestreNuevo = true;
    } else {
      this.enEdicionSemestreViejo = true;
    }
  }

  async limpiarSemestre(semestre: any) {
    this.popUpManager
      .showPopUpGeneric(
        this.translate.instant("plan_estudios.plan_estudios"),
        this.translate.instant("plan_estudios.seguro_limpiar"),
        MODALS.QUESTION,
        true
      )
      .then(async (action) => {
        if (action.value) {
          for (const dataind of semestre.data) {
            this.dataEspaciosAcademicos.data.push(dataind);
          }
          semestre.data = [];
          const totalSemestre = await this.filaTotal(this.dataSemestre.data[this.punteroSemestrePlan].data);
          this.dataSemestreTotal[this.punteroSemestrePlan] = totalSemestre;
          //this.dataSemestreTotal[this.punteroSemestrePlan].refresh();
          this.prepareUpdateBySemester();
          // semestre.getAll().then(async (data: any) => {
          //   await data.forEach((dataind: any) => {
          //     //this.dataEspaciosAcademicos.add(dataind);
          //   });
          //   //await this.dataEspaciosAcademicos.refresh();
          //   await semestre.load([]);
          //   const totalSemestre = await this.filaTotal(this.dataSemestre[this.punteroSemestrePlan]);
          //   await this.dataSemestreTotal[this.punteroSemestrePlan].load(totalSemestre);
          //   await this.dataSemestreTotal[this.punteroSemestrePlan].refresh();
          //   this.prepareUpdateBySemester();
          // });
        }
      });
  }

  agregarSemestre() {
    const semestresMax = Number(this.formGroupPlanEstudio.get('numeroSemestres')!.value);
    console.log(semestresMax, this.dataSemestre, this.dataSemestre.data.length, this.dataSemestreTotal);
    if (semestresMax && this.dataSemestre.data.length < semestresMax) {
      this.enEdicionSemestreNuevo = true;
      this.enEdicionSemestreViejo = false;
      //this.dataSemestre.push(new LocalDataSource());
      this.dataSemestre.data.push(new MatTableDataSource<any>([]));
      this.punteroSemestrePlan = this.dataSemestre.data.length - 1;
      //let total = <any>UtilidadesService.hardCopy(this.formatototal);
      //this.dataSemestreTotal.push(new LocalDataSource([total]));
      this.dataSemestreTotal.push([UtilidadesService.hardCopy(this.formatototal)]);
      //this.createTableSemestre();
      //this.createTableSemestreTotal();
      this.numSemestresCompletado = this.dataSemestre.data.length === semestresMax;
    }
    console.log(semestresMax, this.dataSemestre, this.dataSemestre.data.length, this.dataSemestreTotal, this.dataSemestreTotal[0]);
  }

  aniadirASemestre(id: any) {
    // ToDo mostrar mensaje de confirmación cuando no sea el último semestre
    console.log(id, this.dataEspaciosAcademicos, this.ListEspacios);
    this.runValidations2SpacesAdding(id)
      .then((result: any) => {
        if (result["valid"]) {
          this.addtoSemester(id);
        } else {
          this.popUpManager.showErrorAlert(result["error"]);
        }
      })
      .catch((result) => {
        this.popUpManager.showErrorAlert(result["error"]);
      });
  }

  async runValidations2SpacesAdding(id: any): Promise<object> {
    let result = {
      valid: true,
      error: null,
      showPopUp: false,
      messagePopUp: ""
    }
    return new Promise<object>((resolve, reject) => {
      this.validarPrerequisitosAgregar(id).then((valid) => {
        if (valid) {
          resolve(result);
        } else {
          result["valid"] = false;
          result["error"] = this.translate.instant(
            'plan_estudios.error_validacion_prerrequisitos_espacios');
          reject(result);
        }
      });
    });
  }

  async validarPrerequisitosAgregar(id: any): Promise<boolean> {
    let currentSpace = this.ListEspacios.find(espacio => espacio._id == id);
    let prerrequisitos = currentSpace["prerequisitos"];
    let index = 0;
    let validPrerequisite = true;
    let stopIt = false;

    if (prerrequisitos != undefined) {
      for (const prerrequisito of prerrequisitos) {
        await this.validarPrerrequisitoSinAsignar(prerrequisito).then((res) => {
          if (!res) {
            validPrerequisite = res;
            stopIt = true;
          }
        });
        if (stopIt) {
          break;
        } else {
          await this.validarPrerrequisitoSemestreActual(prerrequisito).then((resSemestre) => {
            if (!resSemestre) {
              validPrerequisite = resSemestre;
              stopIt = true;
            }
          });
        }

        if (stopIt) {
          break;
        }
        index++;
      }
      return validPrerequisite;
    } else {
      return validPrerequisite;
    }
  }
  //#endregion
  // * ----------

  // validarPrerrequisitoSinAsignar(prerrequisito: any): Promise<any> {
  //   return new Promise((resolve) => {
  //     // Valida que no se encuentre en la lista de espacios por asignar
  //     this.dataEspaciosAcademicos.getAll().then((data: any) => {
  //       let index = 0;

  //       if (data.length > 0) {
  //         for (const element of data) {
  //           if (element._id === prerrequisito._id) {
  //             resolve(false);
  //             break;
  //           }

  //           if (index >= data.length - 1) {
  //             resolve(true);
  //           }
  //           index++;
  //         }
  //       } else {
  //         resolve(true);
  //       }
  //     });
  //   });
  // }

  async validarPrerrequisitoSinAsignar(prerrequisito: any): Promise<any> {
    return new Promise((resolve) => {
      // Valida que no se encuentre en la lista de espacios por asignar
      if (this.dataEspaciosAcademicos.data.length > 0) {
        for (const element of this.dataEspaciosAcademicos.data) {
          if (element._id === prerrequisito._id) {
            resolve(false);
            break;
          }
        }

        resolve(true);
      } else {
        resolve(true);
      }
    });
  }

  // async validarPrerrequisitoSemestreActual(prerrequisito: any): Promise<any> {
  //   return new Promise((resolve) => {
  //     // Valida que no se encuentre en el semestre actual
  //     this.dataSemestre[this.dataSemestre.length - 1].getAll().then((data: any) => {
  //       let index = 0;

  //       if (data.length > 0) {
  //         for (const element of data) {
  //           if (element._id === prerrequisito._id) {
  //             resolve(false);
  //             break;
  //           }

  //           if (index >= data.length - 1) {
  //             resolve(true);
  //           }
  //           index++;
  //         }
  //       } else {
  //         resolve(true);
  //       }
  //     });
  //   });
  // }

  async validarPrerrequisitoSemestreActual(prerrequisito: any): Promise<any> {
    return new Promise((resolve) => {
      // Valida que no se encuentre en el semestre actual
      this.dataSemestre.data[this.dataSemestre.data.length - 1].data.then((data: any) => {
        if (data.length > 0) {
          for (const element of data) {
            if (element._id === prerrequisito._id) {
              resolve(false);
              break;
            }
          }

          resolve(true);
        } else {
          resolve(true);
        }
      });
    });
  }

  addtoSemester(id: any) {
    if (this.dataSemestre.data.length >= 1 && (this.enEdicionSemestreNuevo || this.enEdicionSemestreViejo)) {
      console.log(id, this.dataSemestre, this.dataEspaciosAcademicos, this.dataSemestreTotal);
      //this.dataSemestre[this.punteroSemestrePlan].add(event.data);
      let espacio = this.ListEspacios.find(espacio => espacio._id == id);
      this.dataSemestre.data[this.punteroSemestrePlan].data.push(espacio);
      //this.dataSemestre[this.punteroSemestrePlan].refresh();
      //this.dataEspaciosAcademicos.remove(event.data);
      this.dataEspaciosAcademicos.data = this.dataEspaciosAcademicos.data.filter((element: any) => element._id !== id);
      const totalSemestre = this.filaTotal(this.dataSemestre.data[this.punteroSemestrePlan].data);
      //this.dataSemestreTotal[this.punteroSemestrePlan].load(totalSemestre);
      this.dataSemestreTotal[this.punteroSemestrePlan] = totalSemestre;
      //this.dataSemestreTotal[this.punteroSemestrePlan].refresh();
      this.dataSemestre.data[this.punteroSemestrePlan].data = this.dataSemestre.data[this.punteroSemestrePlan].data
    }
  }

  actualizarPlanOrdenado(planCiclosBody: PlanCiclosOrdenado): Promise<any> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.planEstudiosService.put('plan_estudio_proyecto_academico/', planCiclosBody)
        .subscribe((res: any) => {
          this.loading = false;
          if (Object.keys(res.Data).length > 0) {
            this.popUpManager.showSuccessAlert(this.translate.instant('plan_estudios.plan_estudios_actualizacion_ok'));
            resolve(res.Data);
          } else {
            this.popUpManager.showErrorAlert(
              this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
            );
            reject({ "plan_estudio_proyecto": "Error actualizando" });
          }
        },
          (error: HttpErrorResponse) => {
            this.loading = false;
            this.popUpManager.showErrorAlert(
              this.translate.instant('plan_estudios.plan_estudios_actualizacion_error')
            );
            reject({ "plan_estudio_proyecto": "Error actualizando" });
          });
    });
  }
  //#endregion
  // * ----------

  consultarPlanOrdenado(idPlanOrdenadoCiclo: number): Promise<any> {
    this.loading = true;
    return new Promise((resolve, reject) => {
      this.planEstudiosService.get('plan_estudio_proyecto_academico/' + idPlanOrdenadoCiclo)
        .subscribe((resp: any) => {
          this.loading = false;
          resolve(resp.Data);
        }, (err) => {
          this.loading = false;
          reject({ "plan_estudio_proyecto": err });
        });
    });
  }

  desactivarSuprimidos(idArchivos: any[], relacion: string) {
    this.loading = true;
    if (idArchivos.length > 0) {
      idArchivos.forEach((id, i) => {
        this.gestorDocumentalService.deleteByIdDoc(id, relacion).subscribe();
        if ((i + 1) == idArchivos.length) {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }
  //#endregion
  // * ----------

  async prepareUpdateOrderedPlan(): Promise<boolean> {
    this.loading = true;
    await this.formatearOrdenPlanesCiclos().then((ordenPlanes) => {
      this.planEstudioOrdenadoBody.OrdenPlan = JSON.stringify(ordenPlanes);
    });
    return new Promise((resolve) => {
      this.actualizarPlanOrdenado(this.planEstudioOrdenadoBody).then((updatedOrderedPlan) => {
        this.loading = false;
        this.planEstudioOrdenadoBody = updatedOrderedPlan;
        resolve(true);
      },
        (err) => {
          this.loading = false;
          resolve(false);
        });
    });
  }

  async removePlan(id: any) {
    console.log(this.dataOrganizedStudyPlans)
    let element = this.dataOrganizedStudyPlans.data.find((element: any) => element._id === id)
    //await this.dataOrganizedStudyPlans.remove(element);
    this.dataOrganizedStudyPlans.data = this.dataOrganizedStudyPlans.data.filter((element: any) => element._id !== id);
    if (this.planEstudioOrdenadoBody) {
      this.prepareUpdateOrderedPlan().then((res) => {
        if (res) {
          this.dataSimpleStudyPlans.data.push(element);
          //this.dataSimpleStudyPlans.refresh();
          let dataPlans = this.dataOrganizedStudyPlans.data
          dataPlans.forEach((plan: any, index: any) => {
            plan["orden"] = index + 1;
          });
          // this.dataOrganizedStudyPlans.getAll().then((dataPlans: any) => {
          //   dataPlans.forEach((plan: any, index: any) => {
          //     plan["orden"] = index + 1;
          //   });
          // });

        } else {
          this.dataOrganizedStudyPlans.data.push(element);
          //this.dataOrganizedStudyPlans.refresh();
        }
      });
    } else {
      this.dataSimpleStudyPlans.data.push(element);
      //this.dataSimpleStudyPlans.refresh();
      let dataPlans = this.dataOrganizedStudyPlans.data
      dataPlans.forEach((plan: any, index: any) => {
        plan["orden"] = index + 1;
      });
      // this.dataOrganizedStudyPlans.getAll().then((dataPlans: any) => {
      //   dataPlans.forEach((plan: any, index: any) => {
      //     plan["orden"] = index + 1;
      //   });
      // });
      //this.dataOrganizedStudyPlans.refresh();
    }
  }

  addPlan(id: any) {
    console.log(this.dataSimpleStudyPlans)
    let element = this.dataSimpleStudyPlans.data.find((plan: any) => plan.id === id)
    //let newPlan = event.data;
    element["orden"] = this.dataOrganizedStudyPlans.data.length + 1;
    this.dataOrganizedStudyPlans.data.push(element);
    //this.dataOrganizedStudyPlans.refresh();
    //this.dataSimpleStudyPlans.remove(event.data);
    this.dataSimpleStudyPlans.data = this.dataSimpleStudyPlans.data.filter((element: any) => element._id !== id);
  }

  async removeFromSemester(element: any) {
    if (this.enEdicionSemestreNuevo || this.enEdicionSemestreViejo) {
      //let element = this.dataSimpleStudyPlans.data.find((plan: any) => plan.id === id)
      //await this.dataSemestre[this.punteroSemestrePlan].remove(event.data);
      console.log(element, this.dataSemestre.data[this.punteroSemestrePlan].data, this.dataSemestre.data);
      this.dataSemestre.data[this.punteroSemestrePlan].data = this.dataSemestre.data[this.punteroSemestrePlan].data.filter((item: any) => item._id !== element._id);
      await this.prepareUpdateBySemester().then((res) => {
        if (res) {
          this.dataEspaciosAcademicos.data.push(element);
          //this.dataEspaciosAcademicos.refresh();
          console.log(this.dataSemestre.data[this.punteroSemestrePlan].data);
          const totalSemestre = this.filaTotal(this.dataSemestre.data[this.punteroSemestrePlan].data);
          // this.dataSemestreTotal[this.punteroSemestrePlan].load(totalSemestre);
          this.dataSemestreTotal[this.punteroSemestrePlan] = new MatTableDataSource<any>(totalSemestre);
          //this.dataSemestreTotal[this.punteroSemestrePlan].refresh();
        } else {
          this.addtoSemester(element._id);
        }
      });

    }
  }

  //--------------AQUIIIIII----------------//
  /*
  onAction(event: any): void {
    switch (event.action) {
      case "add_to_semester":
        // ToDo mostrar mensaje de confirmación cuando no sea el último semestre
        this.runValidations2SpacesAdding(event)
          .then((result: any) => {
            if (result["valid"]) {
              this.addtoSemester(event);
            } else {
              this.popUpManager.showErrorAlert(result["error"]);
            }
          })
          .catch((result) => {
            this.popUpManager.showErrorAlert(result["error"]);
          });
        break;
      case "remove_from_semester":
        // ToDo validar si no tiene prerrequisitos
        this.removeFromSemester(event);
        break;
      case "add_to_plan":
        this.addPlan(event);
        break;
      case "remove_plan":
        this.removePlan(event);
        break;
    }
  }
  */
}
