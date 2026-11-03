"use strict";

/* =========================================================
   NAVEGACIÓN
========================================================= */

function irASeccion(id) {

    const seccion =
        document.getElementById(id);

    if (seccion) {
        seccion.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

}

/* =========================================================
   DATOS
========================================================= */

const CLAVE =
    "ecovoz_prototipo_final_v5";

let datos = {
    reportes: [],
    soluciones: [],
    siguienteReporte: 1,
    siguienteSolucion: 1
};

/* =========================================================
   RECUPERAR DATOS
========================================================= */

try {

    const guardado =
        localStorage.getItem(CLAVE);

    if (guardado) {

        const recuperado =
            JSON.parse(guardado);

        datos.reportes =
            Array.isArray(recuperado.reportes)
            ? recuperado.reportes
            : [];

        datos.soluciones =
            Array.isArray(recuperado.soluciones)
            ? recuperado.soluciones
            : [];

        datos.siguienteReporte =
            Number(recuperado.siguienteReporte)
            || datos.reportes.length + 1;

        datos.siguienteSolucion =
            Number(recuperado.siguienteSolucion)
            || datos.soluciones.length + 1;
    }

} catch (error) {

    console.error(
        "Error recuperando datos:",
        error
    );

}

/* NORMALIZAR */

datos.reportes.forEach(reporte => {

    if (!Array.isArray(reporte.comentarios)) {
        reporte.comentarios = [];
    }

    if (!reporte.estado) {
        reporte.estado = "Pendiente";
    }

});

datos.soluciones.forEach(solucion => {

    if (typeof solucion.votos !== "number") {
        solucion.votos = 0;
    }

});

/* =========================================================
   GUARDAR
========================================================= */

function guardarDatos() {

    try {

        localStorage.setItem(
            CLAVE,
            JSON.stringify(datos)
        );

        return true;

    } catch (error) {

        console.error(
            "Error guardando datos:",
            error
        );

        return false;
    }

}

/* =========================================================
   AUXILIARES
========================================================= */

function crearElemento(
    etiqueta,
    clase = "",
    texto = ""
) {

    const elemento =
        document.createElement(etiqueta);

    if (clase) {
        elemento.className = clase;
    }

    if (texto !== "") {
        elemento.textContent = texto;
    }

    return elemento;
}

function mostrarMensaje(
    id,
    texto,
    error = false
) {

    const elemento =
        document.getElementById(id);

    elemento.textContent = texto;

    elemento.className =
        error
        ? "mensaje visible error"
        : "mensaje visible";
}

function fechaActual() {

    return new Date().toLocaleDateString(
        "es-PE",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}

function claseEstado(estado) {

    if (estado === "Pendiente") {
        return "etiqueta estado-pendiente";
    }

    if (estado === "En proceso") {
        return "etiqueta estado-proceso";
    }

    return "etiqueta estado-resuelto";
}

/* =========================================================
   CONVERTIR ARCHIVO A BASE64
========================================================= */

function convertirArchivoBase64(archivo) {

    return new Promise(
        function(resolve, reject) {

            const lector =
                new FileReader();

            lector.onload =
                function() {
                    resolve(lector.result);
                };

            lector.onerror =
                function() {
                    reject(
                        new Error(
                            "No se pudo leer el archivo."
                        )
                    );
                };

            lector.readAsDataURL(archivo);

        }
    );

}

/* =========================================================
   VISTA PREVIA FOTO / VIDEO
========================================================= */

const evidenciaInput =
    document.getElementById(
        "evidenciaReporte"
    );

const vistaPrevia =
    document.getElementById(
        "vistaPreviaEvidencia"
    );

evidenciaInput.addEventListener(
    "change",
    function() {

        vistaPrevia.replaceChildren();

        const archivo =
            this.files &&
            this.files.length > 0
            ? this.files[0]
            : null;

        if (!archivo) {
            return;
        }

        /* VALIDAR TIPO */

        if (
            !archivo.type.startsWith("image/") &&
            !archivo.type.startsWith("video/")
        ) {

            mostrarMensaje(
                "mensajeReporte",
                "Solo puedes adjuntar una fotografía o un video.",
                true
            );

            this.value = "";

            return;
        }

        /* VALIDAR TAMAÑO */

        const MAXIMO =
            1024 * 1024;

        if (archivo.size > MAXIMO) {

            mostrarMensaje(
                "mensajeReporte",
                "El archivo supera 1 MB. Selecciona una foto o video más pequeño.",
                true
            );

            this.value = "";

            return;
        }

        const url =
            URL.createObjectURL(archivo);

        if (
            archivo.type.startsWith("image/")
        ) {

            const imagen =
                document.createElement("img");

            imagen.src = url;

            imagen.className =
                "vista-evidencia";

            imagen.alt =
                "Vista previa de la evidencia";

            imagen.onload =
                function() {
                    URL.revokeObjectURL(url);
                };

            vistaPrevia.appendChild(
                imagen
            );

        } else {

            const video =
                document.createElement("video");

            video.src = url;

            video.controls = true;

            video.className =
                "vista-evidencia";

            video.onloadeddata =
                function() {
                    URL.revokeObjectURL(url);
                };

            vistaPrevia.appendChild(
                video
            );

        }

    }
);

/* =========================================================
   ENVIAR REPORTE
========================================================= */

document
.getElementById("formReporte")
.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const boton =
            document.getElementById(
                "botonEnviarReporte"
            );

        boton.disabled = true;

        boton.textContent =
            "Enviando...";

        try {

            const titulo =
                document
                .getElementById("tituloReporte")
                .value
                .trim();

            const categoria =
                document
                .getElementById("categoriaReporte")
                .value;

            const zona =
                document
                .getElementById("zonaReporte")
                .value
                .trim();

            const descripcion =
                document
                .getElementById("descripcionReporte")
                .value
                .trim();

            const nombre =
                document
                .getElementById("nombreReporte")
                .value
                .trim();

            if (
                !titulo ||
                !categoria ||
                !zona ||
                !descripcion
            ) {

                mostrarMensaje(
                    "mensajeReporte",
                    "Completa todos los campos obligatorios.",
                    true
                );

                return;
            }

            /* =========================
               ARCHIVO
            ========================= */

            const inputArchivo =
                document.getElementById(
                    "evidenciaReporte"
                );

            const archivo =
                inputArchivo.files &&
                inputArchivo.files.length > 0
                ? inputArchivo.files[0]
                : null;

            let evidencia = null;
            let tipoEvidencia = "";

            if (archivo) {

                const MAXIMO =
                    1024 * 1024;

                if (archivo.size > MAXIMO) {

                    mostrarMensaje(
                        "mensajeReporte",
                        "El archivo supera el límite de 1 MB.",
                        true
                    );

                    return;
                }

                if (
                    !archivo.type.startsWith("image/") &&
                    !archivo.type.startsWith("video/")
                ) {

                    mostrarMensaje(
                        "mensajeReporte",
                        "El archivo debe ser una fotografía o un video.",
                        true
                    );

                    return;
                }

                evidencia =
                    await convertirArchivoBase64(
                        archivo
                    );

                tipoEvidencia =
                    archivo.type;
            }

            /* =========================
               CREAR REPORTE
            ========================= */

            const reporte = {

                codigo:
                    "EV-" +
                    String(
                        datos.siguienteReporte
                    ).padStart(4, "0"),

                titulo:
                    titulo,

                categoria:
                    categoria,

                zona:
                    zona,

                descripcion:
                    descripcion,

                nombre:
                    nombre || "Anónimo",

                estado:
                    "Pendiente",

                comentarios:
                    [],

                evidencia:
                    evidencia,

                tipoEvidencia:
                    tipoEvidencia,

                fecha:
                    fechaActual()

            };

            /* =========================
               GUARDAR REPORTE
            ========================= */

            datos.reportes.unshift(
                reporte
            );

            datos.siguienteReporte++;

            let guardado =
                guardarDatos();

            /*
            Si localStorage está lleno por la foto/video,
            se vuelve a intentar sin el archivo.
            */

            if (!guardado && evidencia) {

                reporte.evidencia = null;

                reporte.tipoEvidencia = "";

                guardado =
                    guardarDatos();

                if (guardado) {

                    mostrarMensaje(
                        "mensajeReporte",
                        "✅ Reporte enviado con código " +
                        reporte.codigo +
                        ". El archivo multimedia era demasiado pesado para guardarse, pero el reporte sí fue registrado."
                    );

                }

            }

            if (!guardado) {

                /*
                Revertimos el registro si ni siquiera
                se puede guardar sin evidencia.
                */

                datos.reportes.shift();

                datos.siguienteReporte--;

                mostrarMensaje(
                    "mensajeReporte",
                    "No se pudo guardar el reporte. El almacenamiento del navegador puede estar lleno.",
                    true
                );

                return;
            }

            /* =========================
               LIMPIAR
            ========================= */

            this.reset();

            vistaPrevia.replaceChildren();

            renderizarTodo();

            if (
                !document
                .getElementById("mensajeReporte")
                .textContent
                .includes("archivo multimedia")
            ) {

                mostrarMensaje(
                    "mensajeReporte",
                    "✅ ¡Reporte enviado correctamente! Código: " +
                    reporte.codigo
                );

            }

            /* IR A REPORTES */

            setTimeout(
                function() {

                    document
                    .getElementById("reportes")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

                },
                500
            );

        } catch (error) {

            console.error(error);

            mostrarMensaje(
                "mensajeReporte",
                "Ocurrió un error al enviar el reporte. Inténtalo nuevamente.",
                true
            );

        } finally {

            boton.disabled = false;

            boton.textContent =
                "Enviar reporte";

        }

    }
);

