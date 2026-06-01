/**
 * Fondo decorativo de marca: glows de color difuminados (glass), muy sutiles,
 * con una variante distinta por pantalla para diferenciarlas visualmente.
 * Es puramente decorativo (aria-hidden) y no captura eventos.
 */
const blob = "absolute rounded-full blur-[120px]";

export function FondoMarca({
  variante,
}: {
  variante: "inicio" | "login" | "registro";
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {variante === "inicio" && (
        <>
          <div
            className={`${blob} -top-24 left-1/2 size-[30rem] -translate-x-1/2 bg-brand/25`}
          />
          <div className={`${blob} bottom-[-4rem] right-0 size-80 bg-brand-2/20`} />
        </>
      )}
      {variante === "login" && (
        <>
          <div className={`${blob} -top-16 right-[-4rem] size-96 bg-brand-2/25`} />
          <div className={`${blob} bottom-[-4rem] left-[-4rem] size-72 bg-brand/15`} />
        </>
      )}
      {variante === "registro" && (
        <>
          <div className={`${blob} -top-20 left-[-4rem] size-96 bg-gold/20`} />
          <div
            className={`${blob} bottom-[-4rem] right-1/4 size-80 bg-brand/20`}
          />
        </>
      )}
    </div>
  );
}
