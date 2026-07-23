import { useMemo } from 'react';

const CELL = 64;
const TILE = CELL * 5; // 320

function hash(row: number, col: number, seed: number): number {
  return ((row * 31 + col * 17 + seed * 53 + row * col * 7) % 997) / 997;
}

function pickColor(r: number, c: number, tri: number): string {
  const v = hash(r, c, tri + 1);
  if (v < 0.5) return '#0A0A0A';
  if (v < 0.8) return '#121212';
  // White at 8-14% — applied directly to the polygon fill, no wrapper opacity needed
  return `rgba(255,255,255,${(0.08 + ((v - 0.8) / 0.2) * 0.06).toFixed(3)})`;
}

export function GeometricBg() {
  const polys = useMemo(() => {
    const els: React.ReactElement[] = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const k = `${r}-${c}`;
        if (hash(r, c, 0) < 0.5) {
          els.push(
            <polygon
              key={`${k}-0`}
              points={`${x},${y} ${x + CELL},${y} ${x + CELL},${y + CELL}`}
              fill={pickColor(r, c, 0)}
            />,
            <polygon
              key={`${k}-1`}
              points={`${x},${y} ${x + CELL},${y + CELL} ${x},${y + CELL}`}
              fill={pickColor(r, c, 1)}
            />
          );
        } else {
          els.push(
            <polygon
              key={`${k}-0`}
              points={`${x + CELL},${y} ${x + CELL},${y + CELL} ${x},${y + CELL}`}
              fill={pickColor(r, c, 0)}
            />,
            <polygon
              key={`${k}-1`}
              points={`${x + CELL},${y} ${x},${y + CELL} ${x},${y}`}
              fill={pickColor(r, c, 1)}
            />
          );
        }
      }
    }
    return els;
  }, []);

  return (
    <svg
      className="pointer-events-none fixed inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="g"
          width={TILE}
          height={TILE}
          patternUnits="userSpaceOnUse"
        >
          {polys}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
  );
}
