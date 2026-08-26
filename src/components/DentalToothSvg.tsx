import type { MouseEvent } from 'react';

export type ToothSurface = 'mesial' | 'distal' | 'vestibular' | 'lingual' | 'oclusal';
export type SurfaceMark = 'patologia' | 'tratamiento' | boolean;

interface DentalToothSvgProps {
  toothNumber: number;
  surfaces: Record<string, boolean | string>;
  onSurfaceClick?: (surface: ToothSurface) => void;
  compact?: boolean;
}

export function toothKind(toothNumber: number) {
  const lastDigit = toothNumber % 10;
  if ([1, 2].includes(lastDigit)) return 'incisivo';
  if (lastDigit === 3) return 'canino';
  if ([4, 5].includes(lastDigit)) return 'premolar';
  return 'molar';
}

const surfaceLabels: Record<ToothSurface, string> = {
  mesial: 'Mesial',
  distal: 'Distal',
  vestibular: 'Vestibular',
  lingual: 'Lingual / palatina',
  oclusal: 'Oclusal / incisal',
};

function getSurfaceClass(value: SurfaceMark) {
  if (value === 'patologia') return 'fill-rose-500 stroke-rose-700';
  if (value === 'tratamiento') return 'fill-sky-500 stroke-sky-700';
  if (value === true) return 'fill-rose-400 stroke-rose-700';
  return 'fill-white stroke-slate-300';
}

export default function DentalToothSvg({ toothNumber, surfaces, onSurfaceClick, compact = false }: DentalToothSvgProps) {
  function handleSurfaceClick(event: MouseEvent<SVGElement>, surface: ToothSurface) {
    event.stopPropagation();
    onSurfaceClick?.(surface);
  }

  const size = compact ? 78 : 190;
  const kind = toothKind(toothNumber);
  const toothStatus = surfaces.tooth_status;
  const isAbsent = toothStatus === 'ausente';
  const isExtraction = toothStatus === 'extraccion';
  const surfaceProps = (surface: ToothSurface) => ({
    role: onSurfaceClick ? 'button' as const : undefined,
    tabIndex: onSurfaceClick ? 0 : undefined,
    'aria-label': `${surfaceLabels[surface]} de pieza ${toothNumber}`,
    className: `${getSurfaceClass(surfaces[surface] as SurfaceMark)} transition hover:brightness-95`,
    onClick: (event: MouseEvent<SVGElement>) => handleSurfaceClick(event, surface),
  });

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="mx-auto overflow-visible" aria-label={`Pieza dental ${toothNumber}`}>
      <title>Pieza {toothNumber}. Haz clic en una superficie para marcarla.</title>
      <g className={kind === 'molar' ? 'stroke-[3]' : kind === 'premolar' ? 'stroke-[2.5]' : 'stroke-2'}>
        <polygon points="25,25 75,25 90,75 25,75" {...surfaceProps('mesial')} />
        <polygon points="125,25 175,25 175,75 110,75" {...surfaceProps('distal')} />
        <polygon points="25,125 90,125 75,175 25,175" {...surfaceProps('vestibular')} />
        <polygon points="110,125 175,125 175,175 125,175" {...surfaceProps('lingual')} />
        <polygon points="75,75 125,75 125,125 75,125" {...surfaceProps('oclusal')} />
      </g>
      {isAbsent && <line x1="28" y1="28" x2="172" y2="172" className="stroke-rose-700 stroke-[8]" />}
      {isAbsent && <line x1="172" y1="28" x2="28" y2="172" className="stroke-rose-700 stroke-[8]" />}
      {isExtraction && <g className="stroke-rose-700 stroke-[7]"><line x1="35" y1="35" x2="165" y2="165" /><line x1="165" y1="35" x2="35" y2="165" /></g>}
      <text x="100" y="193" textAnchor="middle" className="fill-slate-900 text-[30px] font-black">{toothNumber}</text>
    </svg>
  );
}
