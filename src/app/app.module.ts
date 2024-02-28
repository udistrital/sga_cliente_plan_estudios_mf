import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CreacionPlanEstudiosComponent } from './components/creacion-plan-estudios/creacion-plan-estudios.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from 'src/environments/environment';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon'
import { MatTableModule } from '@angular/material/table'
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DialogVerObservacionComponent } from './components/dialog-ver-observacion/dialog-ver-observacion.component';
import { PlanEstudiosService } from './services/plan_estudios.service';
import { EspaciosAcademicosService } from './services/espacios_academicos.service';
import { SummaryPlanesEstudioComponent } from './components/summary-planes-estudio/summary-planes-estudio.component';
import { VisualizarDocumentoPlanComponent } from './components/visualizar-documento-plan/visualizar-documento-plan.component';
import { SafeURL } from './pipes/safeUrl.pipe';
import { DinamicFormGroupComponent } from './components/dinamic-form-group/dinamic-form-group.component';
import { EvaluarPlanEstudiosComponent } from './components/evaluar-plan-estudios/evaluar-plan-estudios.component';
import { RevisarPlanesEstudioComponent } from './components/revisar-planes-estudio/revisar-planes-estudio.component';
import { DialogoEvaluarComponent } from './components/dialogo-evaluar/dialogo-evaluar.component';

@NgModule({
  declarations: [
    AppComponent,
    CreacionPlanEstudiosComponent,
    DialogVerObservacionComponent,
    SummaryPlanesEstudioComponent,
    VisualizarDocumentoPlanComponent,
    SafeURL,
    DinamicFormGroupComponent,
    EvaluarPlanEstudiosComponent,
    RevisarPlanesEstudioComponent,
    DialogoEvaluarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatExpansionModule,
    MatPaginatorModule,
    TranslateModule.forRoot({
      loader:{
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
  ],
  providers: [
    PlanEstudiosService,
    EspaciosAcademicosService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'http://localhost:4211/assets/i18n/', '.json');
}

//export function createTranslateLoader(http: HttpClient) { return new TranslateHttpLoader(http, 'http:localhost:4211/assets/i18n/', '.json'); }