// A deterministic, QR-like pattern for the preview ticket. Production uses a real QR library
// encoding a signed ticket token that the check-in scanner verifies on the server.
export function qrMatrix(text: string, size = 25): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
  const m = Array.from({ length: size }, () => Array.from({ length: size }, () => rand() > 0.52));
  const finder = (r: number, c: number) => {
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
      const yy = r + y, xx = c + x;
      if (yy < 0 || xx < 0 || yy >= size || xx >= size) continue;
      const edge = y === 0 || y === 6 || x === 0 || x === 6;
      const core = y >= 2 && y <= 4 && x >= 2 && x <= 4;
      m[yy][xx] = y >= 0 && y <= 6 && x >= 0 && x <= 6 && (edge || core);
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  return m;
}
