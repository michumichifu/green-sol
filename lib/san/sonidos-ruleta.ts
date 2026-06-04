// Sonidos sintéticos para la ruleta (Web Audio API): tic al pasar cada segmento y
// un arpegio de "ganador" al detenerse. No usa archivos ni librerías externas.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Algunos navegadores suspenden el contexto hasta una interacción del usuario.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Clic corto, como el de un puntero pasando por un diente de la ruleta. */
export function tick() {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "square";
  o.frequency.value = 1500;
  g.gain.setValueAtTime(0.05, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.03);
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.03);
}

/** Arpegio ascendente tipo "¡ganaste!" cuando la ruleta se detiene. */
export function ganador() {
  const c = getCtx();
  if (!c) return;
  const notas = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notas.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    const t = c.currentTime + i * 0.1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + 0.4);
  });
}
