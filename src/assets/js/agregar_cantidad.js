const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('agregar-cantidad-form');
  const cantidadInput = document.getElementById('cantidad-input');
  const cancelarButton = document.getElementById('cancelar-button');
  const productoIdInput = document.getElementById('producto-id-input');

  // Obtener el ID del producto de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const productoId = urlParams.get('productoId');

  // Asignar el ID del producto al campo oculto
  productoIdInput.value = productoId;
  
  // Escuchar el evento de envío del formulario
  console.log(productoId);
  formulario.addEventListener('submit', (event) => {
    event.preventDefault();
    const cantidad = parseFloat(cantidadInput.value);
    if (cantidad > 0) {
      ipcRenderer.send('agregar-cantidad', { cantidad, productoId });
      ipcRenderer.once('cantidad-agregada', () => {
        Swal.fire({
          icon: 'success',
          title: 'Stock agregado',
          text: 'El stock se ha actualizado correctamente.',
          showConfirmButton: false,
          timer: 2000, // Duración en milisegundos (3 segundos en este caso)
          timerProgressBar: true, // Muestra una barra de progreso durante la duración
        }).then(() => {
          const mainWindowId = ipcRenderer.sendSync('get-main-window-id');
          ipcRenderer.send('actualizar-ventana-principal', mainWindowId);
          window.close();
      });
    })
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
      text: 'Introduce una cantidad de stock válida',
      timer: 2000
    });
  }
  });
  // Escuchar el evento de cancelar
  cancelarButton.addEventListener('click', () => {
    window.close();
  });
});
