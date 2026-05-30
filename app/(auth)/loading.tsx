export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/green-sol-logo.svg"
        alt="Cargando Green Sol"
        className="size-16"
        style={{ animation: "greensol-wobble 0.8s ease-in-out infinite" }}
      />
    </div>
  );
}
