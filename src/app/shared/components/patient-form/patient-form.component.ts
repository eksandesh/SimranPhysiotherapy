import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { Patient, day } from '../../../models/clinic.model';

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.css']
})
export class PatientFormComponent implements OnInit {
  @Input() patient?: Patient;
  @Output() commit = new EventEmitter<Patient>();

  name = '';
  age = '';
  gender = 'Female';
  phone = '';
  condition = '';
  status = 'Active';
  notes = '';

  ngOnInit() {
    if (this.patient) {
      this.name = this.patient.name;
      this.age = this.patient.age;
      this.gender = this.patient.gender || 'Female';
      this.phone = this.patient.phone || '';
      this.condition = this.patient.condition;
      this.status = this.patient.status || 'Active';
      this.notes = this.patient.notes || '';
    }
  }

  submit() {
    if (!this.name.trim() || !this.condition.trim()) return;

    const saved: Patient = {
      id: this.patient?.id || '',
      name: this.name.trim(),
      age: this.age,
      gender: this.gender,
      phone: this.phone,
      condition: this.condition.trim(),
      status: this.status,
      notes: this.notes,
      date: this.patient?.date || day()
    };

    this.commit.emit(saved);
  }
}

