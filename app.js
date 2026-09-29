// ======================================================
// EQUILIBRADO DEPORTE
// APP.JS
// ======================================================

// ======================================================
// CONFIGURACIÓN
// ======================================================

const WHATSAPP_NUMBER = "5493853001751";

const SUPABASE_URL =
  "https://kphibqifngwqqkopcthj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_-bPr742zCVr6W-2PqmH_FA_PxxB68R2";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

// ======================================================
// ELEMENTOS DEL HTML
// ======================================================

const grid = document.getElementById("product-grid");
const filters = document.querySelectorAll(".filter");
const modal = document.getElementById("product-modal");
const modalImage = document.getElementById("modal-image");
const modalCat = document.getElementById("modal-cat");
const modalName = document.getElementById("modal-name");
const modalDesc = document.getElementById("modal-desc");
const modalPrice = document.getElementById("modal-price");
const sizeRow = document.getElementById("size-row");
const qtyValue = document.getElementById("qty-value");
const sendBtn = document.getElementById("send-whatsapp");
const modalClose = document.getElementById("modal-close");
const qtyMinus = document.getElementById("qty-minus");
const qtyPlus = document.getElementById("qty-plus");
const menuBtn = document.getElementById("menu-btn");
const nav = document.getElementById("nav");

// ======================================================
// VARIABLES
// ======================================================

let products = [];
let activeCategory = "Todos";
let selected = null;
let selectedSize = "";
let qty = 1;

// ======================================================
// CARGAR PRODUCTOS DESDE SUPABASE
// ======================================================

async function cargarProductos() {

  console.log("====================================");
  console.log("Cargando productos desde Supabase...");
  console.log("====================================");

  if (!grid) {
    console.error("No existe #product-grid en el HTML.");
    return;
  }

  grid.innerHTML = `
    <p style="grid-column:1/-1;text-align:center;">
      Cargando productos...
    </p>
  `;

  try {

    const { data, error } = await supabaseClient
      .from("productos")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {

      console.error(
        "ERROR DE SUPABASE:",
        error
      );

      grid.innerHTML = `
        <p style="grid-column:1/-1;text-align:center;">
          No se pudieron cargar los productos.
        </p>
      `;

      return;
    }

    console.log(
      "Productos recibidos desde Supabase:",
      data
    );

    if (!data || data.length === 0) {

      products = [];

      grid.innerHTML = `
        <p style="grid-column:1/-1;text-align:center;">
          No hay productos publicados todavía.
        </p>
      `;

      return;
    }

    // ==================================================
    // CONVERTIR DATOS DE SUPABASE
    // ==================================================

    products = data
      .filter((producto) => {

        // ==================================================
        // PRODUCTOS VISIBLES
        // ==================================================
        // Si visible es false, el producto NO aparece.
        // Si visible es true, aparece.
        // Si por algún motivo visible no existe, también
        // se permite mostrarlo para no ocultar productos
        // existentes accidentalmente.
        // ==================================================

        return producto.visible !== false;
      })
      .map((producto) => {

        const imagen =
          producto.imagen_url ||
          producto.imagen ||
          "";

        const categoria =
          producto.categoria ||
          producto.category ||
          "Sin categoría";

        const nombre =
          producto.nombre ||
          producto.name ||
          "Producto sin nombre";

        const precio =
          Number(
            producto.precio ||
            producto.price ||
            0
          );

        const descripcion =
          producto.descripcion ||
          producto.desc ||
          "";

        return {
          id: String(producto.id),
          name: String(nombre),
          category: String(categoria),
          price: precio,
          desc: String(descripcion),
          image: String(imagen),
          visible: producto.visible !== false
        };
      });

    console.log(
      "Productos visibles preparados para mostrar:",
      products
    );

    renderProducts();

  } catch (error) {

    console.error(
      "ERROR DE CONEXIÓN CON SUPABASE:",
      error
    );

    grid.innerHTML = `
      <p style="grid-column:1/-1;text-align:center;">
        Error de conexión con Supabase.
      </p>
    `;
  }
}

// ======================================================
// MOSTRAR PRODUCTOS
// ======================================================

