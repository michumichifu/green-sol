"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Eye,
  Pencil,
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Palette,
  Highlighter,
  Link2,
  Image as ImageIcon,
  List,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import {
  guardarPlantilla,
  enviarPruebaPlantilla,
  restablecerPlantilla,
  type EstadoPlantilla,
} from "@/app/admin/actions";
import {
  aplicarVariables,
  clavesPlantilla,
  type CanalPlantilla,
  type EventoNotificacion,
} from "@/lib/correo/catalogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditorPlantillas({
  eventos,
  overrides,
}: {
  eventos: EventoNotificacion[];
  overrides: Record<string, string>;
}) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const [editar, setEditar] = useState(true);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Plantillas de notificaciones</h2>
        <p className="text-xs text-muted-foreground">
          Cada plantilla tiene versión de <strong>aplicación</strong> (texto) y de{" "}
          <strong>correo</strong> (HTML). Toca el ojo para ver o el lápiz para
          editar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {eventos.map((ev, i) => (
          <div key={ev.clave} className="relative rounded-xl border bg-card p-3">
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setAbierto(i);
                  setEditar(false);
                }}
                title="Ver"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Eye className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAbierto(i);
                  setEditar(true);
                }}
                title="Editar"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
            </div>
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {ev.categoria}
            </span>
            <p className="mt-1.5 pr-12 text-sm leading-tight font-medium">
              {ev.nombre}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {ev.descripcion}
            </p>
            <div className="mt-2 flex gap-1">
              {ev.canales.map((c) => (
                <span
                  key={c}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {c === "correo" ? "Correo" : "App"}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {abierto !== null && (
        <ModalPlantilla
          key={eventos[abierto].clave}
          evento={eventos[abierto]}
          overrides={overrides}
          editarInicial={editar}
          onClose={() => setAbierto(null)}
        />
      )}
    </section>
  );
}

/**
 * Botón de color: aplica el color UNA sola vez, cuando el usuario cierra el
 * selector (evento nativo `change`), no mientras lo arrastra (evento `input`).
 */
function BotonColor({
  titulo,
  children,
  onColor,
}: {
  titulo: string;
  children: ReactNode;
  onColor: (color: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const cb = useRef(onColor);
  cb.current = onColor;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = () => cb.current(el.value);
    el.addEventListener("change", h);
    return () => el.removeEventListener("change", h);
  }, []);
  return (
    <label
      title={titulo}
      className="flex cursor-pointer items-center rounded p-1.5 hover:bg-muted"
    >
      {children}
      <input ref={ref} type="color" defaultValue="#0E9F6E" className="sr-only" />
    </label>
  );
}

function ModalPlantilla({
  evento,
  overrides,
  editarInicial,
  onClose,
}: {
  evento: EventoNotificacion;
  overrides: Record<string, string>;
  editarInicial: boolean;
  onClose: () => void;
}) {
  const kCorreo = clavesPlantilla(evento.clave, "correo");
  const kApp = clavesPlantilla(evento.clave, "app");
  const draftKey = (c: CanalPlantilla) => `gs-plantilla-${evento.clave}-${c}`;
  const leerDraft = (
    c: CanalPlantilla,
  ): { asunto?: string; contenido?: string } => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(draftKey(c)) || "{}");
    } catch {
      return {};
    }
  };

  const [canal, setCanal] = useState<CanalPlantilla>(evento.canales[0]);
  const [editar, setEditar] = useState(editarInicial);
  const [correoAsunto, setCorreoAsunto] = useState(
    () => leerDraft("correo").asunto ?? overrides[kCorreo.asunto] ?? evento.correo.asunto,
  );
  const [correoHtml, setCorreoHtml] = useState(
    () => leerDraft("correo").contenido ?? overrides[kCorreo.contenido] ?? evento.correo.html,
  );
  const [appTitulo, setAppTitulo] = useState(
    () => leerDraft("app").asunto ?? overrides[kApp.asunto] ?? evento.app.titulo,
  );
  const [appCuerpo, setAppCuerpo] = useState(
    () => leerDraft("app").contenido ?? overrides[kApp.contenido] ?? evento.app.cuerpo,
  );
  const [destino, setDestino] = useState("");
  const [enviando, setEnviando] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [estado, accion, pendiente] = useActionState<EstadoPlantilla, FormData>(
    guardarPlantilla,
    {},
  );
  const previo = useRef<EstadoPlantilla>(estado);
  useEffect(() => {
    if (estado === previo.current) return;
    previo.current = estado;
    if (estado.ok) {
      toast.success("Plantilla guardada");
      localStorage.removeItem(draftKey(canal));
    } else if (estado.error) {
      toast.error(estado.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Borrador local: persiste lo no guardado para no perderlo al cerrar/recargar.
  useEffect(() => {
    localStorage.setItem(
      draftKey("correo"),
      JSON.stringify({ asunto: correoAsunto, contenido: correoHtml }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correoAsunto, correoHtml]);
  useEffect(() => {
    localStorage.setItem(
      draftKey("app"),
      JSON.stringify({ asunto: appTitulo, contenido: appCuerpo }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appTitulo, appCuerpo]);

  const esCorreo = canal === "correo";
  const asunto = esCorreo ? correoAsunto : appTitulo;
  const setAsunto = esCorreo ? setCorreoAsunto : setAppTitulo;
  const contenido = esCorreo ? correoHtml : appCuerpo;
  const setContenido = esCorreo ? setCorreoHtml : setAppCuerpo;

  // Inserta usando el mecanismo nativo del navegador: registra el historial de
  // deshacer (Ctrl+Z) y dispara el onChange del textarea para sincronizar estado.
  function insertarTexto(texto: string) {
    const ta = taRef.current;
    if (!ta) {
      setContenido(contenido + texto);
      return;
    }
    ta.focus();
    document.execCommand("insertText", false, texto);
  }

  function insertarVar(key: string) {
    insertarTexto(`{{${key}}}`);
  }

  function envolver(antes: string, despues: string) {
    const ta = taRef.current;
    if (!ta) {
      setContenido(contenido + antes + despues);
      return;
    }
    ta.focus();
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    document.execCommand("insertText", false, antes + sel + despues);
  }

  async function onEnviarPrueba() {
    if (!destino.includes("@")) {
      toast.error("Indica un correo válido.");
      return;
    }
    setEnviando(true);
    try {
      const r = await enviarPruebaPlantilla(evento.clave, destino);
      if (r.ok) toast.success(`Prueba enviada a ${destino}`);
      else toast.error(r.error ?? "No se pudo enviar.");
    } finally {
      setEnviando(false);
    }
  }

  async function onRestablecer() {
    const r = await restablecerPlantilla(evento.clave, canal);
    if (r.ok) {
      if (esCorreo) {
        setCorreoAsunto(evento.correo.asunto);
        setCorreoHtml(evento.correo.html);
      } else {
        setAppTitulo(evento.app.titulo);
        setAppCuerpo(evento.app.cuerpo);
      }
      localStorage.removeItem(draftKey(canal));
      toast.success("Restablecida al diseño por defecto");
    } else {
      toast.error(r.error ?? "No se pudo restablecer.");
    }
  }

  const vars = Object.entries(evento.variables);
  const previewCorreo = aplicarVariables(correoHtml, evento.datosMuestra);
  const previewAppTitulo = aplicarVariables(appTitulo, evento.datosMuestra);
  const previewAppCuerpo = aplicarVariables(appCuerpo, evento.datosMuestra);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-sm font-semibold">{evento.nombre}</h3>
            <p className="text-xs text-muted-foreground">{evento.categoria}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {evento.canales.length > 1 && (
          <div className="flex gap-1 border-b px-4">
            {evento.canales.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCanal(c)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium ${canal === c ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {c === "correo" ? "Correo" : "Aplicación"}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <form action={accion} className="space-y-3">
            <input type="hidden" name="clave" value={evento.clave} />
            <input type="hidden" name="canal" value={canal} />
            <input type="hidden" name="asunto" value={asunto} />
            <input type="hidden" name="contenido" value={contenido} />

            <div className="space-y-1">
              <Label htmlFor="m-asunto">{esCorreo ? "Asunto" : "Título"}</Label>
              <Input
                id="m-asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
              />
            </div>

            <div className="flex w-fit gap-1 rounded-lg bg-muted p-1 text-sm">
              <button
                type="button"
                onClick={() => setEditar(true)}
                className={`rounded-md px-3 py-1 font-medium ${editar ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {esCorreo ? "HTML" : "Texto"}
              </button>
              <button
                type="button"
                onClick={() => setEditar(false)}
                className={`rounded-md px-3 py-1 font-medium ${!editar ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                Vista previa
              </button>
            </div>

            {editar && (
              <div className="flex flex-wrap items-center gap-0.5 rounded-lg border bg-muted/40 p-1">
                <button
                  type="button"
                  title="Negrita"
                  onClick={() => envolver("<strong>", "</strong>")}
                  className="rounded p-1.5 hover:bg-muted"
                >
                  <Bold className="size-4" />
                </button>
                <button
                  type="button"
                  title="Cursiva"
                  onClick={() => envolver("<em>", "</em>")}
                  className="rounded p-1.5 hover:bg-muted"
                >
                  <Italic className="size-4" />
                </button>
                <button
                  type="button"
                  title="Subrayado"
                  onClick={() => envolver("<u>", "</u>")}
                  className="rounded p-1.5 hover:bg-muted"
                >
                  <Underline className="size-4" />
                </button>
                <button
                  type="button"
                  title="Tachado"
                  onClick={() => envolver("<s>", "</s>")}
                  className="rounded p-1.5 hover:bg-muted"
                >
                  <Strikethrough className="size-4" />
                </button>
                <BotonColor
                  titulo="Color del texto"
                  onColor={(c) =>
                    envolver(`<span style="color:${c};">`, "</span>")
                  }
                >
                  <Palette className="size-4" />
                </BotonColor>
                <BotonColor
                  titulo="Resaltar (fondo)"
                  onColor={(c) =>
                    envolver(
                      `<span style="background:${c};padding:0 3px;border-radius:3px;">`,
                      "</span>",
                    )
                  }
                >
                  <Highlighter className="size-4" />
                </BotonColor>
                {esCorreo && (
                  <>
                    <span className="mx-0.5 h-5 w-px bg-border" />
                    <button
                      type="button"
                      title="Enlace"
                      onClick={() => {
                        const u = window.prompt("URL del enlace:");
                        if (u)
                          envolver(
                            `<a href="${u}" style="color:#0E9F6E;">`,
                            "</a>",
                          );
                      }}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <Link2 className="size-4" />
                    </button>
                    <button
                      type="button"
                      title="Imagen (URL)"
                      onClick={() => {
                        const u = window.prompt("URL de la imagen:");
                        if (u)
                          insertarTexto(
                            `<img src="${u}" alt="" style="max-width:100%;border-radius:8px;" />`,
                          );
                      }}
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <ImageIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      title="Lista"
                      onClick={() =>
                        insertarTexto(
                          '<ul style="margin:8px 0;padding-left:20px;"><li>Elemento</li></ul>',
                        )
                      }
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <List className="size-4" />
                    </button>
                    <button
                      type="button"
                      title="Línea divisoria"
                      onClick={() =>
                        insertarTexto(
                          '<hr style="border:none;border-top:1px solid #E8EFEB;margin:16px 0;" />',
                        )
                      }
                      className="rounded p-1.5 hover:bg-muted"
                    >
                      <Minus className="size-4" />
                    </button>
                  </>
                )}
              </div>
            )}
            {editar ? (
              <textarea
                ref={taRef}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                spellCheck={false}
                className={`w-full rounded-lg border bg-background p-3 ${esCorreo ? "h-72 font-mono text-xs" : "h-28 text-sm"}`}
              />
            ) : esCorreo ? (
              <iframe
                title="Vista previa"
                sandbox=""
                srcDoc={previewCorreo}
                className="h-72 w-full rounded-lg border bg-white"
              />
            ) : (
              <div className="rounded-xl border bg-background p-3">
                <p
                  className="text-sm font-medium"
                  dangerouslySetInnerHTML={{ __html: previewAppTitulo }}
                />
                <div
                  className="mt-0.5 text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: previewAppCuerpo }}
                />
              </div>
            )}

            {vars.length > 0 && (
              <div className="space-y-1">
                <Label>Variables (clic para insertar)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {vars.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => insertarVar(key)}
                      title={label}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                    >
                      <code className="text-brand">{`{{${key}}}`}</code>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={pendiente}
                className="bg-brand text-white hover:bg-brand/90"
              >
                {pendiente ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="outline" onClick={onRestablecer}>
                Restablecer
              </Button>
            </div>
          </form>

          {esCorreo && (
            <div className="mt-4 border-t pt-3">
              <Label htmlFor="m-destino">Enviar prueba (correo) a</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="m-destino"
                  type="email"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="tu@correo.com"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={enviando}
                  onClick={onEnviarPrueba}
                >
                  {enviando ? "Enviando..." : "Enviar prueba"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
