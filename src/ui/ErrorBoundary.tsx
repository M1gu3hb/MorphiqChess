import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Lo que se muestra si algo falla al pintar. */
  readonly fallback: ReactNode;
  readonly children: ReactNode;
}

interface State {
  readonly failed: boolean;
}

/**
 * Evita que un fallo (por ejemplo, que el código del entrenamiento no llegue por mala conexión)
 * deje la pantalla en blanco: en su lugar se muestra `fallback`.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
