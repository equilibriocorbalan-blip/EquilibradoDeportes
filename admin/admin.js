// ======================================================
// EQUILIBRADO DEPORTE
// ADMIN.JS
// ======================================================

// ======================================================
// CONFIGURACIÓN DE SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://kphibqifngwqqkopcthj.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_-bPr742zCVr6W-2PqmH_FA_PxxB68R2";

const BUCKET = "Productos";
console.log("SUPABASE URL:", SUPABASE_URL);
console.log("SUPABASE KEY:", SUPABASE_KEY);

// ======================================================
// ELEMENTOS DEL HTML
// ======================================================

const formulario = document.getElementById("productoForm");
const lista = document.getElementById("listaProductos");

// ======================================================
// VARIABLE PARA EDICIÓN
// ======================================================

let productoEditando = null;

// ======================================================
// HEADERS SUPABASE
// ======================================================

function headersSupabase() {
    return {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    };
}

// ======================================================
// COMPROBAR CONEXIÓN CON SUPABASE
// ======================================================

async function comprobarSupabase() {

    console.log("====================================");
    console.log("Comprobando conexión con Supabase...");
    console.log("====================================");

    try {

        const respuesta = await fetch(
            SUPABASE_URL +
            "/rest/v1/productos?select=id&limit=1",
            {
                method: "GET",
                headers: headersSupabase()
            }
        );

        const texto = await respuesta.text();

        if (!respuesta.ok) {

            console.error(
                "Supabase respondió con error:",
                respuesta.status,
                texto
            );

            return false;
        }

        console.log(
            "Supabase conectado correctamente."
        );

        return true;

    } catch (error) {

        console.error(
            "No se pudo conectar con Supabase:",
            error
        );

        return false;
    }
}

// ======================================================
// SUBIR IMAGEN
// ======================================================

async function subirImagen(imagen) {

    const extension =
        imagen.name.includes(".")
            ? imagen.name.substring(
                imagen.name.lastIndexOf(".")
            )
            : "";

    const nombreArchivo =
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8) +
        extension;

    const respuestaImagen = await fetch(

        SUPABASE_URL +
        "/storage/v1/object/" +
        BUCKET +
        "/" +
        nombreArchivo,

        {
            method: "POST",

            headers: {
                "apikey": SUPABASE_KEY,
                "Content-Type": imagen.type
            },

            body: imagen
        }
    );

    if (!respuestaImagen.ok) {

        const error =
            await respuestaImagen.text();

        console.error(
            "Error al subir imagen:",
            error
        );

        throw new Error(
            "No se pudo subir la imagen.\n\n" +
            error
        );
    }

    return (
        SUPABASE_URL +
        "/storage/v1/object/public/" +
        BUCKET +
        "/" +
        nombreArchivo
    );
}

// ======================================================
// AGREGAR PRODUCTO
// ======================================================

