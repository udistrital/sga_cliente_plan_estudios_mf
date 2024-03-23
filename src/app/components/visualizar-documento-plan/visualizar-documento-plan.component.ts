import { Component, OnInit, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PopUpManager } from 'src/app/managers/popUpManager';
import { SgaMidService } from 'src/app/services/sga_mid.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'visualizar-documento-plan',
  templateUrl: './visualizar-documento-plan.component.html',
  styleUrls: ['./visualizar-documento-plan.component.scss']
})
export class VisualizarDocumentoPlanComponent implements OnInit {
  
  documentData!: string;
  documentLoad!: boolean;
  studyPlanVisualizationData: any;

  constructor(
    public dialogRef: MatDialogRef<VisualizarDocumentoPlanComponent>,
    private translate: TranslateService,
    private popUpManager: PopUpManager,
    private sgaMidService: SgaMidService,
    @Inject(MAT_DIALOG_DATA) private data: any,
    ) {
    }

  async ngOnInit() {
    this.documentLoad = false;
    await this.getDocumentWitPlanData().then(documentOk => {
    },
    errorDocument => {
      this.documentLoad = false;
    }
    );
  }

  getPlanVisualizationData(): Promise<any> {
    return new Promise((resolve, reject) => {
      var urlPlanVisualization = `plan_estudios/study_plan_visualization/${this.data.plan_estudio_id}`;
      this.sgaMidService.get(urlPlanVisualization).subscribe(
        (response: any) => {
          this.studyPlanVisualizationData = response.Data;
          resolve({response});
        },
        (error: any) => {
          reject({ "plan_data": error });
        }
      );
    });
  }

  getDocumentWitPlanData(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.data.dataPlanes != null) {
        this.studyPlanVisualizationData = this.data.dataPlanes;  
        var urlPlanDocument = "plan_estudios/documento_plan_visual";
        this.sgaMidService.post(urlPlanDocument, this.studyPlanVisualizationData).subscribe(
          (resDocument: any) => {
            this.documentData = "data:application/pdf;base64,"+resDocument.Data;
            this.documentLoad = true;
            resolve(true);
          },
          (errorDocument) => {
            this.popUpManager.showPopUpGeneric(
              this.translate.instant('GLOBAL.error'),
              this.translate.instant('plan_estudios.error_generando_plan_estudio_visualizacion'),
              'error',
              false
            ).then(res => {
              if (res.value) {
                this.dialogRef.close();
              }
            });
            this.documentLoad = false;
            reject(false);
          }
        );
      } else {
        this.documentLoad = false;
        this.popUpManager.showPopUpGeneric(
          this.translate.instant('GLOBAL.error'),
          this.translate.instant('plan_estudios.error_cargando_plan_estudio_visualizacion'),
          'error',
          false
        ).then(res => {
          if (res.value) {
            this.dialogRef.close();
          }
        });
        reject(false);
      }
    }); 
  }

  getDocumentById(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getPlanVisualizationData().then(planVisualizationData => {
        var urlPlanDocument = "plan_estudios/documento_plan_visual";
        this.sgaMidService.post(urlPlanDocument, this.studyPlanVisualizationData).subscribe(
          (resDocument: any) => {
            this.documentData = "data:application/pdf;base64,"+resDocument.Data;
            this.documentLoad = true;
            resolve(true);
          },
          (errorDocument) => {
            this.popUpManager.showPopUpGeneric(
              this.translate.instant('GLOBAL.error'),
              this.translate.instant('plan_estudios.error_generando_plan_estudio_visualizacion'),
              'error',
              false
            ).then(res => {
              if (res.value) {
                this.dialogRef.close();
              }
            });
            this.documentLoad = false;
            reject(false);
          }
        );
      },
      errorData => {
        this.documentLoad = false;
        this.popUpManager.showPopUpGeneric(
          this.translate.instant('GLOBAL.error'),
          this.translate.instant('plan_estudios.error_cargando_plan_estudio_visualizacion'),
          'error',
          false
        ).then(res => {
          if (res.value) {
            this.dialogRef.close();
          }
        });
        reject(false);
      });
    });    
  }

  downloadDocument(){
    const src = this.documentData;
    const link = document.createElement("a")
    link.href = src
    link.download = `${this.translate.instant('plan_estudios.plan_estudios')}_${this.studyPlanVisualizationData.Nombre}`
    link.click();
    link.remove();
  }

}
