const { ipcRenderer } = require('electron');
const Swal = require('sweetalert2');

// Obtener el ID de la ventana principal desde la URL
const urlParams = new URLSearchParams(window.location.search);
const mainWindowId = urlParams.get('mainWindowId');

const formulario = document.getElementById('agregar-producto-form');
const cancelarButton = document.getElementById('cancelar-button');

// Escuchar el evento de cancelar
cancelarButton.addEventListener('click', () => {
  //window.location.href = 'productos.html';
  window.close();
});

// Escuchar el evento de envío del formulario
formulario.addEventListener('submit', (event) => {
  event.preventDefault();

  const codigoBarrasInput = document.getElementById('codigoBarras');
  const codigoBarras = codigoBarrasInput.value;

  // Verificar si ya existe un producto con el mismo código de barras
  ipcRenderer.send('verificar-codigo-barras', codigoBarras);
});

// Escuchar el evento de respuesta de verificación del código de barras
ipcRenderer.on('codigo-barras-verificado', (event, existeProducto) => {
  if (existeProducto) {
    const swalWithButtons = Swal.mixin({
      buttonsStyling: false,
      customClass: {
        confirmButton: 'btn btn-danger mx-2',
        cancelButton: 'btn btn-secondary',
      },
    });
    swalWithButtons.fire({
      icon: 'error',
      text: 'Ya existe un producto con ese código de barras',
      timer: 2000
    });
  } else {
    const nombreInput = document.getElementById('nombre');
    const precioCompraInput = document.getElementById('precioCompra');
    const precioVentaInput = document.getElementById('precioVenta');
    const unidadVentaSelect = document.getElementById('unidadVenta');
    const cantidadInput = document.getElementById('cantidad');
    const fechaCompraInput = document.getElementById('fechaCompra');
    const codigoBarrasInput = document.getElementById('codigoBarras');
    
    // Validar que todos los campos estén llenos
    if (
      nombreInput.value &&
      precioCompraInput.value &&
      precioVentaInput.value &&
      unidadVentaSelect.value &&
      cantidadInput.value &&
      codigoBarrasInput.value &&
      fechaCompraInput.value
    ){  
      const producto = {
        nombre: nombreInput.value,
        precio_compra: parseFloat(precioCompraInput.value),
        precio_venta: parseFloat(precioVentaInput.value),
        unidad_venta: unidadVentaSelect.value,
        cantidad: parseFloat(cantidadInput.value),
        fecha_compra: fechaCompraInput.value,
        codigo_barras: codigoBarrasInput.value,
      };
      
      if (unidadVentaSelect.value === 'piezas') {
        // Verificar si se ingresaron decimales y mostrar una alerta
        if (cantidadInput.value % 1 !== 0 || cantidadInput.value < 0) {
          Swal.fire({
            icon: 'error',
            title: 'Cantidad incongruente',
            text: 'Para piezas ingresa solamente números enteros y positivos',
            showConfirmButton: false,
            timer: 2000, // Duración en milisegundos (3 segundos en este caso)
            timerProgressBar: true, // Muestra una barra de progreso durante la duración
          })
        } else {
          ipcRenderer.send('agregar-producto', producto); // Enviar mensaje al proceso principal para guardar el producto
          console.log('Evento de agregar producto enviado:', producto);
        }
      } else if (unidadVentaSelect.value === 'kilos') {
        if ( cantidadInput.value < 0) {
          Swal.fire({
            icon: 'error',
            title: 'Cantidad incongruente',
            text: 'Para kilos ingresa solamente números positivos',
            showConfirmButton: false,
            timer: 2000, // Duración en milisegundos (3 segundos en este caso)
            timerProgressBar: true, // Muestra una barra de progreso durante la duración
          })
        } else {
          ipcRenderer.send('agregar-producto', producto); // Enviar mensaje al proceso principal para guardar el producto
          console.log('Evento de agregar producto enviado:', producto);
        }
      }
    } else {
      // Mostrar un mensaje de error si algún campo está vacío
        Swal.fire({
          icon: 'error',
          title: 'Campos incompletos',
          text: 'Por favor, completa todos los campos antes de enviar el formulario.',
        });
      }
    }
});


// Escuchar el evento de producto agregado
ipcRenderer.on('producto-agregado', () => {
  Swal.fire({
    icon: 'success',
    title: 'Producto agregado',
    text: 'El producto se ha agregado correctamente.',
    showConfirmButton: false,
    timer: 2000, // Duración en milisegundos (3 segundos en este caso)
    timerProgressBar: true, // Muestra una barra de progreso durante la duración
  }).then(() => {
    const mainWindowId = ipcRenderer.sendSync('get-main-window-id');
    ipcRenderer.send('actualizar-ventana-principal', mainWindowId);
    window.close();
  });
});