function renderProducts() {

  if (!grid) return;

  let list = products;

  // ==================================================
  // SEGURIDAD EXTRA
  // ==================================================
  // Aunque los productos ocultos ya fueron filtrados
  // al cargarlos, volvemos a comprobarlo antes de
  // dibujarlos.
  // ==================================================

  list = list.filter(
    (producto) => producto.visible !== false
  );

  // ==================================================
  // FILTRAR POR CATEGORÍA
  // ==================================================

  if (activeCategory !== "Todos") {

    list = products.filter((producto) => {

      return (
        producto.visible !== false &&
        normalizarTexto(producto.category) ===
        normalizarTexto(activeCategory)
      );
    });
  }

  list.sort((a, b) =>
    a.name.localeCompare(b.name, "es", {
      sensitivity: "base",
      numeric: true
    })
  );

  console.log(
    "Categoría activa:",
    activeCategory
  );

  console.log(
    "Productos a mostrar:",
    list
  );

  // ==================================================
  // SI NO HAY PRODUCTOS
  // ==================================================

  if (list.length === 0) {

    grid.innerHTML = `
      <p style="
        grid-column:1/-1;
        text-align:center;
      ">
        No hay productos en esta categoría.
      </p>
    `;

    return;
  }

  // ==================================================
  // GENERAR PRODUCTOS
  // ==================================================

  grid.innerHTML = list
    .map((producto) => {

      const imagenHTML = producto.image
        ? `
          <img
            src="${escaparAtributo(producto.image)}"
            alt="${escaparAtributo(producto.name)}"
            loading="lazy"
            onerror="
              this.style.display='none';
              this.parentElement.classList.add('image-error');
            "
          >
        `
        : `
          <div class="sin-imagen">
            Sin imagen
          </div>
        `;

      return `
        <article
          class="product"
          data-id="${escaparAtributo(producto.id)}"
        >

          <div class="product-media">
            ${imagenHTML}
          </div>

          <div class="product-body">

            <div class="product-cat">
              ${escaparHTML(producto.category)}
            </div>

            <h3>
              ${escaparHTML(producto.name)}
            </h3>

            <div class="price-row">

              <span class="price">
                ${money.format(producto.price)}
              </span>

              <span>
                Ver →
              </span>

            </div>

          </div>

        </article>
      `;
    })
    .join("");
}

// ======================================================
// ABRIR PRODUCTO
// ======================================================

function openProduct(id) {

  selected = products.find(
    (producto) =>
      String(producto.id) === String(id) &&
      producto.visible !== false
  );

  if (!selected) {

    console.error(
      "No se encontró el producto o está oculto:",
      id
    );

    return;
  }

  qty = 1;
  selectedSize = "";

  if (qtyValue) {
    qtyValue.textContent = qty;
  }

  // ==================================================
  // IMAGEN
  // ==================================================

  if (modalImage) {

    modalImage.src =
      selected.image || "";

    modalImage.alt =
      selected.name;

    modalImage.style.display =
      selected.image
        ? "block"
        : "none";
  }

  // ==================================================
  // INFORMACIÓN
  // ==================================================

  if (modalCat) {

    modalCat.textContent =
      selected.category;
  }

  if (modalName) {

    modalName.textContent =
      selected.name;
  }

  if (modalDesc) {

    modalDesc.textContent =
      selected.desc ||
      "Consultá disponibilidad y detalles por WhatsApp.";
  }

  if (modalPrice) {

    modalPrice.textContent =
      money.format(selected.price);
  }

  // ==================================================
  // OCULTAR TALLE PARA TODOS LOS PRODUCTOS
  // ==================================================

  if (sizeRow) {

    const sizeTitle =
      sizeRow.previousElementSibling;

    if (sizeTitle) {
      sizeTitle.style.display = "none";
    }

    sizeRow.style.display = "none";
    sizeRow.innerHTML = "";

    selectedSize = "";
  }

  // ==================================================
  // ABRIR MODAL
  // ==================================================

  if (modal) {
    modal.classList.add("open");
  }
}

// ======================================================
// CERRAR MODAL
// ======================================================

function cerrarModal() {

  if (modal) {
    modal.classList.remove("open");
  }
}

// ======================================================
// WHATSAPP
// ======================================================

function whatsappUrl(text) {

  return (
    "https://wa.me/" +
    WHATSAPP_NUMBER +
    "?text=" +
    encodeURIComponent(text)
  );
}

// ======================================================
// FILTROS
// ======================================================

filters.forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      filters.forEach((btn) => {

        btn.classList.remove(
          "active"
        );
      });

      button.classList.add("active");

      activeCategory =
        button.dataset.category ||
        "Todos";

      renderProducts();
    }
  );
});

// ======================================================
// ABRIR PRODUCTO
// ======================================================

