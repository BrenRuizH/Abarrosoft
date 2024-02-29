const { ipcRenderer } = require('electron');
const productoIds = {}; // Objeto para mantener el seguimiento de los IDs de productos en las filas de venta

const formularioVenta = document.getElementById('buscar-producto-codigo-form');
// Obtener referencias a los elementos del formulario
const inputBuscarCodigo = document.getElementById('input-buscar-codigo');
const inputBuscarNombre = document.getElementById('input-buscar-nombre');
const selectProducto = document.getElementById('select-producto');
const btnAgregarCodigo = document.getElementById('btn-agregar-codigo');
const btnCancelarCodigo = document.getElementById('btn-cancelar-codigo');
const btnAgregarNombre = document.getElementById('btn-agregar-nombre');
const btnCancelarNombre = document.getElementById('btn-cancelar-nombre');

const ventasTableBody = document.getElementById('ventas-table-body');
const totalVentaLabel = document.getElementById('total-venta');

const btnTerminar = document.getElementById('btn-terminar');

formularioVenta.addEventListener('submit', (event) => {
  event.preventDefault(); // Cancelar el envío del formulario
});
// Agregar evento de entrada de texto para buscar productos
inputBuscarNombre.addEventListener('input', (event) => {
  const valor = event.target.value;
  if (valor.trim() !== '') {
    ipcRenderer.send('buscar-productos', valor);
    selectProducto.disabled = false;
  } else {
    // Limpiar opciones del select
    selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';
  }
});

inputBuscarCodigo.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    const valor = event.target.value;
    if (valor.trim() !== '') {
      ipcRenderer.send('buscar-productos-codigo', valor);
    }
  }
});



let productoEncontrado = null; // Variable global para guardar la información del producto encontrado
// Manejar la respuesta de la búsqueda de productos
ipcRenderer.on('productos-encontrados', (event, productos) => {
  // Limpiar opciones del select
  selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';

  // Agregar las opciones al select
  productos.forEach((producto) => {
    const option = document.createElement('option');
    option.value = producto.id;
    option.textContent = `${producto.nombre}`;
    selectProducto.appendChild(option);
  });

  // Guardar la información del primer producto encontrado (si existe) en la variable global
  if (productos.length > 0) {
    productoEncontrado = productos[0];
  } else {
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });
  
    swalWithButtons.fire({
      icon: 'error',
      text: 'Debe seleccionar un código de barras válido',
      timer: 2000
    });
  }
});

ipcRenderer.on('productos-encontrados-codigo', (event, productos) => {
  // Guardar la información del primer producto encontrado (si existe) en la variable global
  if (productos.length > 0) {
    
    

    productoEncontrado = productos[0];
    const cantidad = 1;

    if (productoEncontrado.cantidad < cantidad) { 
      const producto = {
      };  
      const swalWithButtons = Swal.mixin({
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-danger mx-2',
          cancelButton: 'btn btn-secondary',
        }});
         swalWithButtons.fire({
          icon: 'error',
          text: 'No hay suficiente stock disponible para este producto',
          timer: 2000
      });

    }else{
     const producto = {
      productoId: productoEncontrado.id,
      cantidad: parseFloat(cantidad),
      nombre: productoEncontrado.nombre, // Obtener el nombre del producto del dataset del botón
      precioUnitario: parseFloat(productoEncontrado.precio_venta), // Obtener el precio unitario del dataset del botón
    };
    ipcRenderer.send('agregar-producto-venta', producto);
    }
  
    

    inputBuscarCodigo.value = '';

  } else {
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });
  
    swalWithButtons.fire({
      icon: 'error',
      text: 'Debe seleccionar un código de barras válido',
      timer: 2000
    });
  }
});

// Agregar evento de cambio de opción en el select
selectProducto.addEventListener('change', (event) => {
  const productoId = event.target.value;
  if (productoId.trim() !== '') {
    ipcRenderer.send('obtener-producto', productoId);
  }
});

// Manejar la respuesta de la obtención de un producto
ipcRenderer.on('producto-encontrado', (event, producto) => {
  const productoData = JSON.parse(producto);
  console.log('JSON parseado', productoData);

  // Agregar información adicional del producto al botón de agregar
  btnAgregarNombre.dataset.nombre = productoData.nombre;
  btnAgregarNombre.dataset.precioUnitario = productoData.precio_venta;
  btnAgregarNombre.dataset.idPro = productoData.id;
  btnAgregarNombre.dataset.cantidad = productoData.cantidad;
});

