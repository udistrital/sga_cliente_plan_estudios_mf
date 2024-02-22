import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreacionPlanEstudiosComponent } from './creacion-plan-estudios.component';

describe('CreacionPlanEstudiosComponent', () => {
  let component: CreacionPlanEstudiosComponent;
  let fixture: ComponentFixture<CreacionPlanEstudiosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreacionPlanEstudiosComponent]
    });
    fixture = TestBed.createComponent(CreacionPlanEstudiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