/* =========================================================
   BÚSQUEDA Y FILTRO
========================================================= */

document
.getElementById("buscarReporte")
.addEventListener(
    "input",
    renderizarReportes
);

document
.getElementById("filtroEstado")
.addEventListener(
    "change",
    renderizarReportes
);

/* =========================================================
   ESTADÍSTICAS
========================================================= */

function actualizarEstadisticas() {

    const pendientes =
        datos.reportes.filter(
            reporte =>
                reporte.estado !==
                "Resuelto"
        ).length;

    const votos =
        datos.soluciones.reduce(
            function(total, solucion) {

                return total +
                    (solucion.votos || 0);

            },
            0
        );

    document
    .getElementById("totalReportes")
    .textContent =
        datos.reportes.length;

    document
    .getElementById("totalPendientes")
    .textContent =
        pendientes;

    document
    .getElementById("totalSoluciones")
    .textContent =
        datos.soluciones.length;

    document
    .getElementById("totalVotos")
    .textContent =
        votos;

}

/* =========================================================
   MOSTRAR REPORTES
========================================================= */

function renderizarReportes() {

    const lista =
        document.getElementById(
            "listaReportes"
        );

    lista.replaceChildren();

    const busqueda =
        document
        .getElementById("buscarReporte")
        .value
        .trim()
        .toLowerCase();

    const filtro =
        document
        .getElementById("filtroEstado")
        .value;

    const encontrados =
        datos.reportes.filter(
            function(reporte) {

                const texto = [
                    reporte.titulo,
                    reporte.categoria,
                    reporte.zona,
                    reporte.descripcion,
                    reporte.codigo
                ]
                .join(" ")
                .toLowerCase();

                const coincideTexto =
                    texto.includes(busqueda);

                const coincideEstado =
                    filtro === "Todos" ||
                    reporte.estado === filtro;

                return (
                    coincideTexto &&
                    coincideEstado
                );
            }
        );

    if (encontrados.length === 0) {

        lista.appendChild(

            crearElemento(
                "div",
                "vacio",
                datos.reportes.length === 0
                ? "Todavía no hay reportes registrados."
                : "No se encontraron reportes."
            )

        );

        return;
    }

    encontrados.forEach(
        function(reporte) {

            const tarjeta =
                crearElemento(
                    "article",
                    "tarjeta"
                );

            /* TÍTULO */

            tarjeta.appendChild(

                crearElemento(
                    "h3",
                    "",
                    reporte.titulo
                )

            );

            /* ETIQUETAS */

            const etiquetas =
                crearElemento("div");

            etiquetas.appendChild(

                crearElemento(
                    "span",
                    "etiqueta",
                    reporte.categoria
                )

            );

            etiquetas.appendChild(

                crearElemento(
                    "span",
                    claseEstado(
                        reporte.estado
                    ),
                    reporte.estado
                )

            );

            tarjeta.appendChild(
                etiquetas
            );

            /* DESCRIPCIÓN */

            tarjeta.appendChild(

                crearElemento(
                    "p",
                    "",
                    reporte.descripcion
                )

            );

            /* EVIDENCIA */

            if (reporte.evidencia) {

                const contenedor =
                    crearElemento(
                        "div",
                        "evidencia-reporte"
                    );

                contenedor.appendChild(

                    crearElemento(
                        "h4",
                        "",
                        "📷 Evidencia del problema"
                    )

                );

                if (
                    reporte.tipoEvidencia &&
                    reporte.tipoEvidencia
                    .startsWith("video/")
                ) {

                    const video =
                        document.createElement(
                            "video"
                        );

                    video.src =
                        reporte.evidencia;

                    video.controls = true;

                    contenedor.appendChild(
                        video
                    );

                } else {

                    const imagen =
                        document.createElement(
                            "img"
                        );

                    imagen.src =
                        reporte.evidencia;

                    imagen.alt =
                        "Evidencia del problema ambiental";

                    contenedor.appendChild(
                        imagen
                    );

                }

                tarjeta.appendChild(
                    contenedor
                );

            }

            /* INFORMACIÓN */

            tarjeta.appendChild(

                crearElemento(
                    "div",
                    "detalles",

                    "Código: " +
                    reporte.codigo +

                    " · Zona: " +
                    reporte.zona +

                    " · Fecha: " +
                    reporte.fecha +

                    " · Registrado por: " +
                    reporte.nombre
                )

            );

            /* ACCIONES */

            const acciones =
                crearElemento(
                    "div",
                    "acciones"
                );

            /* ESTADO */

            const selector =
                document.createElement(
                    "select"
                );

            [
                "Pendiente",
                "En proceso",
                "Resuelto"
            ].forEach(
                function(estado) {

                    const opcion =
                        document.createElement(
                            "option"
                        );

                    opcion.value =
                        estado;

                    opcion.textContent =
                        estado;

                    opcion.selected =
                        estado ===
                        reporte.estado;

                    selector.appendChild(
                        opcion
                    );

                }
            );

            selector.addEventListener(
                "change",
                function() {

                    reporte.estado =
                        this.value;

                    guardarDatos();

                    renderizarTodo();

                }
            );

            acciones.appendChild(
                selector
            );

            /* COMENTAR */

            const botonComentario =
                crearElemento(
                    "button",
                    "boton boton-secundario",
                    "💬 Comentar"
                );

            botonComentario.type =
                "button";

            botonComentario.addEventListener(
                "click",
                function() {

                    const comentario =
                        prompt(
                            "Escribe tu comentario u opinión:"
                        );

                    if (
                        comentario &&
                        comentario.trim()
                    ) {

                        reporte.comentarios.push(
                            comentario.trim()
                        );

                        guardarDatos();

                        renderizarTodo();

                    }

                }
            );

            acciones.appendChild(
                botonComentario
            );

            tarjeta.appendChild(
                acciones
            );

            /* COMENTARIOS */

            if (
                reporte.comentarios &&
                reporte.comentarios.length > 0
            ) {

                const comentarios =
                    crearElemento(
                        "div",
                        "comentarios"
                    );

                comentarios.appendChild(

                    crearElemento(
                        "h4",
                        "",
                        "💬 Comentarios"
                    )

                );

                reporte.comentarios.forEach(
                    function(comentario) {

                        comentarios.appendChild(

                            crearElemento(
                                "div",
                                "comentario",
                                comentario
                            )

                        );

                    }
                );

                tarjeta.appendChild(
                    comentarios
                );

            }

            lista.appendChild(
                tarjeta
            );

        }
    );

}