// Agregar evento de clic al botón de agregar
btnAgregarNombre.addEventListener('click', () => {

  const productoId = selectProducto.value; // Obtener el ID del producto del select
  const cantidad = 1;

  if (!productoId || isNaN(productoId)) {
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });

    swalWithButtons.fire({
      icon: 'error',
      text: 'Debe seleccionar un producto válido',
      timer: 2000
    });
  }

  // Validación de stock
  if (btnAgregarNombre.dataset.cantidad < cantidad) {   
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      }});
       swalWithButtons.fire({
        icon: 'error',
        text: 'No hay suficiente stock disponible para este producto',
        timer: 2000
    });
  }else{
     const producto = {
      productoId: parseInt(productoId),
      cantidad: parseFloat(cantidad),
      nombre: btnAgregarNombre.dataset.nombre, // Obtener el nombre del producto del dataset del botón
      precioUnitario: parseFloat(btnAgregarNombre.dataset.precioUnitario), // Obtener el precio unitario del dataset del botón
    };

    ipcRenderer.send('agregar-producto-venta', producto);
  }
  
});

btnAgregarCodigo.addEventListener('click', () => {
  

  if (productoEncontrado) {
  const cantidad = 1;

  if (productoEncontrado.cantidad < cantidad) {  
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      }});
       swalWithButtons.fire({
        icon: 'error',
        text: 'No hay suficiente stock disponible para este producto',
        timer: 2000
    });
  }else{
   const producto = {
    productoId: productoEncontrado.id,
    cantidad: parseFloat(cantidad),
    nombre: productoEncontrado.nombre, // Obtener el nombre del producto del dataset del botón
    precioUnitario: parseFloat(productoEncontrado.precio_venta), // Obtener el precio unitario del dataset del botón
  };
  ipcRenderer.send('agregar-producto-venta', producto);
  }
  
} else {
  const swalWithButtons = Swal.mixin({
    buttonsStyling: false,
    customClass: {
      confirmButton: 'btn btn-danger mx-2',
      cancelButton: 'btn btn-secondary',
    },
  });

  swalWithButtons.fire({
    icon: 'error',
    text: 'Debe seleccionar un código de barras válido',
    timer: 2000
  });
}
});

btnCancelarNombre.addEventListener('click', () => {
    inputBuscarNombre.value = '';
    selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';
});

btnCancelarCodigo.addEventListener('click', () => {
  inputBuscarCodigo.value = '';
});

// Obtener la fecha actual en el formato deseado
const now = new Date();
const fechaVenta = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

