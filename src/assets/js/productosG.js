const { ipcRenderer } = require('electron');
const url = require('url');
const path = require('path');

let currentPage = 1; // Página actual
const pageSize = 10;

document.addEventListener('DOMContentLoaded', () => {
  // Cargar la lista de productos al cargar la página
  ipcRenderer.send('load-productos', currentPage);
});

// Mostrar la tabla de productos
ipcRenderer.on('productos-loaded', (event, paginatedProducts, totalRecords) => {
  const productosTableContainer = document.getElementById('productos-table-container');
  if (!productosTableContainer) {
    console.error("Element with ID 'productos-table-container' not found.");
    return;
  }

  productosTableContainer.innerHTML = '';

  const productosTable = document.createElement('table');
  productosTable.id = 'productos-table';

   // Establecer estilos en línea para la tabla
  productosTable.style.width = '100%';
  productosTable.style.borderCollapse = 'collapse';
  productosTable.classList.add('table', 'table-hover');
  
  productosTable.innerHTML = `
     <thead>
       <tr>
         <th>Código de Barras</th>
         <th>Nombre</th>
         <th>Precio de Compra</th>
         <th>Precio de Venta</th>
         <th>Cantidad</th>
         <th>Acciones</th>
       </tr>
     </thead>
     <tbody>
       <!-- Aquí se agregan las filas de productos -->
     </tbody>
   `;

  paginatedProducts.forEach((producto) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${producto.codigo_barras}</td>
      <td>${producto.nombre}</td>
      <td>\$${producto.precio_compra}</td>
      <td>\$${producto.precio_venta}</td>
      <td>${producto.cantidad} ${producto.unidad_venta}</td>
      <td>
        <button id="eliminar-button" class="btn btn-danger btn-sm" data-id="${producto.id}">
          <i class="feather icon-trash-2"></i>
        </button>
        <button id="cantidad-button" class="btn btn-primary btn-sm" data-id="${producto.id}">
          <i class="feather icon-plus"></i>
        </button>
      </td>
    `;

    productosTable.querySelector('tbody').appendChild(row);
  });

  productosTableContainer.appendChild(productosTable);

  // Calcular totalPages
  const totalPages = Math.ceil(totalRecords / pageSize);

  // Actualizar botones de paginación y número de página actual
  const paginationContainer = document.getElementById('paginationContainer');
  if (paginationContainer) {
    paginationContainer.innerHTML = '';

    const prevPageButton = document.createElement('button');
    prevPageButton.id = 'prevPageButton';
    prevPageButton.classList.add('btn', 'btn-secondary', 'btn-sm');
    prevPageButton.disabled = true;
    prevPageButton.textContent = '<<';

    const nextPageButton = document.createElement('button');
    nextPageButton.id = 'nextPageButton';
    nextPageButton.classList.add('btn', 'btn-secondary', 'btn-sm');
    nextPageButton.disabled = true;
    nextPageButton.textContent = '>>';

    const currentPageDisplay = document.createElement('span');
    currentPageDisplay.id = 'currentPageDisplay';

    paginationContainer.appendChild(prevPageButton);
    paginationContainer.appendChild(currentPageDisplay);
    paginationContainer.appendChild(nextPageButton);

    // Habilitar o deshabilitar los botones de paginación según sea necesario
    if (currentPage === 1) {
      prevPageButton.disabled = true;
    } else {
      prevPageButton.disabled = false;
    }

    if (currentPage === totalPages) {
      nextPageButton.disabled = true;
    } else {
      nextPageButton.disabled = false;
    }

    currentPageDisplay.textContent = `  Página ${currentPage} de ${totalPages}   `;

    // Manejar el evento de avanzar a la página siguiente
    nextPageButton.addEventListener('click', () => {
      currentPage++;
      ipcRenderer.send('load-productos', currentPage);
    });

    // Manejar el evento de retroceder a la página anterior
    prevPageButton.addEventListener('click', () => {
      currentPage--;
      ipcRenderer.send('load-productos', currentPage);
    });
  }
});

// Manejar el evento de agregar producto
document.getElementById('agregar-button').addEventListener('click', () => {
  const productosFormURL = url.format({
    pathname: path.join(__dirname, 'agregar-producto.html'),
    protocol: 'file:',
    slashes: true,
  });
  ipcRenderer.send('open-productos-form', null);
});

// Manejar el evento de eliminar producto
document.getElementById('productos-table-container').addEventListener('click', (event) => {
  if (event.target.classList.contains('btn-danger')) {
    event.preventDefault();
    const productoId = event.target.getAttribute('data-id');
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });
    
    swalWithButtons.fire({
      icon: 'question',
      text: '¿Desea eliminar este producto?',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        swalWithButtons.fire({
          icon: 'success',
          text: 'El producto se ha eliminado',
          timer: 2000
        }).then(() => {
        ipcRenderer.send('eliminar-producto', productoId, currentPage);
        });
      }
    });
  }
});

// Manejar el evento de agregar cantidad al producto
document.getElementById('productos-table-container').addEventListener('click', (event) => {
  if (event.target.classList.contains('btn-primary')) {
    const productoId = event.target.getAttribute('data-id');
    console.log('productoId:', productoId);

    ipcRenderer.send('abrir-ventana-agregar-cantidad', productoId);
  }
});

// Manejar el evento de búsqueda
const buscarInput = document.getElementById('buscar-input');
const mensajeNoResultado = document.getElementById('mensaje-no-resultado');
const productosContainer = document.getElementById('productos-table-container');

buscarInput.addEventListener('input', (event) => {
  const searchText = event.target.value.toLowerCase();
  
  // Si el valor del texto de búsqueda está vacío, cargar productos paginados
  if (searchText === '') {
    currentPage = 1; // Reiniciar la página actual a 1
    ipcRenderer.send('load-productos', currentPage);
  } else {
    // Si hay texto de búsqueda, llamar al evento 'buscar-productos' con el valor de búsqueda
    ipcRenderer.send('buscar-productos-bd', searchText);
  }
});

  // Escuchar la respuesta del proceso principal con los productos encontrados y el número total de registros
ipcRenderer.on('productos-encontrados', (event, productos) => {
  //const productosRows = document.querySelectorAll('#productos-table tbody tr');
  productosContainer.innerHTML = '';

  //let hasResult = false;

  if (productos.length > 0) {
  const productosTable = document.createElement('table');
  productosTable.id = 'productos-table';

   // Establecer estilos en línea para la tabla
  productosTable.style.width = '100%';
  productosTable.style.borderCollapse = 'collapse';
  productosTable.classList.add('table', 'table-hover');
  
  productosTable.innerHTML = `
     <thead>
       <tr>
         <th>Código de Barras</th>
         <th>Nombre</th>
         <th>Precio de Compra</th>
         <th>Precio de Venta</th>
         <th>Cantidad</th>
         <th>Acciones</th>
       </tr>
     </thead>
     <tbody>
       <!-- Aquí se agregan las filas de productos -->
     </tbody>
   `;

  productos.forEach((producto) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${producto.codigo_barras}</td>
      <td>${producto.nombre}</td>
      <td>\$${producto.precio_compra}</td>
      <td>\$${producto.precio_venta}</td>
      <td>${producto.cantidad} ${producto.unidad_venta}</td>
      <td>
        <button id="eliminar-button" class="btn btn-danger btn-sm" data-id="${producto.id}">
          <i class="feather icon-trash-2"></i>
        </button>
        <button id="cantidad-button" class="btn btn-primary btn-sm" data-id="${producto.id}">
          <i class="feather icon-plus"></i>
        </button>
      </td>
    `;

    productosTable.querySelector('tbody').appendChild(row);
  });

  productosContainer.appendChild(productosTable);

  
  } else {
    //buscarInput.value = '';
    
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });

    swalWithButtons.fire({
      icon: 'error',
      text: 'No existen coincidencias',
      //timer: 2000
    });
    cargarProductosPaginadosPagina1();
  }
});

function cargarProductosPaginadosPagina1() {
  currentPage = 1; // Reiniciar la página actual a 1
  ipcRenderer.send('load-productos', currentPage);
}

// Obtener una referencia al elemento "Salir"
const btnSalir = document.querySelector('.dropdown-item');

// Agregar un evento de clic al elemento "Salir"
btnSalir.addEventListener('click', () => {
  // Enviar un mensaje al proceso principal para cerrar sesión
  ipcRenderer.send('logout');
});