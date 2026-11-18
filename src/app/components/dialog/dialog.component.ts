import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';

@Component({
  selector: 'app-dialog',
  template: `
    <div class="dialog-backdrop" (click)="onBackdropClick($event)">
      <div class="dialog-modal" [class.wide]="wide" (click)="$event.stopPropagation()">
        <div class="dialoghead">
          <h2>{{ title }}</h2>
          <button aria-label="Close dialog" (click)="close.emit()">
            <app-icon name="X" [size]="20"></app-icon>
          </button>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class DialogComponent {
  @Input() title = '';
  @Input() wide = false;
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}