if (grid) {

  grid.addEventListener(
    "click",
    (event) => {

      const card =
        event.target.closest(".product");

      if (!card) return;

      openProduct(
        card.dataset.id
      );
    }
  );
}

// ======================================================
// CATEGORÍAS
// ======================================================

document
  .querySelectorAll("[data-open-category]")
  .forEach((element) => {

    element.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        const category =
          element.dataset.openCategory;

        const filter =
          [...filters].find(
            (button) =>
              normalizarTexto(
                button.dataset.category
              ) ===
              normalizarTexto(category)
          );

        if (filter) {
          filter.click();
        }

        const catalogo =
          document.getElementById(
            "catalogo"
          );

        if (catalogo) {

          catalogo.scrollIntoView({
            behavior: "smooth"
          });
        }
      }
    );
  });

// ======================================================
// CERRAR MODAL - BOTÓN
// ======================================================

if (modalClose) {

  modalClose.addEventListener(
    "click",
    cerrarModal
  );
}

// ======================================================
// CERRAR MODAL - ESC
// ======================================================

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {
      cerrarModal();
    }
  }
);

// ======================================================
// CERRAR MODAL - CLICK AFUERA
// ======================================================

if (modal) {

  modal.addEventListener(
    "click",
    (event) => {

      if (event.target === modal) {
        cerrarModal();
      }
    }
  );
}

// ======================================================
// SELECCIONAR TALLE
// ======================================================

// Se mantiene el listener para evitar errores
// si el elemento todavía existe en el HTML.

if (sizeRow) {

  sizeRow.addEventListener(
    "click",
    (event) => {

      const button =
        event.target.closest(".size");

      if (!button) return;

      selectedSize =
        button.dataset.size ||
        "";

      sizeRow
        .querySelectorAll(".size")
        .forEach((size) => {

          size.classList.remove(
            "active"
          );
        });

      button.classList.add(
        "active"
      );
    }
  );
}

// ======================================================
// CANTIDAD -
// ======================================================

if (qtyMinus) {

  qtyMinus.addEventListener(
    "click",
    () => {

      qty = Math.max(
        1,
        qty - 1
      );

      if (qtyValue) {

        qtyValue.textContent =
          qty;
      }
    }
  );
}

// ======================================================
// CANTIDAD +
// ======================================================

if (qtyPlus) {

  qtyPlus.addEventListener(
    "click",
    () => {

      qty += 1;

      if (qtyValue) {

        qtyValue.textContent =
          qty;
      }
    }
  );
}

// ======================================================
// ENVIAR PRODUCTO POR WHATSAPP
// ======================================================

if (sendBtn) {

  sendBtn.addEventListener(
    "click",
    () => {

      if (!selected) {
        return;
      }

      // ==================================================
      // SEGURIDAD
      // ==================================================

      if (selected.visible === false) {

        cerrarModal();

        return;
      }

      const total =
        money.format(
          selected.price * qty
        );

      // ==================================================
      // MENSAJE
      // ==================================================

      const text =
`Hola Equilibrado Deporte, soy un cliente de la web y quiero consultar por:

• Producto: ${selected.name}

• Categoría: ${selected.category}

• Cantidad: ${qty}

• Precio unitario: ${money.format(selected.price)}

• Total estimado: ${total}

¿Me confirman disponibilidad y forma de pago? Gracias.`;

      // ==================================================
      // ABRIR WHATSAPP
      // ==================================================

      window.open(
        whatsappUrl(text),
        "_blank"
      );
    }
  );
}

// ======================================================
// MENÚ CELULAR
// ======================================================

if (menuBtn && nav) {

  menuBtn.addEventListener(
    "click",
    () => {

      nav.classList.toggle(
        "open"
      );
    }
  );
}

// ======================================================
// CERRAR MENÚ
// ======================================================

document
  .querySelectorAll("#nav a")
  .forEach((link) => {

    link.addEventListener(
      "click",
      () => {

        if (nav) {

          nav.classList.remove(
            "open"
          );
        }
      }
    );
  });

// ======================================================
// NORMALIZAR TEXTO
// ======================================================

function normalizarTexto(texto) {

  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}

// ======================================================
// EVITAR HTML INYECTADO
// ======================================================

function escaparHTML(texto) {

  const div =
    document.createElement("div");

  div.textContent =
    texto ?? "";

  return div.innerHTML;
}

// ======================================================
// ESCAPAR ATRIBUTOS
// ======================================================

function escaparAtributo(texto) {

  return String(texto ?? "")
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
// INICIAR
// ======================================================

cargarProductos();