/* =========================================================
   PUBLICAR SOLUCIÓN
========================================================= */

document
.getElementById("formSolucion")
.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const titulo =
            document
            .getElementById("tituloSolucion")
            .value
            .trim();

        const zona =
            document
            .getElementById("zonaSolucion")
            .value
            .trim();

        const autor =
            document
            .getElementById("autorSolucion")
            .value
            .trim();

        const descripcion =
            document
            .getElementById("descripcionSolucion")
            .value
            .trim();

        if (
            !titulo ||
            !zona ||
            !descripcion
        ) {

            mostrarMensaje(
                "mensajeSolucion",
                "Completa todos los campos obligatorios.",
                true
            );

            return;
        }

        const solucion = {

            codigo:
                "EV-S" +
                String(
                    datos.siguienteSolucion
                ).padStart(4, "0"),

            titulo:
                titulo,

            zona:
                zona,

            nombre:
                autor || "Anónimo",

            descripcion:
                descripcion,

            votos:
                0,

            fecha:
                fechaActual()

        };

        datos.soluciones.unshift(
            solucion
        );

        datos.siguienteSolucion++;

        if (!guardarDatos()) {

            datos.soluciones.shift();

            datos.siguienteSolucion--;

            mostrarMensaje(
                "mensajeSolucion",
                "No se pudo guardar la propuesta.",
                true
            );

            return;
        }

        this.reset();

        renderizarTodo();

        mostrarMensaje(
            "mensajeSolucion",
            "✅ Propuesta publicada correctamente. Código: " +
            solucion.codigo
        );

    }
);