formulario.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        // ==================================================
        // SI ESTAMOS EDITANDO
        // ==================================================

        if (productoEditando) {

            await guardarEdicion();

            return;
        }

        // ==================================================
        // OBTENER DATOS
        // ==================================================

        const nombre =
            document
                .getElementById("nombre")
                .value
                .trim();

        const categoria =
            document
                .getElementById("categoria")
                .value;

        const precio =
            document
                .getElementById("precio")
                .value;

        const descripcion =
            document
                .getElementById("descripcion")
                .value
                .trim();

        const archivos =
            document
                .getElementById("imagen")
                .files;

        // ==================================================
        // VALIDACIONES
        // ==================================================

        if (!nombre) {

            alert(
                "Escribí el nombre del producto."
            );

            return;
        }

        if (!categoria) {

            alert(
                "Seleccioná una categoría."
            );

            return;
        }

        if (!precio || Number(precio) < 0) {

            alert(
                "Ingresá un precio válido."
            );

            return;
        }

        if (!archivos || archivos.length === 0) {

            alert(
                "Seleccioná al menos una imagen."
            );

            return;
        }

        try {

            // ==================================================
            // COMPROBAR SUPABASE
            // ==================================================

            const conectado =
                await comprobarSupabase();

            if (!conectado) {

                alert(
                    "No se pudo conectar con Supabase. Revisá la clave API."
                );

                return;
            }

            // ==================================================
            // SUBIR TODAS LAS IMÁGENES
            // ==================================================

            console.log(
                "Subiendo",
                archivos.length,
                "imagen(es)..."
            );

            const imagenesSubidas = [];

            for (
                let i = 0;
                i < archivos.length;
                i++
            ) {

                const url =
                    await subirImagen(
                        archivos[i]
                    );

                imagenesSubidas.push(url);
            }

            if (
                imagenesSubidas.length === 0
            ) {

                alert(
                    "No se pudo subir ninguna imagen."
                );

                return;
            }

            // ==================================================
            // PRIMERA IMAGEN = PRINCIPAL
            // ==================================================

            const imagenPrincipal =
                imagenesSubidas[0];

            // ==================================================
            // GUARDAR PRODUCTO
            // ==================================================

            const respuestaProducto =
                await fetch(

                    SUPABASE_URL +
                    "/rest/v1/productos",

                    {
                        method: "POST",

                        headers: {
                            "apikey":
                                SUPABASE_KEY,

                            "Content-Type":
                                "application/json",

                            "Prefer":
                                "return=representation"
                        },

                        body:
                            JSON.stringify({

                                nombre:
                                    nombre,

                                categoria:
                                    categoria,

                                precio:
                                    Number(precio),

                                descripcion:
                                    descripcion,

                                imagen_url:
                                    imagenPrincipal,

                                visible:
                                    true
                            })
                    }
                );

            if (!respuestaProducto.ok) {

                const error =
                    await respuestaProducto.text();

                console.error(
                    "Error al guardar producto:",
                    error
                );

                alert(
                    "Las imágenes se subieron correctamente, " +
                    "pero el producto no pudo guardarse.\n\n" +
                    error
                );

                return;
            }

            const productoCreado =
                await respuestaProducto.json();

            if (
                !productoCreado ||
                !productoCreado.length
            ) {

                alert(
                    "El producto se guardó, pero no se pudo obtener su ID."
                );

                return;
            }

            const productoId =
                productoCreado[0].id;

            // ==================================================
            // GUARDAR FOTOS ADICIONALES
            // ==================================================

            if (
                imagenesSubidas.length > 1
            ) {

                for (
                    let i = 1;
                    i < imagenesSubidas.length;
                    i++
                ) {

                    const respuestaFoto =
                        await fetch(

                            SUPABASE_URL +
                            "/rest/v1/producto_imagenes",

                            {
                                method: "POST",

                                headers: {
                                    "apikey":
                                        SUPABASE_KEY,

                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        producto_id:
                                            productoId,

                                        imagen_url:
                                            imagenesSubidas[i],

                                        orden:
                                            i
                                    })
                            }
                        );

                    if (!respuestaFoto.ok) {

                        const errorFoto =
                            await respuestaFoto.text();

                        console.error(
                            "Error guardando foto adicional:",
                            errorFoto
                        );
                    }
                }
            }

            // ==================================================
            // FINALIZAR
            // ==================================================

            alert(
                "¡Producto agregado correctamente!"
            );

            formulario.reset();

            cargarProductos();

        } catch (error) {

            console.error(
                "ERROR GENERAL:",
                error
            );

            alert(
                "Ocurrió un error:\n\n" +
                error.message
            );
        }
    }
);

// ======================================================
// CARGAR PRODUCTOS
// ======================================================

