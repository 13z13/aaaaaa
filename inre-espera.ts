/*
 * Pantalla de espera de la experiencia. Archivo generado por INRE; se reescribe en
 * cada publicación, así que los cambios que se hagan aquí se pierden.
 *
 * No toca la escena ni los marcadores: solo enseña y esconde una capa encima del
 * lienzo. Si algo falla dentro, se retira sola para no dejar la pantalla tapada.
 */

const MARCADORES = ["386305641_724387343042558_3038697715686362368_n","cube2"]

/**
 * Cuenta las descargas en curso de archivos del proyecto (assets/ o blobs) para
 * saber si todavía hay modelos, vídeos o texturas pesados bajando en segundo plano.
 */
let descargasActivas = 0
const oyentesDescarga = new Set<() => void>()
const notificarDescargas = () => {
  for (const fn of oyentesDescarga) {
    fn()
  }
}

if (typeof window.fetch === 'function') {
  const fetchOriginal = window.fetch.bind(window)
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url
    const esAsset = url.indexOf('assets/') !== -1
    if (!esAsset) {
      return fetchOriginal(input, init)
    }
    descargasActivas += 1
    notificarDescargas()
    return fetchOriginal(input, init).finally(() => {
      descargasActivas = Math.max(0, descargasActivas - 1)
      notificarDescargas()
    })
  }
}

/** El motor, tal como lo ve este archivo. */
interface Motor {
  addCameraPipelineModule: (module: Record<string, unknown>) => void
}

/** Crea la capa una sola vez (o reutiliza la del arranque inicial en index.html). */
const crearCapa = (): {raiz: HTMLElement, titulo: HTMLElement, pista: HTMLElement} => {
  const existente = document.getElementById('inre-espera')
  const estilos = `
      #inre-espera {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        padding: 32px 24px;
        box-sizing: border-box;
        overflow-y: auto;
        background: #06060a;
        color: #f2f4f8;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        text-align: center;
        transition: opacity 420ms ease, visibility 420ms ease, background 300ms ease;
      }
      /*
       * Modo flotante (sin fondo): cuando la cámara ya está abierta y se está
       * cargando o esperando un marcador, la cámara debe verse detrás.
       */
      #inre-espera.inre-flotante {
        inset: auto 0 28px 0;
        background: transparent;
        pointer-events: none;
        padding: 0 16px;
        gap: 10px;
        overflow: visible;
      }
      #inre-espera.inre-flotante .inre-indicador {
        margin: 0;
        transform: scale(0.42);
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #inre-espera.inre-flotante .inre-titulo {
        font-size: 13px;
        text-shadow: 0 1px 6px rgba(0, 0, 0, 0.85);
      }
      #inre-espera.inre-flotante .inre-pista {
        font-size: 12px;
        color: rgba(242, 244, 248, 0.88);
        text-shadow: 0 1px 6px rgba(0, 0, 0, 0.85);
      }
      @media (max-height: 360px) {
        #inre-espera:not(.inre-flotante) { gap: 8px; padding: 12px 16px; }
        #inre-espera:not(.inre-flotante) .inre-indicador { margin: 8px 0 10px; transform: scale(.72); }
      }
      #inre-espera.inre-fuera { opacity: 0; visibility: hidden; pointer-events: none; }
      /*
       * El mismo cubo ortográfico del arranque (apps/editor/index.html).
       * Sus seis caras necesitan preserve-3d: poner filtros o animar la opacidad
       * del propio cubo aplana el volumen. La salida se anima en su envoltorio.
       */
      #inre-espera .inre-indicador { margin: 24px 0 30px; }
      #inre-espera .inre-cubo {
        position: relative;
        width: 70.4px;
        height: 70.4px;
        --clr: #a78bfa;
        --clr-alpha: rgba(124, 92, 255, .1);
        transform-style: preserve-3d;
        animation: inre-cubo 1.6s infinite ease;
      }
      #inre-espera .inre-cubo > div {
        position: absolute;
        width: 100%;
        height: 100%;
        background: var(--clr-alpha);
        border: 3.5px solid var(--clr);
      }
      #inre-espera .inre-cubo > div:nth-child(1) {
        transform: translateZ(-35.2px) rotateY(180deg);
      }
      #inre-espera .inre-cubo > div:nth-child(2) {
        transform: rotateY(-270deg) translateX(50%);
        transform-origin: top right;
      }
      #inre-espera .inre-cubo > div:nth-child(3) {
        transform: rotateY(270deg) translateX(-50%);
        transform-origin: center left;
      }
      #inre-espera .inre-cubo > div:nth-child(4) {
        transform: rotateX(90deg) translateY(-50%);
        transform-origin: top center;
      }
      #inre-espera .inre-cubo > div:nth-child(5) {
        transform: rotateX(-90deg) translateY(50%);
        transform-origin: bottom center;
      }
      #inre-espera .inre-cubo > div:nth-child(6) { transform: translateZ(35.2px); }
      @keyframes inre-cubo {
        0% { transform: rotate(45deg) rotateX(-25deg) rotateY(25deg); }
        50% { transform: rotate(45deg) rotateX(-385deg) rotateY(25deg); }
        100% { transform: rotate(45deg) rotateX(-385deg) rotateY(385deg); }
      }
      /* Más lento al escanear: conserva tu señal de actividad mientras se apunta. */
      #inre-espera.inre-quieto .inre-cubo { animation-duration: 3.4s; }
      #inre-espera.inre-fuera .inre-indicador {
        animation: inre-cerrar 380ms ease forwards;
      }
      @keyframes inre-cerrar {
        0% { transform: scale(1); }
        60% { transform: scale(1.15); }
        100% { transform: scale(.4); }
      }
      /* Un error no debe parecer trabajo en curso ni depender de la animación. */
      #inre-espera.inre-error .inre-cubo {
        animation-play-state: paused;
        --clr: #f0b4b1;
      }
      @media (prefers-reduced-motion: reduce) {
        #inre-espera .inre-cubo {
          animation: none;
          transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
        }
        #inre-espera.inre-fuera .inre-indicador { animation: none; }
        #inre-espera, #inre-espera .inre-aviso { transition: none; }
      }
      #inre-espera .inre-titulo { font-size: 17px; font-weight: 600; margin: 0; }
      #inre-espera .inre-pista {
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
        max-width: 34ch;
        color: rgba(242, 244, 248, 0.72);
      }
      #inre-espera .inre-aviso {
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transition: max-height 260ms ease, opacity 260ms ease;
        font-size: 13px;
        line-height: 1.55;
        max-width: 36ch;
        padding: 0 14px;
        border-radius: 10px;
        background: rgba(224, 134, 130, 0.14);
        border: 1px solid rgba(224, 134, 130, 0.34);
        color: #f0b4b1;
      }
      #inre-espera.inre-error .inre-aviso { max-height: 240px; opacity: 1; padding: 12px 14px; }
  `

  if (existente !== null) {
    const style = document.createElement('style')
    style.textContent = estilos
    document.head.appendChild(style)
    return {
      raiz: existente,
      titulo: existente.querySelector('.inre-titulo') as HTMLElement,
      pista: existente.querySelector('.inre-pista') as HTMLElement,
    }
  }

  const raiz = document.createElement('div')
  raiz.id = 'inre-espera'
  raiz.setAttribute('role', 'status')
  raiz.setAttribute('aria-live', 'polite')
  raiz.innerHTML = `
    <style>${estilos}</style>
    <div class="inre-indicador" aria-hidden="true">
      <div class="inre-cubo">
        <div></div><div></div><div></div><div></div><div></div><div></div>
      </div>
    </div>
    <p class="inre-titulo">Preparando la experiencia…</p>
    <p class="inre-pista">Buscando la cámara.</p>
    <p class="inre-aviso"></p>
  `
  document.body.appendChild(raiz)

  return {
    raiz,
    titulo: raiz.querySelector('.inre-titulo') as HTMLElement,
    pista: raiz.querySelector('.inre-pista') as HTMLElement,
  }
}

