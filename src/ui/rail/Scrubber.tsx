import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { scrubFraction, scrubValue } from './geometry';

/** Alto del control en px; debe coincidir con `--thumb` en game.css. */
const THUMB = 28;

interface ScrubberProps {
  readonly value: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
  readonly label: string;
  readonly valueText: string;
}

/**
 * Guía vertical para recorrer las jugadas con el dedo: arriba la posición inicial, abajo la última.
 * Es un control deslizante accesible (role="slider") hecho a mano porque los `<input type="range">`
 * verticales se comportan distinto en cada navegador.
 */
export function Scrubber({ value, max, onChange, label, valueText }: ScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const sent = useRef(value);
  const disabled = max <= 0;

  useEffect(() => {
    sent.current = value;
  }, [value]);

  const send = (next: number) => {
    if (next === sent.current) return;
    sent.current = next;
    onChange(next);
  };

  const fromPointer = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const box = track.getBoundingClientRect();
    send(scrubValue(clientY - box.top, box.height, THUMB, max));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    fromPointer(event.clientY);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientY);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    let next: number;
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        next = value - 1;
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        next = value + 1;
        break;
      case 'PageUp':
        next = value - 5;
        break;
      case 'PageDown':
        next = value + 5;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    send(Math.min(max, Math.max(0, next)));
  };

  return (
    <div
      ref={trackRef}
      className="scrubber"
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      style={{ '--t': scrubFraction(value, max) } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
    >
      <span className="scrubber__track" aria-hidden="true" />
      <span className="scrubber__fill" aria-hidden="true" />
      <span className="scrubber__thumb" aria-hidden="true" />
    </div>
  );
}