async function cargarProductos() {

    if (!lista) {
        console.error(
            "No existe #listaProductos en el HTML."
        );
        return;
    }

    lista.innerHTML =
        "<p>Cargando productos...</p>";

    try {

        const respuesta =
            await fetch(

                SUPABASE_URL +
                "/rest/v1/productos" +
                "?select=*" +
                "&order=id.desc",

                {
                    method: "GET",

                    headers: {
                        "apikey":
                            SUPABASE_KEY
                    }
                }
            );

        if (!respuesta.ok) {

            const error =
                await respuesta.text();

            console.error(
                "Error cargando productos:",
                error
            );

            lista.innerHTML =
                "<p>No se pudieron cargar los productos.</p>";

            return;
        }

        const productos =
            await respuesta.json();

        lista.innerHTML = "";

        if (
            productos.length === 0
        ) {

            lista.innerHTML =
                "<p>No hay productos todavía.</p>";

            return;
        }

        // ==================================================
        // MOSTRAR PRODUCTOS
        // ==================================================

        productos.forEach(
            function (producto) {

                const elemento =
                    document.createElement("div");

                elemento.className =
                    "producto-admin";

                const estaVisible =
                    producto.visible !== false;

                elemento.innerHTML = `

                    <hr>

                    <h3>
                        ${escaparHTML(producto.nombre)}
                    </h3>

                    <p>
                        <strong>Categoría:</strong>
                        ${escaparHTML(
                            producto.categoria ||
                            "Sin categoría"
                        )}
                    </p>

                    <p>
                        <strong>Precio:</strong>
                        $${Number(producto.precio)
                            .toLocaleString("es-AR")}
                    </p>

                    <p>
                        ${escaparHTML(
                            producto.descripcion || ""
                        )}
                    </p>

                    ${
                        producto.imagen_url
                            ? `
                                <img
                                    src="${escaparAtributo(
                                        producto.imagen_url
                                    )}"
                                    alt="${escaparAtributo(
                                        producto.nombre
                                    )}"
                                    width="200"
                                    style="
                                        display:block;
                                        max-width:200px;
                                        border-radius:10px;
                                        margin:10px 0;
                                    "
                                >
                            `
                            : ""
                    }

                    <br>

                    <button
                        type="button"
                        onclick="editarProducto(${producto.id})"
                    >
                        Editar
                    </button>

                    <button
                        type="button"
                        onclick="cambiarVisibilidad(
                            ${producto.id},
                            ${estaVisible}
                        )"
                    >
                        ${
                            estaVisible
                                ? "Ocultar"
                                : "Mostrar"
                        }
                    </button>

                    <button
                        type="button"
                        onclick="eliminarProducto(${producto.id})"
                    >
                        Eliminar
                    </button>

                    <p>
                        <strong>Estado:</strong>

                        ${
                            estaVisible
                                ? "Visible en la página web"
                                : "Oculto de la página web"
                        }
                    </p>

                    <hr>
                `;

                lista.appendChild(elemento);
            }
        );

    } catch (error) {

        console.error(
            "Error de conexión:",
            error
        );

        lista.innerHTML =
            "<p>Error de conexión con Supabase.</p>";
    }
}

// ======================================================
// CAMBIAR VISIBILIDAD
// ======================================================

async function cambiarVisibilidad(
    id,
    actualmenteVisible
) {

    const nuevoEstado =
        !actualmenteVisible;

    console.log(
        "Cambiando visibilidad del producto:",
        id,
        "Nuevo estado:",
        nuevoEstado
    );

    try {

        const respuesta =
            await fetch(

                SUPABASE_URL +
                "/rest/v1/productos?id=eq." +
                encodeURIComponent(id),

                {
                    method: "PATCH",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=representation"
                    },

                    body:
                        JSON.stringify({

                            visible:
                                nuevoEstado
                        })
                }
            );

        const texto =
            await respuesta.text();

        if (!respuesta.ok) {

            console.error(
                "Error cambiando visibilidad:",
                respuesta.status,
                texto
            );

            alert(
                "No se pudo cambiar la visibilidad.\n\n" +
                texto
            );

            return;
        }

        console.log(
            "Visibilidad modificada correctamente:",
            texto
        );

        alert(
            nuevoEstado
                ? "Producto mostrado nuevamente."
                : "Producto ocultado de la página web."
        );

        await cargarProductos();

    } catch (error) {

        console.error(
            "Error cambiando visibilidad:",
            error
        );

        alert(
            "Error de conexión al cambiar la visibilidad."
        );
    }
}

// ======================================================
// EDITAR PRODUCTO
// ======================================================

