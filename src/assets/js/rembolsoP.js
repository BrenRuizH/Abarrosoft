const { ipcRenderer } = require('electron');
const productoIds = {}; // Objeto para mantener el seguimiento de los IDs de productos en las filas de venta

// Obtener referencias a los elementos del formulario
const inputBuscarCodigo = document.getElementById('input-buscar-codigo');
const inputBuscarNombre = document.getElementById('input-buscar-nombre');
const inputCantidadCodigo = document.getElementById('input-cantidad-codigo');
const inputCantidadNombre = document.getElementById('input-cantidad');
const selectProducto = document.getElementById('select-producto');
const textMotivoCodigo = document.getElementById('motivo-codigo');
const textMotivoNombre = document.getElementById('motivo-nombre');
const btnAgregarCodigo = document.getElementById('btn-agregar-codigo');
const btnCancelarCodigo = document.getElementById('btn-cancelar-codigo');
const btnAgregarNombre = document.getElementById('btn-agregar-nombre');
const btnCancelarNombre = document.getElementById('btn-cancelar-nombre');

// Nuevas referencias para los radio buttons
const radioCambiarCodigo = document.getElementById('radio-cambiar');
const radioVenderCodigo = document.getElementById('radio-vender');
const radioCambiarNombre = document.getElementById('radio-cambiar-nombre');
const radioVenderNombre = document.getElementById('radio-vender-nombre');

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

inputBuscarCodigo.addEventListener('input', (event) => {
  const valor = event.target.value;
  if (valor.trim() !== '') {
    ipcRenderer.send('buscar-productos-codigo', valor);
  }
});

let productoEncontrado = null; // Variable global para guardar la información del producto encontrado

ipcRenderer.on('productos-encontrados-codigo', (event, productos) => {
  // Guardar la información del primer producto encontrado (si existe) en la variable global
  if (productos.length > 0) {
    productoEncontrado = productos[0];
    const producto = {
      productoId: productoEncontrado.id,
      cantidad: parseFloat(cantidad),
      nombre: productoEncontrado.nombre, // Obtener el nombre del producto del dataset del botón
      precioUnitario: parseFloat(productoEncontrado.precio_compra), // Obtener el precio unitario del dataset del botón
    };
  }
});

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
  btnAgregarNombre.dataset.precioUnitario = productoData.precio_compra;
  btnAgregarNombre.dataset.idPro = productoData.id;
});

// Agregar evento de clic al botón de agregar
btnAgregarNombre.addEventListener('click', () => {
  const productoId = selectProducto.value; // Obtener el ID del producto del select
  const cantidad = parseFloat(inputCantidadNombre.value);

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

  const producto = {
    productoId: parseInt(productoId),
    cantidad: parseFloat(cantidad),
    nombre: btnAgregarNombre.dataset.nombre, // Obtener el nombre del producto del dataset del botón
    precioUnitario: parseFloat(btnAgregarNombre.dataset.precioUnitario), // Obtener el precio unitario del dataset del botón
    motivo: textMotivoNombre.value
  };

  const total = producto.cantidad * producto.precioUnitario;

  if(radioCambiarNombre.checked) {
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-success mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });
    swalWithButtons.fire({
        icon: 'success',
        text: 'Cambio Realizado',
        timer: 2000
      }).then(() => {
        ipcRenderer.send('guardar-cambio-proveedores', producto);
        ipcRenderer.send('actualizar-ventana');
      });
  } else if(radioVenderNombre.checked) {
    ipcRenderer.send('guardar-devolucion-proveedores', producto);
    ipcRenderer.send('abrir-ventana-devolver-proveedores', total);
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
        text: 'Debe seleccionar una acción: "Cambiar Producto" o "Devolver Dinero"',
        timer: 2000
      });
  }
});

btnAgregarCodigo.addEventListener('click', () => {
  if(productoEncontrado) {
    const cantidad = parseFloat(inputCantidadCodigo.value);

    const producto = {
      productoId: productoEncontrado.id,
      cantidad: parseFloat(cantidad),
      nombre: productoEncontrado.nombre, // Obtener el nombre del producto del dataset del botón
      precioUnitario: parseFloat(productoEncontrado.precio_compra), // Obtener el precio unitario del dataset del botón
      motivo: textMotivoCodigo.value
    };

    const total = producto.cantidad * producto.precioUnitario;

    if(radioCambiarCodigo.checked) {
      const swalWithButtons = Swal.mixin({
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-success mx-2',
          cancelButton: 'btn btn-secondary',
        },
      });
      
      swalWithButtons.fire({
          icon: 'success',
          text: 'Cambio Realizado',
          timer: 2000
      }).then(() => {
        ipcRenderer.send('guardar-cambio-proveedores', producto);
        ipcRenderer.send('actualizar-ventana');
      });
    } else if(radioVenderCodigo.checked) {
      ipcRenderer.send('guardar-devolucion-proveedores', producto);
      ipcRenderer.send('abrir-ventana-devolver', total);
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
        text: 'Debe seleccionar una acción: "Cambiar Producto" o "Devolver Dinero"',
        timer: 2000
      });
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
    textMotivoNombre.value = '';
    inputCantidadNombre.value = '';
    // Limpiar los radio buttons
    radioCambiarNombre.checked = false;
    radioVenderNombre.checked = false;
});

btnCancelarCodigo.addEventListener('click', () => {
  inputBuscarCodigo.value = '';
  textMotivoCodigo.value = '';
  inputCantidadCodigo.value = '';
  // Limpiar los radio buttons
  radioCambiarCodigo.checked = false;
  radioVenderCodigo.checked = false;
});

// Obtener una referencia al elemento "Salir"
const btnSalir = document.querySelector('.dropdown-item');

// Agregar un evento de clic al elemento "Salir"
btnSalir.addEventListener('click', () => {
  // Enviar un mensaje al proceso principal para cerrar sesión
  ipcRenderer.send('logout');
});

