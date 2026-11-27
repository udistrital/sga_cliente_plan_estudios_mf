import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PopUpDialogData {
  title: string;
  text: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'question';
  cancelar: boolean;
  aceptarTexto: string;
  cancelarTexto: string;
}

export interface PopUpDialogResult {
  isConfirmed: boolean;
  isDismissed: boolean;
}

@Component({
  selector: 'app-pop-up-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './pop-up-dialog.component.html',
  styleUrls: ['./pop-up-dialog.component.scss']
})
export class PopUpDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PopUpDialogData,
    private dialogRef: MatDialogRef<PopUpDialogComponent>
  ) {}

  get icon(): string {
    const icons: Record<string, string> = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
      question: 'help'
    };

    return icons[this.data.type] || 'info';
  }

  confirmar(): void {
    this.dialogRef.close({
      isConfirmed: true,
      isDismissed: false
    } as PopUpDialogResult);
  }

  cancelar(): void {
    this.dialogRef.close({
      isConfirmed: false,
      isDismissed: true
    } as PopUpDialogResult);
  }
}