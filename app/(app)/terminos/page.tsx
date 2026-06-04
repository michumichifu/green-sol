import Link from "next/link";
import { ArrowLeft, ScrollText, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Términos y condiciones — Green Sol",
};

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 rounded-2xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-bold">{titulo}</h2>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-md space-y-4 px-5 py-6">
      <Link
        href="/perfil"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Perfil
      </Link>

      <div className="flex items-center gap-2">
        <ScrollText className="size-6 text-brand" />
        <h1 className="text-xl font-bold">Términos y condiciones</h1>
      </div>

      {/* Aviso de borrador / maqueta */}
      <div className="flex gap-2 rounded-2xl border border-gold/40 bg-gold/5 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold" />
        <span>
          <b>Borrador / maqueta.</b> Este texto es una base para revisar y ajustar
          según el modelo de negocio de Green Sol y lo que legalmente aplique. Los
          datos entre <span className="font-mono">[corchetes]</span> están por
          definir.
        </span>
      </div>

      <Seccion titulo="1. Qué es Green Sol">
        <p>
          Green Sol es una plataforma tecnológica que facilita la organización,
          conexión y gestión entre personas interesadas en participar en ahorros
          colaborativos entre particulares (sanes por turnos y vacas con meta
          común).
        </p>
        <p>
          La plataforma permite la coordinación entre usuarios, quienes de forma
          directa y voluntaria realizan los aportes y pagos correspondientes entre
          sí, utilizando los medios de pago de su preferencia.
        </p>
      </Seccion>

      <Seccion titulo="2. Green Sol no custodia los fondos">
        <p>
          <b>
            Green Sol no administra, custodia, recibe ni distribuye los fondos de
            los usuarios.
          </b>{" "}
          Todas las transferencias o aportes se realizan directamente entre los
          participantes.
        </p>
        <p>
          En cada san, el <b>organizador</b> es la persona responsable de recoger
          los aportes de la ronda y entregar el monto correspondiente al
          participante a quien le toca el turno. Green Sol solo provee las
          herramientas para organizar, registrar y dar seguimiento al proceso.
        </p>
        <p>
          [Razón social de la empresa operadora], operadora de Green Sol, no actúa
          como institución financiera, intermediario financiero ni proveedor de
          servicios de pago, ni realiza captación de fondos del público ni
          administración de recursos de terceros.
        </p>
        <p>
          De acuerdo con el análisis legal aplicable al modelo de negocio, la
          actividad de Green Sol corresponde al desarrollo y operación de una
          plataforma tecnológica de coordinación entre usuarios, por lo que no
          constituye intermediación financiera ni actividad bancaria regulada.
        </p>
        <p>
          La participación en los ahorros organizados a través de la plataforma es
          voluntaria y se realiza <b>bajo responsabilidad exclusiva de los usuarios
          participantes</b>.
        </p>
      </Seccion>

      <Seccion titulo="3. Verificación y seguridad">
        <p>
          Para participar, el usuario debe registrar y verificar su perfil
          (verificación de identidad / KYC) y confirmar las acciones sensibles —
          como unirse, reportar y aprobar pagos — con su <b>PIN</b> de seguridad.
        </p>
        <p>
          Al aprobar un pago, el organizador declara que verificó y recibió los
          fondos correspondientes; esa confirmación queda bajo su responsabilidad.
        </p>
        <p>
          El nivel de verificación puede habilitar montos y funciones dentro de la
          plataforma. [Límites por nivel — por definir.]
        </p>
      </Seccion>

      <Seccion titulo="4. Niveles y límites">
        <p className="rounded-lg bg-gold/10 px-2 py-1 text-xs text-gold">
          Borrador — nombres y cifras de ejemplo (ficticias), por definir.
        </p>
        <p>
          Green Sol reconoce el comportamiento responsable con un sistema de
          niveles. Cada nivel tiene una <b>etiqueta</b> (nombre cotidiano, por
          definir) y habilita un <b>monto máximo</b> y ciertos beneficios. El
          avance combina los puntos acumulados y el monto total ahorrado.
        </p>
        <ul className="space-y-1.5">
          <li className="rounded-lg border bg-muted/40 p-2">
            <b>Nivel 1 · [nombre]</b> — monto máx. $100 · 1 san a la vez · acceso
            básico.
          </li>
          <li className="rounded-lg border bg-muted/40 p-2">
            <b>Nivel 2 · [nombre]</b> — hasta $250 · 2 sanes simultáneos.
          </li>
          <li className="rounded-lg border bg-muted/40 p-2">
            <b>Nivel 3 · [nombre]</b> — hasta $500 · 3 sanes · acceso anticipado a
            nuevos grupos.
          </li>
          <li className="rounded-lg border bg-muted/40 p-2">
            <b>Nivel 4 · [nombre]</b> — hasta $1.000 · beneficios ampliados ·
            reconocimiento en el ranking.
          </li>
          <li className="rounded-lg border bg-muted/40 p-2">
            <b>Nivel 5 · [nombre]</b> — sin límite definido · beneficios máximos.
          </li>
        </ul>
        <p>
          Los puntos, niveles y beneficios son personales e intransferibles y{" "}
          <b>no representan un instrumento financiero</b>.
        </p>
      </Seccion>

      <Seccion titulo="5. Cómo se ganan puntos">
        <p className="rounded-lg bg-gold/10 px-2 py-1 text-xs text-gold">
          Borrador — cifras de ejemplo (ficticias), por definir.
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>Pagar tu cuota a tiempo: +1 punto por cada $1.</li>
          <li>Pagar con 5 días o más de anticipación: +2 puntos por cada $1.</li>
          <li>Completar un san sin fallar ninguna cuota: +50 puntos.</li>
          <li>Referir a alguien que participe: +40 puntos (máx. 3).</li>
          <li>Recibir valoraciones positivas de tu grupo: +5 puntos.</li>
          <li>Activar las notificaciones: +40 puntos.</li>
        </ul>
        <p>Los puntos se acreditan entre 1 y 2 días hábiles después de cada acción.</p>
      </Seccion>

      <Seccion titulo="6. Moras, penalizaciones y vigencia">
        <p className="rounded-lg bg-gold/10 px-2 py-1 text-xs text-gold">
          Borrador — cifras de ejemplo (ficticias), por definir.
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>Pago después de la fecha límite: −2 puntos por cada $1.</li>
          <li>
            Mora o cuota vencida: −4 puntos por cada $1, con una prórroga de 7 días
            antes de una penalización mayor.
          </li>
          <li>Tres incumplimientos consecutivos: baja de nivel.</li>
          <li>En mora, se pausan los beneficios hasta regularizar la situación.</li>
        </ul>
        <p>
          <b>Vigencia:</b> los puntos vencen tras 6 meses sin participar ni iniciar
          sesión; el nivel alcanzado se conserva.
        </p>
      </Seccion>

      <Seccion titulo="7. Comisiones y costos">
        <p className="rounded-lg bg-gold/10 px-2 py-1 text-xs text-gold">
          Borrador — modelo de cobro por definir (hoy la app no cobra comisión).
        </p>
        <p>
          El uso de Green Sol podría incluir una comisión de plataforma — por
          ejemplo, un cargo fijo de $0,50 por cuota o un porcentaje del monto del
          san — y, cuando aplique, los impuestos correspondientes. El monto y la
          forma de cobro se mostrarán siempre antes de confirmar cada pago.
        </p>
      </Seccion>

      <Seccion titulo="8. Ahorro en cripto">
        <p>
          Green Sol incorporará el ahorro en criptomonedas (Solana) de forma{" "}
          <b>no custodial</b>: ni la plataforma ni el proveedor tienen acceso a la
          llave que controla los fondos del usuario. [Detalle y alcance — por
          definir al implementar la capa cripto.]
        </p>
      </Seccion>

      <Seccion titulo="9. Conducta y suspensión">
        <p>
          Cualquier conducta fraudulenta, suplantación o incumplimiento reiterado
          podrá implicar la suspensión de la cuenta y la pérdida de los beneficios
          acumulados. [Política de incumplimiento y prórrogas — por definir.]
        </p>
      </Seccion>

      <Seccion titulo="10. Vigencia y aceptación">
        <p>
          Estos términos entran en vigencia desde su publicación y sustituyen
          cualquier versión anterior. Al continuar usando Green Sol, el usuario
          acepta estas condiciones.
        </p>
        <p>[Ciudad, país] · [Fecha de publicación] · Versión [x.x].</p>
      </Seccion>

      <p className="px-1 pb-2 text-center text-xs text-muted-foreground">
        ¿Dudas sobre estos términos? Escríbenos desde el{" "}
        <Link href="/ayuda" className="text-brand">
          Centro de ayuda
        </Link>
        .
      </p>
    </main>
  );
}
