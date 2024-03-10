import { APP_BASE_HREF } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes, provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { CreacionPlanEstudiosComponent } from './components/creacion-plan-estudios/creacion-plan-estudios.component';
import { EvaluarPlanEstudiosComponent } from './components/evaluar-plan-estudios/evaluar-plan-estudios.component';
import { AuthGuard } from './_guards/auth.guard';
import { RevisarPlanesEstudioComponent } from './components/revisar-planes-estudio/revisar-planes-estudio.component';

const routes: Routes = [
  {
    path: 'crear',
    component: CreacionPlanEstudiosComponent
  },
  {
    path: 'evaluar',
    component: EvaluarPlanEstudiosComponent,
    //canActivate: [AuthGuard]
  },
  {
    path: 'revisar',
    component: RevisarPlanesEstudioComponent,
    //canActivate: [AuthGuard]
  }
];

// const routes: Routes = [{
//   path: '',
//   component: PlanEstudiosComponent,
//   children: [{
//     path: 'crear',
//     component: CreacionPlanEstudiosComponent,
//     canActivate: [AuthGuard]
//   },
//   {
//     path: 'evaluar',
//     component: EvaluarPlanEstudiosComponent,
//     canActivate: [AuthGuard]
//   },
//   {
//     path: 'revisar',
//     component: RevisarPlanesEstudioComponent,
//     canActivate: [AuthGuard]
//   }
//   ]
// }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: '/plan-estudio/' },
    getSingleSpaExtraProviders(),
    provideHttpClient(withFetch())]
})
export class AppRoutingModule { }