/* =========================================================
   MOSTRAR SOLUCIONES
========================================================= */

function renderizarSoluciones() {

    const lista =
        document.getElementById(
            "listaSoluciones"
        );

    lista.replaceChildren();

    if (
        datos.soluciones.length === 0
    ) {

        lista.appendChild(

            crearElemento(
                "div",
                "vacio",
                "Todavía no hay propuestas de solución."
            )

        );

        return;
    }

    const totalVotos =
        datos.soluciones.reduce(
            function(total, solucion) {

                return total +
                    (solucion.votos || 0);

            },
            0
        );

    datos.soluciones.forEach(
        function(solucion) {

            const tarjeta =
                crearElemento(
                    "article",
                    "tarjeta"
                );

            tarjeta.appendChild(

                crearElemento(
                    "h3",
                    "",
                    "💡 " +
                    solucion.titulo
                )

            );

            tarjeta.appendChild(

                crearElemento(
                    "p",
                    "",
                    solucion.descripcion
                )

            );

            tarjeta.appendChild(

                crearElemento(
                    "div",
                    "detalles",

                    "Código: " +
                    solucion.codigo +

                    " · Lugar: " +
                    solucion.zona +

                    " · Propuesta por: " +
                    solucion.nombre +

                    " · Fecha: " +
                    solucion.fecha
                )

            );

            const porcentaje =
                totalVotos > 0
                ? Math.round(
                    (
                        solucion.votos /
                        totalVotos
                    ) * 100
                )
                : 0;

            const votacion =
                crearElemento(
                    "div",
                    "votacion-solucion"
                );

            votacion.appendChild(

                crearElemento(
                    "strong",
                    "",
                    "🗳️ " +
                    solucion.votos +
                    (
                        solucion.votos === 1
                        ? " voto"
                        : " votos"
                    ) +
                    " · " +
                    porcentaje +
                    "% del total"
                )

            );

            const barra =
                crearElemento(
                    "div",
                    "barra-voto"
                );

            const interna =
                crearElemento(
                    "div",
                    "barra-voto-interna"
                );

            interna.style.width =
                porcentaje + "%";

            barra.appendChild(
                interna
            );

            votacion.appendChild(
                barra
            );

            tarjeta.appendChild(
                votacion
            );

            /* VOTAR */

            const acciones =
                crearElemento(
                    "div",
                    "acciones"
                );

            const boton =
                crearElemento(
                    "button",
                    "boton",
                    "🗳️ Votar por esta propuesta (" +
                    solucion.votos +
                    ")"
                );

            boton.type =
                "button";

            boton.addEventListener(
                "click",
                function() {

                    solucion.votos++;

                    guardarDatos();

                    renderizarTodo();

                }
            );

            acciones.appendChild(
                boton
            );

            tarjeta.appendChild(
                acciones
            );

            lista.appendChild(
                tarjeta
            );

        }
    );

}

