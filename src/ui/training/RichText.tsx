import type { ReactNode } from 'react';
import { localizeSan } from '../../engine';
import { parseInline, type Block, type Run } from '../../training/markup';

/** Cómo se escribe una jugada en pantalla: Cf3, Axh7+… */
export const displayMove = (san: string): string => localizeSan(san, 'es');

function RunView({ run }: { run: Run }) {
  let node: ReactNode = run.move ? <span className="mv">{displayMove(run.text)}</span> : run.text;
  if (run.italic) node = <em>{node}</em>;
  if (run.bold) node = <strong>{node}</strong>;
  return <>{node}</>;
}

export function Runs({ runs }: { runs: readonly Run[] }) {
  return (
    <>
      {runs.map((run, index) => (
        <RunView key={index} run={run} />
      ))}
    </>
  );
}

/** Una línea con formato (títulos y resúmenes). */
export function Inline({ text }: { text: string }) {
  return <Runs runs={parseInline(text)} />;
}

const Caret = () => <span className="caret" aria-hidden="true" />;

/** Bloques de texto ya interpretados (nunca HTML en crudo). `caret` pone el cursor al final del texto. */
export function RichBlocks({ blocks, caret = false }: { blocks: readonly Block[]; caret?: boolean }) {
  return (
    <>
      {blocks.map((block, index) => {
        const last = caret && index === blocks.length - 1;
        switch (block.kind) {
          case 'h':
            return (
              <h3 key={index} className="rt-h">
                <Runs runs={block.runs} />
                {last && <Caret />}
              </h3>
            );
          case 'p':
            return (
              <p key={index}>
                <Runs runs={block.runs} />
                {last && <Caret />}
              </p>
            );
          case 'quote':
            return (
              <blockquote key={index} className="rt-quote">
                <Runs runs={block.runs} />
                {last && <Caret />}
              </blockquote>
            );
          case 'ul':
          case 'ol': {
            const List = block.kind;
            return (
              <List key={index} className="rt-list">
                {block.items.map((item, at) => (
                  <li key={at}>
                    <Runs runs={item} />
                    {last && at === block.items.length - 1 && <Caret />}
                  </li>
                ))}
              </List>
            );
          }
        }
      })}
    </>
  );
}
