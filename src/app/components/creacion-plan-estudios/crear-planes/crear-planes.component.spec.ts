import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearPlanesComponent } from './crear-planes.component';

describe('CrearPlanesComponent', () => {
  let component: CrearPlanesComponent;
  let fixture: ComponentFixture<CrearPlanesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPlanesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearPlanesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
