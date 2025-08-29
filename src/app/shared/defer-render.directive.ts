import { Directive, TemplateRef, ViewContainerRef, Inject, PLATFORM_ID, Input, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type DeferOpts = { threshold?: number; rootMargin?: string };

@Directive({
  selector: '[appDeferRender]',
  standalone: true,
})
export class DeferRenderDirective implements OnInit, OnDestroy {
  @Input('appDeferRender') opts: DeferOpts | '' = '';
  private io?: IntersectionObserver;

  constructor(
    private tpl: TemplateRef<unknown>,
    private vcr: ViewContainerRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {
    // SSR: renderiza direto
    if (!isPlatformBrowser(this.platformId)) {
      this.vcr.createEmbeddedView(this.tpl);
      return;
    }

    // alvo: o elemento pai do <ng-container> (no seu caso, o <section id="sobre">)
    const hostParent = (this.vcr.element.nativeElement as Comment).parentElement as HTMLElement | null;

    if (!hostParent || !('IntersectionObserver' in window)) {
      this.vcr.createEmbeddedView(this.tpl);
      return;
    }

    const { threshold = 0.12, rootMargin = '0px 0px -10% 0px' } = (this.opts || {}) as DeferOpts;

    this.io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) {
        this.vcr.createEmbeddedView(this.tpl);    // cria conteúdo
        this.io?.disconnect();                    // só uma vez
      }
    }, { threshold, rootMargin });

    this.io.observe(hostParent);
  }

  ngOnDestroy() { this.io?.disconnect(); }
}
