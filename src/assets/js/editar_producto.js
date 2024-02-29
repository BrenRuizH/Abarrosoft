const { ipcRenderer } = require('electron');

// En la página de edición de productos
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const idProducto = urlParams.get('id');

// Esperar a que el DOM se cargue completamente
document.addEventListener('DOMContentLoaded', () => {

  const formulario = document.getElementById('editar-producto-form');
  const cancelarButton = document.getElementById('cancelar-button');
  const unidadVentaSelect = document.getElementById('unidadVenta');
  const cantidadInput = document.getElementById('cantidad');
  const nombreInput = document.getElementById('nombre');
  const precioCompraInput = document.getElementById('precio_compra');
  const precioVentaInput = document.getElementById('precio_venta');
  const codigoBarrasInput = document.getElementById('codigo_barras');
  
  // Enviar mensaje al proceso principal para obtener los datos del producto correspondiente
  ipcRenderer.send('obtener-producto', idProducto);

  // Escuchar el evento de cancelar
  cancelarButton.addEventListener('click', () => {
    const mainWindowId = ipcRenderer.sendSync('get-main-window-id');
    ipcRenderer.send('actualizar-ventana-principal', mainWindowId);
    window.close();
  });

  // Escuchar el evento de envío del formulario
  formulario.addEventListener('submit', (event) => {
    event.preventDefault();
    // Validar la unidad de venta seleccionada y habilitar/deshabilitar la entrada de decimales en cantidad
    const selectedOption = unidadVentaSelect.value;

    if (selectedOption === 'piezas') {
      cantidadInput.setAttribute('step', '1');
      cantidadInput.value = Math.floor(parseFloat(cantidadInput.value)); // Redondear a un número entero
    } else if (selectedOption === 'kilos') {
      cantidadInput.removeAttribute('step');
      cantidadInput.value = parseFloat(cantidadInput.value); // Permitir decimales
    }
    
    // Validar que todos los campos estén llenos
    if (
      nombreInput.value &&
      precioCompraInput.value &&
      precioVentaInput.value &&
      unidadVentaSelect.value &&
      cantidadInput.value &&
      codigoBarrasInput.value
    ) {
      const producto = {
        id: idProducto,
        nombre: nombreInput.value,
        precio_compra: parseFloat(precioCompraInput.value),
        precio_venta: parseFloat(precioVentaInput.value),
        unidad_venta: unidadVentaSelect.value,
        cantidad: parseFloat(cantidadInput.value),
        codigo_barras: codigoBarrasInput.value,
        // Repetir para los demás campos
      };

      // Enviar mensaje al proceso principal para actualizar el producto
      ipcRenderer.send('editar-producto', producto);
      console.log(producto);
    } else {
      // Mostrar un mensaje de error si algún campo está vacío
      Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos antes de enviar el formulario.',
      });
    }
  });

  // Escuchar el evento de respuesta del proceso principal con los datos del producto
  ipcRenderer.on('producto-encontrado', (event, productoJSON) => {
    console.log('Valor de productoId en la página de edición:', idProducto);
    console.log('Evento producto-encontrado disparado');
    console.log('Valor de productoJSON en el evento producto-encontrado:', productoJSON); // Agregar esta línea
    try {
      const producto = JSON.parse(productoJSON); // Analizar la cadena JSON para convertirla en un objeto
      console.log('Producto obtenido del proceso principal:', producto);
      console.log(productoJSON);
      console.log('cantidad', producto.cantidad);
      console.log('unidad', producto.unidad_venta);

      // Asignar los valores del producto a los inputs ocultos
      id = idProducto
      console.log(id);
      nombreInput.value = producto.nombre;
      console.log(nombreInput.value);
      precioCompraInput.value = producto.precio_compra;
      console.log(precioCompraInput.value)
      precioVentaInput.value = producto.precio_venta;
      console.log(precioVentaInput.value)
      unidadVentaSelect.value = producto.unidad_venta;
      console.log(unidadVentaSelect.value)
      cantidadInput.value = producto.cantidad;
      console.log(cantidadInput.value)
      codigoBarrasInput.value = producto.codigo_barras;
      console.log(codigoBarrasInput.value)
      

      console.log('cantidad', producto.cantidad);
      console.log('unidad', producto.unidad_venta);
    } catch (e) {
      console.error('Error al analizar la cadena JSON:', e.message);
    }
  });

  // Escuchar el evento de producto editado
  ipcRenderer.on('producto-editado', () => {
    Swal.fire({
      icon: 'success',
      title: 'Producto modificado',
      text: 'El producto se ha actualizado correctamente.',
      showConfirmButton: false,
      timer: 2000, // Duración en milisegundos (3 segundos en este caso)
      timerProgressBar: true, // Muestra una barra de progreso durante la duración
    }).then(() => {
      const mainWindowId = ipcRenderer.sendSync('get-main-window-id');
      ipcRenderer.send('actualizar-ventana-principal', mainWindowId);
      window.close();
    });
  });
});