// Manejar la respuesta del evento agregar-producto-venta
ipcRenderer.on('producto-venta-agregado', (event, detalleVenta) => {
  // Limpiar campos
  inputBuscarNombre.value = '';
  selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';

  // Crear una nueva fila en la tabla
  const newRow = document.createElement('tr');
  newRow.classList.add('venta-row'); // Agregar la clase "venta-row" a la fila
  newRow.setAttribute('data-producto-id', detalleVenta.productoId);

  const productoId = detalleVenta.productoId
  productoIds[newRow] = productoId;

  // Verificar si las propiedades esperadas existen en detalleVenta
  if (detalleVenta.producto && detalleVenta.subtotal) {
    // Verificar si el producto ya existe en la venta actual
    const existingRow = document.querySelector(`[data-producto-id="${productoId}"]`);
    if (existingRow) {
      // El producto ya está en la venta, simplemente actualiza la cantidad
      const cantidadInput = existingRow.querySelector('input[type="number"]');
      const nuevaCantidad = parseFloat(cantidadInput.value) + detalleVenta.cantidad;
      cantidadInput.value = nuevaCantidad;

      // Calcula y actualiza el subtotal
      const precioUnitario = parseFloat(existingRow.querySelectorAll('td')[2].textContent);
      const subtotalCell = existingRow.querySelectorAll('td')[3];
      const nuevoSubtotal = nuevaCantidad * precioUnitario;
      subtotalCell.textContent = nuevoSubtotal.toFixed(2);

      // Actualiza el detalleVenta con la nueva cantidad y subtotal
      detalleVenta.cantidad = nuevaCantidad;
      detalleVenta.subtotal = nuevoSubtotal;
    } else {
      // El producto no está en la venta, crea una nueva fila en la tabla
      const newRow = document.createElement('tr');
      newRow.classList.add('venta-row');
      newRow.setAttribute('data-producto-id', productoId);

    // Crear las celdas para los datos del producto
    const nombreCell = document.createElement('td');
    nombreCell.textContent = detalleVenta.producto.nombre;

    const cantidadCell = document.createElement('td');
    const cantidadInput = document.createElement('input');
    cantidadInput.type = 'number';
    cantidadInput.value = detalleVenta.cantidad;
    cantidadInput.min = '1';
    cantidadInput.classList.add('form-control')
    cantidadInput.addEventListener('input', () => {
      const newCantidad = parseFloat(cantidadInput.value);
      const newSubtotal = newCantidad * detalleVenta.producto.precio_venta;
      subtotalCell.textContent = newSubtotal.toFixed(2);
      detalleVenta.cantidad = newCantidad;
      detalleVenta.subtotal = newSubtotal;
      ipcRenderer.send('actualizar-ventas');
      actualizarTotalVenta();
    });
    cantidadCell.appendChild(cantidadInput);

    const precioCell = document.createElement('td');
    precioCell.textContent = detalleVenta.producto.precio_venta;

    const subtotalCell = document.createElement('td');
    subtotalCell.textContent = detalleVenta.subtotal.toFixed(2);

    const accionesCell = document.createElement('td');
    const btnEliminar = document.createElement('button');
    btnEliminar.classList.add('btn-danger');
    btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
    btnEliminar.addEventListener('click', () => {
      newRow.remove();
      ipcRenderer.send('eliminar-producto-venta', detalleVenta);
      ipcRenderer.send('actualizar-ventas'); // Actualizar la tabla de ventas
      actualizarTotalVenta();
    });
    accionesCell.appendChild(btnEliminar);

    // Agregar las celdas a la fila
    newRow.appendChild(nombreCell);
    newRow.appendChild(cantidadCell);
    newRow.appendChild(precioCell);
    newRow.appendChild(subtotalCell);
    newRow.appendChild(accionesCell);

    // Agregar la fila a la tabla
    ventasTableBody.appendChild(newRow);
  }

    console.log('Producto agregado a la venta');

    // Actualizar la tabla de ventas
    ipcRenderer.send('actualizar-ventas');
    actualizarTotalVenta();

    // Obtener el total de la venta
    const totalVenta = parseFloat(totalVentaLabel.textContent);

    // Verificar si el total de la venta es válido
    if (isNaN(totalVenta)) {
      console.error('Error: el valor del total de la venta no es válido');
      return;
    }

    console.log(parseInt(detalleVenta.productoId));
    // Verificar si el ID del producto es válido
if (isNaN(detalleVenta.productoId)) {
  console.error('Error: el valor del ID del producto no es válido', detalleVenta.productoId);
  return;
}

// Asignar el valor del ID del producto a detalleVenta.productoId
detalleVenta.productoId = parseInt(productoIds[newRow]);

// Enviar detalleVentaJSON al proceso principal
try {
  const detalleVentaJSON = JSON.stringify(detalleVenta);
  JSON.parse(detalleVentaJSON); // Verificar si es un JSON válido
  ipcRenderer.send('agregar-venta', {
    fechaVenta: fechaVenta,
    detalleVenta: detalleVentaJSON,
  });
} catch (error) {
  console.error('Error al convertir detalleVenta a JSON:', error);
}
// Asignar el valor del total de la venta a detalleVenta.total
detalleVenta.total = totalVenta;

// Verificar si el ID del producto es válido
if (isNaN(detalleVenta.productoId)) {
  console.error('Error: el valor del ID del producto no es válido');
  return;
}
  }
});

function actualizarTotalVenta() {
  const rows = Array.from(ventasTableBody.querySelectorAll('.venta-row'));
  const ventas = rows.map((row) => {
    const cantidad = parseFloat(row.querySelector('input[type="number"]').value);
    const precioUnitario = parseFloat(row.querySelectorAll('td')[2].textContent);
    const subtotal = cantidad * precioUnitario;
    row.querySelectorAll('td')[3].textContent = subtotal.toFixed(2);
    return subtotal;
  });

  const totalVenta = ventas.reduce((total, subtotal) => total + subtotal, 0);
  totalVentaLabel.textContent = totalVenta.toFixed(2);
}

