import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import {
  PopUpDialogComponent,
  PopUpDialogResult
} from './pop-up-dialog/pop-up-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class PopUpManager {

  constructor(
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private dialog: MatDialog
  ) {}

  // =====================================================
  // TOASTS
  // =====================================================

  showToast(message: string, duration: number = 3000): void {
    this.translate.get(message).subscribe((translatedMessage: string) => {
      this.snackBar.open(translatedMessage, 'Cerrar', {
        duration: duration,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    });
  }

  showErrorToast(message: string): void {
    this.translate.get(message).subscribe((translatedMessage: string) => {
      this.snackBar.open(translatedMessage, 'Cerrar', {
        duration: 5000,
        panelClass: ['snackbar-error'],
      });
    });
  }

  showInfoToast(message: string, duration: number = 0): void {
    this.translate.get(message).subscribe((translatedMessage: string) => {
      this.snackBar.open(translatedMessage, 'Cerrar', {
        duration: duration,
        panelClass: ['snackbar-info'],
      });
    });
  }

  // =====================================================
  // ALERTAS
  // =====================================================

  showAlert(
    title: string,
    text: string
  ): Promise<PopUpDialogResult> {
    return this.showPopUpGeneric(
      title,
      text,
      'info',
      false
    );
  }

  showSuccessAlert(text: string): Promise<PopUpDialogResult> {
    return this.showPopUpGeneric(
      this.translate.instant('GLOBAL.operacion_exitosa'),
      text,
      'success',
      false
    );
  }

  showErrorAlert(text: string): Promise<PopUpDialogResult> {
    return this.showPopUpGeneric(
      this.translate.instant('GLOBAL.error'),
      text,
      'error',
      false
    );
  }

  showConfirmAlert(
    text: string,
    title: string = this.translate.instant('GLOBAL.atencion')
  ): Promise<PopUpDialogResult> {
    return this.showPopUpGeneric(
      title,
      text,
      'warning',
      true
    );
  }

  // =====================================================
  // POPUP GENERICO - ANGULAR MATERIAL
  // =====================================================

  showPopUpGeneric(
    title: string,
    text: string,
    type: 'success' | 'error' | 'warning' | 'info' | 'question',
    cancelar: boolean
  ): Promise<PopUpDialogResult> {

    const dialogRef = this.dialog.open(PopUpDialogComponent, {
      width: '420px',
      maxWidth: '90vw',
      autoFocus: false,
      restoreFocus: true,
      disableClose: cancelar,
      panelClass: 'popup-confirmation',
      data: {
        title: title,
        text: text,
        type: type,
        cancelar: cancelar,
        aceptarTexto: this.translate.instant('GLOBAL.aceptar'),
        cancelarTexto: this.translate.instant('GLOBAL.cancelar')
      }
    });

    return firstValueFrom(dialogRef.afterClosed()).then(result => ({
      isConfirmed: result?.isConfirmed ?? false,
      isDismissed: result?.isDismissed ?? true
    }));
  }

  // =====================================================
  // FORMULARIO POPUP
  // =====================================================

  showPopUpForm(
    title: string,
    form: { html: string; ids: any[] },
    cancelar: boolean
  ): Promise<any> {

    // Pendiente de migrar a Angular Material.
    // Actualmente este método conserva su comportamiento original.
    throw new Error(
      'showPopUpForm todavía no ha sido migrado a Angular Material.'
    );
  }

}


// import { Injectable } from '@angular/core';
// import { NbToastrService } from '@nebular/theme';
// import Swal from 'sweetalert2';
// import { TranslateService } from '@ngx-translate/core';
// import { NbToastrConfig } from '@nebular/theme/components/toastr/toastr-config';


// @Injectable({
//     providedIn: 'root',
// })
// export class PopUpManager {
//     constructor(
//         private toast: NbToastrService,
//         private translate: TranslateService,
//     ) { }
//     /**
//      * showToast
//      */
//     public showToast(status: any, message: string, tittle = '') {
//         this.toast.show(message, tittle, { status });
//     }

//     public showErrorToast(message: string) {
//         let status: any = 'danger';
//         if (message === 'ERROR.200') {
//             this.toast.show('', this.translate.instant('GLOBAL.no_informacion_registrada'),{status: 'warning'});
//         } else {
//             this.toast.show(message, this.translate.instant('GLOBAL.error'), { status });
//         }
//     }

//     public showInfoToast(message: string, duration: number = 0) {
//         const status: any = 'info';
//         this.toast.show(message, this.translate.instant('GLOBAL.info'), { status, duration });
//     }

//     public showAlert(status: any, text: any) {
//         Swal.fire({
//             icon: 'info',
//             title: status,
//             text: text,
//             confirmButtonText: this.translate.instant('GLOBAL.aceptar'),
//         });
//     }

//     public showSuccessAlert(text: any) {
//         return Swal.fire({
//             icon: 'success',
//             title: this.translate.instant('GLOBAL.operacion_exitosa'),
//             text: text,
//             confirmButtonText: this.translate.instant('GLOBAL.aceptar'),
//         });
//     }

//     public showErrorAlert(text: any) {
//         Swal.fire({
//             icon: 'error',
//             title: this.translate.instant('GLOBAL.error'),
//             text: text,
//             confirmButtonText: this.translate.instant('GLOBAL.aceptar'),
//         });
//     }

//     public showConfirmAlert(text: any, title = this.translate.instant('GLOBAL.atencion')): Promise<any> {
//         const options: any = {
//             title: title,
//             text: text,
//             type: 'warning',
//             showCancelButton: true,
//             confirmButtonText: this.translate.instant('GLOBAL.aceptar'),
//             cancelButtonText: this.translate.instant('GLOBAL.cancelar'),
//         };
//         return Swal.fire(options);
//     }

//     public showPopUpGeneric(title: any, text: any, type: any, cancelar: any): Promise<any> {
//         const opt: any = {
//             title: title,
//             html: text,
//             icon: type,
//             showCancelButton: cancelar,
//             allowOutsideClick: !cancelar,
//             confirmButtonText: this.translate.instant('GLOBAL.aceptar'),
//             cancelButtonText: this.translate.instant('GLOBAL.cancelar'),
//         };
//         return Swal.fire(opt);
//     }

//     public showPopUpForm(title: any, form: { html: any; ids: any[]; }, cancelar: any): Promise<any> {
//         const opt: any = {
//             title: title,
//             html: form.html,
//             showCancelButton: cancelar,
//             allowOutsideClick: !cancelar,
//             confirmButtonText: this.translate.instant('GLOBAL.aceptar'),
//             cancelButtonText: this.translate.instant('GLOBAL.cancelar'),
//             preConfirm: () => {
//                 const results = {};
//                 form.ids.forEach(id => {
//                     const element = <HTMLInputElement>Swal.getPopup()!.querySelector('#' + id)
//                   //  results[id] = element.value;
//                 });
//                 return results;
//             },
//         };
//         return Swal.fire(opt);
//     }

//     /*public showManyPopUp(title: any, steps: any[], type: any) {
//         const opts = steps.map(step => {
//             return {
//                 title: title,
//                 html: step,
//                 icon: type,
//                 confirmButtonText: this.translate.instant('GLOBAL.aceptar')
//             }
//         })
//         return Swal.queue(opts)
//     }*/
// }