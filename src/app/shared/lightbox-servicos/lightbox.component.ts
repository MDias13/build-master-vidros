import {
  Component, Input, Output, EventEmitter,
  HostListener, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['../../landing/manter/landing.component.scss'], // opcional (você pode manter os estilos globais já existentes)
  template: `
  <div class="gxlb" *ngIf="open" (click)="emitClose()">
    <div class="gxlb__inner"
         (click)="$event.stopPropagation()"
         role="dialog" aria-modal="true"
         (touchstart)="onTouchStart($event)"
         (touchmove)="onTouchMove($event)"
         (touchend)="onTouchEnd($event)"
         (pointerdown)="onPointerDown($event)"
         (pointermove)="onPointerMove($event)"
         (pointerup)="onPointerUp($event)">

      <button type="button" class="gxlb__close" (click)="emitClose()" aria-label="Fechar">×</button>

      <button type="button" class="gxlb__nav gxlb__nav--prev"
              (click)="prev($event)" aria-label="Anterior">‹</button>

      <img [src]="currentImage()" [alt]="title || 'Imagem'" />

      <button type="button" class="gxlb__nav gxlb__nav--next"
              (click)="next($event)" aria-label="Próximo">›</button>

      <div class="gxlb__count">
        {{ displayIndex() + 1 }} / {{ images?.length || 0 }} — {{ title }}
      </div>
    </div>
  </div>
  `
})
export class LightboxComponent implements OnChanges {
  /** Controlado pelo pai */
  @Input() open = false;
  @Input() images: string[] = [];
  @Input() index = 0;
  @Input() title = '';

  /** Eventos pro pai reagir */
  @Output() close = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  // ——— Navegação por teclado ———
  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    if (!this.open) return;
    if (ev.key === 'Escape') this.emitClose();
    if (ev.key === 'ArrowLeft') this.prev(ev);
    if (ev.key === 'ArrowRight') this.next(ev);
  }

  // ——— Swipe (touch/pointer) ———
  private swipe = { active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, startT: 0 };
  private readonly SWIPE_THRESHOLD_PX = 40;
  private readonly SWIPE_MAX_ANGLE = 0.66; // prioriza horizontal
  private readonly SWIPE_MAX_TIME = 700;

  onTouchStart(ev: TouchEvent) {
    if (!ev.touches?.length) return;
    const t = ev.touches[0];
    this.swipe.active = true;
    this.swipe.startX = this.swipe.lastX = t.clientX;
    this.swipe.startY = this.swipe.lastY = t.clientY;
    this.swipe.startT = performance.now?.() ?? Date.now();
  }
  onTouchMove(ev: TouchEvent) {
    if (!this.swipe.active || !ev.touches?.length) return;
    const t = ev.touches[0];
    this.swipe.lastX = t.clientX;
    this.swipe.lastY = t.clientY;
  }
  onTouchEnd(_: TouchEvent) { this.handleSwipeEnd(); }

  onPointerDown(ev: PointerEvent) {
    this.swipe.active = true;
    this.swipe.startX = this.swipe.lastX = ev.clientX;
    this.swipe.startY = this.swipe.lastY = ev.clientY;
    this.swipe.startT = performance.now?.() ?? Date.now();
  }
  onPointerMove(ev: PointerEvent) {
    if (!this.swipe.active) return;
    this.swipe.lastX = ev.clientX;
    this.swipe.lastY = ev.clientY;
  }
  onPointerUp(_: PointerEvent) { this.handleSwipeEnd(); }

  private handleSwipeEnd() {
    if (!this.swipe.active) return;
    this.swipe.active = false;

    const dx = this.swipe.lastX - this.swipe.startX;
    const dy = this.swipe.lastY - this.swipe.startY;
    const dt = (performance.now?.() ?? Date.now()) - this.swipe.startT;

    const isMostlyHorizontal = Math.abs(dy) <= Math.abs(dx) * this.SWIPE_MAX_ANGLE;
    const farEnough = Math.abs(dx) > this.SWIPE_THRESHOLD_PX;
    const fastEnough = dt <= this.SWIPE_MAX_TIME;

    if (isMostlyHorizontal && farEnough && fastEnough) {
      dx < 0 ? this.next() : this.prev();
    }
  }

  // ——— Navegação ———
  prev(e?: Event) { e?.preventDefault(); e?.stopPropagation(); this.indexChange.emit(this.index - 1); }
  next(e?: Event) { e?.preventDefault(); e?.stopPropagation(); this.indexChange.emit(this.index + 1); }

  currentImage(): string {
    const len = this.images?.length || 0;
    if (!len) return '';
    return this.images[this.displayIndex()];
  }
  displayIndex(): number {
    const len = this.images?.length || 0;
    if (!len) return 0;
    const n = this.index % len;
    return (n + len) % len;
  }

  emitClose() { this.close.emit(); }

  // ——— trava scroll do body quando abre (browser only) ———
  ngOnChanges(ch: SimpleChanges) {
    if ('open' in ch && typeof document !== 'undefined') {
      document.body.style.overflow = this.open ? 'hidden' : '';
    }
  }
}