/* =========================================================
   GRÁFICO
========================================================= */

function renderizarGrafico() {

    const grafico =
        document.getElementById(
            "graficoVotos"
        );

    grafico.replaceChildren();

    if (
        datos.soluciones.length === 0
    ) {

        grafico.appendChild(

            crearElemento(
                "div",
                "vacio",
                "Aún no existen propuestas para mostrar resultados."
            )

        );

        return;
    }

    const ordenadas =
        [...datos.soluciones]
        .sort(
            function(a, b) {

                return (
                    (b.votos || 0) -
                    (a.votos || 0)
                );

            }
        );

    const maximo =
        Math.max(
            ...ordenadas.map(
                function(solucion) {
                    return solucion.votos || 0;
                }
            ),
            1
        );

    ordenadas.forEach(
        function(solucion) {

            const fila =
                crearElemento(
                    "div",
                    "fila-grafico"
                );

            fila.appendChild(

                crearElemento(
                    "div",
                    "nombre-grafico",
                    solucion.titulo
                )

            );

            const fondo =
                crearElemento(
                    "div",
                    "fondo-grafico"
                );

            const valor =
                crearElemento(
                    "div",
                    "valor-grafico"
                );

            valor.style.width =
                (
                    (
                        solucion.votos || 0
                    ) / maximo
                ) * 100 + "%";

            fondo.appendChild(
                valor
            );

            fila.appendChild(
                fondo
            );

            fila.appendChild(

                crearElemento(
                    "div",
                    "numero-grafico",
                    (solucion.votos || 0) +
                    (
                        solucion.votos === 1
                        ? " voto"
                        : " votos"
                    )
                )

            );

            grafico.appendChild(
                fila
            );

        }
    );

}

/* =========================================================
   ACTUALIZAR TODO
========================================================= */

function renderizarTodo() {

    actualizarEstadisticas();

    renderizarReportes();

    renderizarSoluciones();

    renderizarGrafico();

}

/* =========================================================
   INICIAR
========================================================= */

renderizarTodo();