async function editarProducto(id) {

    try {

        const respuesta =
            await fetch(

                SUPABASE_URL +
                "/rest/v1/productos?id=eq." +
                encodeURIComponent(id) +
                "&select=*",

                {
                    method: "GET",

                    headers: {
                        "apikey":
                            SUPABASE_KEY
                    }
                }
            );

        if (!respuesta.ok) {

            const error =
                await respuesta.text();

            console.error(
                error
            );

            alert(
                "No se pudo cargar el producto."
            );

            return;
        }

        const productos =
            await respuesta.json();

        if (!productos.length) {

            alert(
                "No se encontró el producto."
            );

            return;
        }

        const producto =
            productos[0];

        productoEditando =
            producto;

        // ==================================================
        // CARGAR DATOS
        // ==================================================

        document.getElementById(
            "nombre"
        ).value =
            producto.nombre || "";

        document.getElementById(
            "categoria"
        ).value =
            producto.categoria || "";

        document.getElementById(
            "precio"
        ).value =
            producto.precio || "";

        document.getElementById(
            "descripcion"
        ).value =
            producto.descripcion || "";

        document.getElementById(
            "imagen"
        ).required = false;

        // ==================================================
        // BOTÓN GUARDAR
        // ==================================================

        const boton =
            formulario.querySelector(
                'button[type="submit"]'
            );

        boton.textContent =
            "Guardar cambios";

        // ==================================================
        // BOTÓN CANCELAR
        // ==================================================

        let botonCancelar =
            document.getElementById(
                "cancelarEdicion"
            );

        if (!botonCancelar) {

            botonCancelar =
                document.createElement(
                    "button"
                );

            botonCancelar.type =
                "button";

            botonCancelar.id =
                "cancelarEdicion";

            botonCancelar.className =
                "btn-secondary";

            botonCancelar.textContent =
                "Cancelar edición";

            botonCancelar.style.marginLeft =
                "10px";

            boton.after(
                botonCancelar
            );

            botonCancelar.addEventListener(
                "click",
                cancelarEdicion
            );
        }

        // ==================================================
        // IMAGEN ACTUAL
        // ==================================================

        let imagenActual =
            document.getElementById(
                "imagenActual"
            );

        if (!imagenActual) {

            imagenActual =
                document.createElement(
                    "div"
                );

            imagenActual.id =
                "imagenActual";

            imagenActual.style.marginTop =
                "15px";

            document
                .getElementById("imagen")
                .parentElement
                .appendChild(
                    imagenActual
                );
        }

        imagenActual.innerHTML = `

            <p>
                <strong>
                    Imagen principal actual:
                </strong>
            </p>

            ${
                producto.imagen_url
                    ? `
                        <img
                            src="${escaparAtributo(
                                producto.imagen_url
                            )}"
                            alt="Imagen actual"
                            style="
                                max-width:200px;
                                border-radius:10px;
                                display:block;
                                margin-bottom:10px;
                            "
                        >
                    `
                    : `
                        <p>
                            Este producto no tiene imagen.
                        </p>
                    `
            }

            <small>
                Si no elegís nuevas imágenes,
                se conservará la actual.
            </small>
        `;

        formulario.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {

        console.error(
            "Error al editar:",
            error
        );

        alert(
            "Error de conexión al cargar el producto."
        );
    }
}

// ======================================================
// GUARDAR EDICIÓN
// ======================================================

