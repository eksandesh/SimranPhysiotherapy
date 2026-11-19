import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css']
})
export class BadgeComponent {
  @Input() status = '';

  get badgeClass(): string {
    const s = this.status;
    let colorClass = 'blue';
    if (s === 'Active' || s === 'Completed') {
      colorClass = 'green';
    } else if (s === 'Follow-up') {
      colorClass = 'amber';
    } else if (s === 'Cancelled') {
      colorClass = 'red';
    }
    return 'badge ' + colorClass;
  }
}

