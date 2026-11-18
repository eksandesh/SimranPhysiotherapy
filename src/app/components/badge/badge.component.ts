import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-badge',
  template: `
    <span [class]="badgeClass"><i></i>{{ status }}</span>
  `
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