async function guardarEdicion() {

    if (!productoEditando) {
        return;
    }

    const nombre =
        document
            .getElementById("nombre")
            .value
            .trim();

    const categoria =
        document
            .getElementById("categoria")
            .value;

    const precio =
        document
            .getElementById("precio")
            .value;

    const descripcion =
        document
            .getElementById("descripcion")
            .value
            .trim();

    const archivos =
        document
            .getElementById("imagen")
            .files;

    // ==================================================
    // VALIDACIONES
    // ==================================================

    if (!nombre) {

        alert(
            "Escribí el nombre del producto."
        );

        return;
    }

    if (!categoria) {

        alert(
            "Seleccioná una categoría."
        );

        return;
    }

    if (!precio || Number(precio) < 0) {

        alert(
            "Ingresá un precio válido."
        );

        return;
    }

    try {

        let imagenURL =
            productoEditando.imagen_url || "";

        // ==================================================
        // SI SE SELECCIONARON NUEVAS FOTOS
        // ==================================================

        if (
            archivos &&
            archivos.length > 0
        ) {

            const imagenesSubidas = [];

            for (
                let i = 0;
                i < archivos.length;
                i++
            ) {

                const url =
                    await subirImagen(
                        archivos[i]
                    );

                imagenesSubidas.push(url);
            }

            if (
                imagenesSubidas.length > 0
            ) {

                // Primera foto = principal

                imagenURL =
                    imagenesSubidas[0];

                // ==================================================
                // GUARDAR FOTOS ADICIONALES
                // ==================================================

                for (
                    let i = 1;
                    i < imagenesSubidas.length;
                    i++
                ) {

                    const respuestaFoto =
                        await fetch(

                            SUPABASE_URL +
                            "/rest/v1/producto_imagenes",

                            {
                                method: "POST",

                                headers: {
                                    "apikey":
                                        SUPABASE_KEY,

                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({

                                        producto_id:
                                            productoEditando.id,

                                        imagen_url:
                                            imagenesSubidas[i],

                                        orden:
                                            i
                                    })
                            }
                        );

                    if (!respuestaFoto.ok) {

                        const errorFoto =
                            await respuestaFoto.text();

                        console.error(
                            "Error guardando foto adicional:",
                            errorFoto
                        );
                    }
                }
            }
        }

        // ==================================================
        // ACTUALIZAR PRODUCTO
        // ==================================================

        const respuesta =
            await fetch(

                SUPABASE_URL +
                "/rest/v1/productos?id=eq." +
                encodeURIComponent(
                    productoEditando.id
                ),

                {
                    method: "PATCH",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Content-Type":
                            "application/json",

                        "Prefer":
                            "return=representation"
                    },

                    body:
                        JSON.stringify({

                            nombre:
                                nombre,

                            categoria:
                                categoria,

                            precio:
                                Number(precio),

                            descripcion:
                                descripcion,

                            imagen_url:
                                imagenURL
                        })
                }
            );

        const texto =
            await respuesta.text();

        if (!respuesta.ok) {

            console.error(
                "Error actualizando producto:",
                texto
            );

            alert(
                "No se pudo actualizar el producto.\n\n" +
                texto
            );

            return;
        }

        alert(
            "¡Producto actualizado correctamente!"
        );

        cancelarEdicion();

        cargarProductos();

    } catch (error) {

        console.error(
            "Error guardando edición:",
            error
        );

        alert(
            "Error de conexión al actualizar el producto."
        );
    }
}

// ======================================================
// CANCELAR EDICIÓN
// ======================================================

function cancelarEdicion() {

    productoEditando =
        null;

    formulario.reset();

    document.getElementById(
        "imagen"
    ).required = true;

    const boton =
        formulario.querySelector(
            'button[type="submit"]'
        );

    boton.textContent =
        "Agregar producto";

    const botonCancelar =
        document.getElementById(
            "cancelarEdicion"
        );

    if (botonCancelar) {
        botonCancelar.remove();
    }

    const imagenActual =
        document.getElementById(
            "imagenActual"
        );

    if (imagenActual) {
        imagenActual.remove();
    }
}

// ======================================================
// ELIMINAR PRODUCTO
// ======================================================

async function eliminarProducto(id) {

    const confirmar =
        confirm(
            "¿Querés eliminar este producto?"
        );

    if (!confirmar) {
        return;
    }

    try {

        const respuesta =
            await fetch(

                SUPABASE_URL +
                "/rest/v1/productos?id=eq." +
                encodeURIComponent(id),

                {
                    method: "DELETE",

                    headers: {
                        "apikey":
                            SUPABASE_KEY,

                        "Prefer":
                            "return=minimal"
                    }
                }
            );

        const texto =
            await respuesta.text();

        if (!respuesta.ok) {

            console.error(
                "Error eliminando producto:",
                texto
            );

            alert(
                "No se pudo eliminar el producto.\n\n" +
                texto
            );

            return;
        }

        alert(
            "Producto eliminado correctamente."
        );

        cargarProductos();

    } catch (error) {

        console.error(
            "Error al eliminar:",
            error
        );

        alert(
            "Error de conexión al eliminar el producto."
        );
    }
}

// ======================================================
// EVITAR HTML INYECTADO
// ======================================================

function escaparHTML(texto) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        texto ?? "";

    return div.innerHTML;
}

// ======================================================
// ESCAPAR ATRIBUTOS
// ======================================================

function escaparAtributo(texto) {

    return String(
        texto ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );
}

// ======================================================
// HACER FUNCIONES DISPONIBLES PARA LOS BOTONES HTML
// ======================================================

window.cambiarVisibilidad =
    cambiarVisibilidad;

window.editarProducto =
    editarProducto;

window.eliminarProducto =
    eliminarProducto;

// ======================================================
// CARGAR PRODUCTOS AL ABRIR EL PANEL
// ======================================================

cargarProductos();