const montar = () => {
  let capa: ReturnType<typeof crearCapa> | null = null
  let errorAparecido = false
  let retirada = false
  let escaneando = false
  let marcadorEncontrado = false

  const arrancar = () => {
    if (capa === null) {
      capa = crearCapa()
    }
    return capa
  }

  /** Retira la capa con su transición y la quita del árbol al terminar. */
  const retirar = () => {
    if (retirada || capa === null) {
      return
    }
    retirada = true
    capa.raiz.classList.add('inre-fuera')
    window.setTimeout(() => capa?.raiz.remove(), 460)
  }

  /** Cambia los textos sin tocar el resto. */
  const escribir = (titulo: string, pista: string, quieto: boolean) => {
    const actual = arrancar()
    actual.titulo.textContent = titulo
    actual.pista.textContent = pista
    actual.raiz.classList.toggle('inre-quieto', quieto)
    // Un aviso de error ya visible no se tapa con el texto de progreso: es lo único
    // que explica por qué la experiencia no avanza.
    if (!errorAparecido) {
      actual.raiz.classList.remove('inre-error')
    }
  }

  /** Pasa al cubo pequeño sin fondo sobre la cámara cuando ya se puede apuntar. */
  const pasarAFlotante = () => {
    if (errorAparecido || retirada) {
      return
    }
    const actual = arrancar()
    actual.raiz.classList.add('inre-flotante')
  }

  const actualizarTextoFlotante = () => {
    if (retirada || errorAparecido) {
      return
    }
    if (marcadorEncontrado) {
      if (descargasActivas === 0) {
        escribir('Marcador reconocido', 'Mostrando el contenido.', false)
        retirar()
      } else {
        pasarAFlotante()
        escribir(
          'Cargando marcador…',
          `Descargando contenido (${descargasActivas} pendiente${descargasActivas === 1 ? '' : 's'}).`,
          false
        )
      }
      return
    }
    if (!escaneando) {
      return
    }
    pasarAFlotante()
    if (descargasActivas > 0) {
      escribir(
        'Cargando marcador…',
        `Descargando archivos (${descargasActivas} en curso). Apunta al marcador.`,
        false
      )
    } else {
      escribir(
        'Apunta al marcador',
        MARCADORES.length > 0
          ? 'Enfoca la imagen completa, de frente y con buena luz.'
          : 'Ya puedes mirar alrededor.',
        true
      )
    }
  }

  oyentesDescarga.add(actualizarTextoFlotante)

  const avisar = (texto: string) => {
    const actual = arrancar()
    errorAparecido = true
    ;(actual.raiz.querySelector('.inre-aviso') as HTMLElement).textContent = texto
    actual.raiz.classList.remove('inre-flotante')
    actual.raiz.classList.add('inre-error')
    actual.raiz.classList.remove('inre-quieto')
  }

  const motor = (window as unknown as {XR8?: Motor}).XR8

  if (motor === undefined || typeof motor.addCameraPipelineModule !== 'function') {
    // Sin motor no hay nada que esperar; mejor no tapar la pantalla.
    return
  }

  arrancar()

  try {
    motor.addCameraPipelineModule({
      name: 'inre-espera',

      listeners: [
        {
          event: 'reality.imageloading',
          process: () => {
            if (!escaneando) {
              escribir(
                'Preparando la experiencia…',
                MARCADORES.length > 0
                  ? 'Analizando la imagen del marcador.'
                  : 'Preparando el contenido.',
                false
              )
            }
          },
        },
        {
          event: 'reality.imagescanning',
          process: () => {
            escaneando = true
            actualizarTextoFlotante()
          },
        },
        {
          event: 'reality.imagefound',
          process: () => {
            marcadorEncontrado = true
            actualizarTextoFlotante()
          },
        },
        {
          event: 'reality.imageupdated',
          process: () => {
            marcadorEncontrado = true
            if (descargasActivas === 0) {
              retirar()
            }
          },
        },
      ],

      onCameraStatusChange: (evento: {status?: string, reason?: string}) => {
        const estado = evento.status

        if (estado === 'requesting') {
          escribir('Preparando la experiencia…', 'Pidiendo permiso para la cámara.', false)
          return
        }

        if (estado === 'hasStream' || estado === 'hasVideo') {
          escribir(
            'Preparando la experiencia…',
            MARCADORES.length > 0
              ? 'Cargando el marcador.'
              : 'Cargando el contenido.',
            false
          )
          return
        }

        /*
         * Los dos fallos que hay que contar, y que el motor calla:
         *
         *   failed        → el navegador no dio cámara. Sin cámara no hay marcador.
         *   hasDesktop3D  → el motor arrancó sin cámara, en su vista 3D. La escena se
         *                   ve, pero el reconocimiento de imágenes es imposible.
         *
         * En el segundo caso la capa NO se retira: dejarla puesta con el aviso es mejor
         * que enseñar una escena que parece funcionar y no reconoce nada.
         */
        if (estado === 'failed') {
          const sinHttps = !window.isSecureContext
          const sinApi = typeof navigator.mediaDevices?.getUserMedia !== 'function'
          avisar(
            sinHttps
              ? 'La cámara requiere HTTPS. Abre la experiencia con una URL https://.'
              : sinApi
                ? 'Este navegador o visor interno no permite usar la cámara. Abre el enlace directamente en Safari o Chrome.'
                : 'No se pudo abrir la cámara'
                  + (evento.reason !== undefined ? ` (${evento.reason})` : '')
                  + '. Si estás en el móvil, ábrelo en Safari/Chrome (no desde el lector de QR) y revisa los permisos de cámara.'
          )
          return
        }

        if (estado === 'hasDesktop3D') {
          avisar(
            'Este dispositivo no está abriendo la cámara, así que no se puede '
            + 'reconocer el marcador. Abre la experiencia en un móvil.'
          )
        }
      },
    })
  } catch {
    // Si el motor rechaza el módulo, la capa se retira: es peor tapar la experiencia
    // con una pantalla de espera eterna que quedarse sin ella.
    retirar()
  }

  /*
   * Red de seguridad: sin marcadores la capa se retira sola en cuanto el contenido
   * está montado, y si por lo que sea ningún evento llega nunca, también. Un usuario
   * mirando una pantalla de carga para siempre es el peor final posible.
   */
  const sinMarcadores = MARCADORES.length === 0
  window.setTimeout(() => {
    if (!errorAparecido) {
      retirar()
    }
  }, sinMarcadores ? 1800 : 30000)
}

/*
 * Se engancha en cuanto el motor existe. Se comprueba antes por si llegó primero: ese
 * evento no se vuelve a lanzar, y esperarlo dejaría la capa sin montar para siempre.
 */
if ((window as unknown as {XR8?: Motor}).XR8 !== undefined) {
  montar()
} else {
  window.addEventListener('xrloaded', montar)
}
