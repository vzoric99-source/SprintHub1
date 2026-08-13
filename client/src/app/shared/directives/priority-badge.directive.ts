import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';

@Directive({
  selector: '[appPriorityBadge]',
  standalone: true,
})
export class PriorityBadgeDirective implements OnChanges {
  @Input('appPriorityBadge') priority: string = '';

  private el = inject(ElementRef);

  private readonly styles: Record<string, { bg: string; text: string; label: string }> = {
    URGENT: { bg: '#fef2f2', text: '#b91c1c', label: 'Urgent' },
    HIGH:   { bg: '#fff7ed', text: '#c2410c', label: 'High' },
    MEDIUM: { bg: '#eff6ff', text: '#1d4ed8', label: 'Medium' },
    LOW:    { bg: '#f0fdf4', text: '#15803d', label: 'Low' },
  };

  ngOnChanges(): void {
    const el = this.el.nativeElement as HTMLElement;
    const style = this.styles[this.priority] || this.styles['MEDIUM'];

    el.style.backgroundColor = style.bg;
    el.style.color = style.text;
    el.style.padding = '2px 8px';
    el.style.borderRadius = '9999px';
    el.style.fontSize = '12px';
    el.style.fontWeight = '500';
    el.style.display = 'inline-block';
    el.textContent = style.label;
  }
}
