import { useId } from 'react';

interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly help?: string;
}

/** Interruptor accesible: es un checkbox con rol «switch», operable con teclado y lector de pantalla. */
export function Switch({ checked, onChange, label, help }: SwitchProps) {
  const helpId = useId();
  return (
    <label className="switch">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        aria-describedby={help ? helpId : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch__track" aria-hidden="true" />
      <span className="switch__text">
        <span className="switch__label">{label}</span>
        {help && (
          <span id={helpId} className="switch__help">
            {help}
          </span>
        )}
      </span>
    </label>
  );
}
