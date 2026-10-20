import '../../styles/training.css';
import type { SettingsStore } from '../../game';
import { TrainingStore } from '../../training/progress';
import type { Navigation, TrainingRoute } from '../route';
import { CourseScreen } from './CourseScreen';
import { LessonScreen } from './LessonScreen';
import { PracticeScreen } from './PracticeScreen';
import { TrainingMenu } from './TrainingMenu';

/** Un solo almacén de progreso para toda la app (se crea al abrir el entrenamiento por primera vez). */
const trainingStore = new TrainingStore();

interface Props extends Navigation {
  readonly route: TrainingRoute;
  readonly settingsStore: SettingsStore;
}

/**
 * Todo el modo entrenamiento. Se carga aparte (`import()` en App) para que quien solo quiere
 * jugar una partida no descargue lecciones, variantes ni estilos que no va a usar.
 */
export default function TrainingApp({ route, settingsStore, go, back }: Props) {
  switch (route.name) {
    case 'training':
      return <TrainingMenu store={trainingStore} go={go} back={back} />;
    case 'course':
      return <CourseScreen store={trainingStore} courseId={route.course} go={go} back={back} />;
    case 'lesson':
      return (
        <LessonScreen
          key={`${route.course}/${route.lesson}`}
          store={trainingStore}
          settingsStore={settingsStore}
          courseId={route.course}
          lessonId={route.lesson}
          go={go}
          back={back}
        />
      );
    case 'practice':
      return (
        <PracticeScreen
          store={trainingStore}
          settingsStore={settingsStore}
          courseId={route.course}
          mode={route.mode}
          go={go}
          back={back}
        />
      );
  }
}
