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

      <Seccion titulo="4. Reputación, puntos y niveles">
        <p>
          Green Sol reconoce el comportamiento responsable y constante con un
          sistema de puntos y niveles:{" "}
          <b>Nuevo → Confiable → Destacado → Estrella → Leyenda</b>.
        </p>
        <p>
          Se ganan puntos cumpliendo los pagos a tiempo y recibiendo valoraciones
          positivas del grupo; próximamente también por referidos.
          [Mecánicas exactas de puntos, penalizaciones por incumplimiento y
          vigencia — por definir.]
        </p>
        <p>
          Los puntos, niveles y beneficios son personales e intransferibles y{" "}
          <b>no representan un instrumento financiero</b>.
        </p>
      </Seccion>

      <Seccion titulo="5. Ahorro en cripto">
        <p>
          Green Sol incorporará el ahorro en criptomonedas (Solana) de forma{" "}
          <b>no custodial</b>: ni la plataforma ni el proveedor tienen acceso a la
          llave que controla los fondos del usuario. [Detalle y alcance — por
          definir al implementar la capa cripto.]
        </p>
      </Seccion>

      <Seccion titulo="6. Conducta y suspensión">
        <p>
          Cualquier conducta fraudulenta, suplantación o incumplimiento reiterado
          podrá implicar la suspensión de la cuenta y la pérdida de los beneficios
          acumulados. [Política de incumplimiento y prórrogas — por definir.]
        </p>
      </Seccion>

      <Seccion titulo="7. Vigencia y aceptación">
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