btnTerminar.addEventListener('click', async () => {
  // Obtener el total de la venta
  const totalVenta = parseFloat(totalVentaLabel.textContent);

  // Obtener los detalles de la venta
  const detallesVenta = obtenerDetalleVenta();

  // Verificar el stock de cada producto en la venta
  let stockSuficiente = true; // Cambiamos el valor inicial a true

  // Función para obtener la cantidad disponible en stock de forma asíncrona
  const obtenerCantidadDisponible = (productoId) => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('obtener-cantidad-disponible', productoId);

      ipcRenderer.on('cantidad-disponible', (event, cantidadDisponible) => {
        resolve(parseFloat(cantidadDisponible));
      });

      ipcRenderer.on('error-cantidad-disponible', (event, error) => {
        reject(error);
      });
    });
  };

  try {
    for (const detalle of detallesVenta) {
      if (detalle && detalle.productoId) {
        const cantidadDisponible = await obtenerCantidadDisponible(detalle.productoId);
        console.log('Cantidad Disponible: ' + cantidadDisponible);
        console.log('Cantidad a Vender: ' + detalle.cantidad);

        if (cantidadDisponible < detalle.cantidad) {
          stockSuficiente = false;
          console.log('Cantidad a Vender: ' + detalle.cantidad);
          console.log('Cantidad Disponible: ' + cantidadDisponible);
          break; // Si no hay suficiente stock para al menos un producto, sal del bucle
        }
      } else {
        console.error('Producto no definido en el detalle:', detalle);
        stockSuficiente = false;
        break;
      }
    }

    console.log(stockSuficiente);

    // Resto de tu lógica aquí...
  } catch (error) {
    console.error('Error al obtener la cantidad disponible en stock:', error.message);
    stockSuficiente = false;
  }

  // Si el total es mayor a cero y hay suficiente stock para todos los productos, proceder con la venta
  if (totalVenta > 0 && stockSuficiente) {
    const ventaData = {
      fechaVenta: new Date().toISOString().slice(0, 10),
      venta: {
        totalVenta: totalVenta,
        detallesVenta: detallesVenta
      }
    };

    ipcRenderer.send('guardar-venta', ventaData);

    // Abre la ventana para cobrar
    ipcRenderer.send('abrir-ventana-cambio', totalVenta);
  } else if (!stockSuficiente) {
    // Muestra un mensaje de error si no hay suficiente stock para algún producto
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });

    swalWithButtons.fire({
      icon: 'error',
      text: 'No hay suficiente stock disponible para la venta del producto',
      timer: 2000
    });
  } else {
    // Muestra un mensaje de error si no hay información sobre la venta
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });

    swalWithButtons.fire({
      icon: 'error',
      text: 'No hay información sobre la venta',
      timer: 2000
    });
  }
});


// Obtener una referencia al elemento "Salir"
const btnSalir = document.querySelector('.dropdown-item');

// Agregar un evento de clic al elemento "Salir"
btnSalir.addEventListener('click', () => {
  // Enviar un mensaje al proceso principal para cerrar sesión
  ipcRenderer.send('logout');
});

// Función para obtener el detalle de la venta en formato JSON
function obtenerDetalleVenta() {
  const rows = Array.from(ventasTableBody.querySelectorAll('.venta-row'));
  const detallesVenta = rows.map((row) => { // Corregido: Cambiar detalleVenta por detallesVenta
    const cantidad = parseFloat(row.querySelector('input[type="number"]').value);
    const precioUnitario = parseFloat(row.querySelectorAll('td')[2].textContent);
    const subtotal = cantidad * precioUnitario;
    //const productoId = productoIds[row]; // Obtener el ID del producto utilizando productoIds
    const productoId = parseInt(row.getAttribute('data-producto-id')); // Obtener el ID del producto desde el atributo de datos


     return {
       productoId: productoId,
       cantidad: cantidad,
       subtotal: subtotal,
     };
   });

  return detallesVenta; // Corregido: Cambiar detalleVenta por detallesVenta

  //
}