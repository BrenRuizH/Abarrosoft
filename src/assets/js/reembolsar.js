const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', function() {
  const devolucionLabel = document.getElementById('devolucion');
  const btnDevolvar = document.getElementById('btn-devolver');
  const inputPago = document.getElementById('input-pago');
  const cambioLabel = document.getElementById('cambio');

  // Obtener el valor de totalVenta de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const total = parseFloat(urlParams.get('total'));
  const rol = urlParams.get('rol');

  
  // Asignar el valor de totalVenta a la etiqueta totalVentaLabel
  devolucionLabel.textContent = total.toFixed(2);

  // Escuchar el evento de entrada en el campo de pago
  inputPago.addEventListener('input', () => {
    const pago = parseFloat(inputPago.value);
    const cambio = pago - total;

    // Actualizar el valor del cambio en la etiqueta
    cambioLabel.textContent = cambio.toFixed(2);
  });

  // Escuchar el evento de clic en el botón de cobrar
  btnDevolvar.addEventListener('click', () => {
    const pago = parseFloat(inputPago.value);
    const cambio = pago - total;

    if (pago >= total) {
      const swalWithButtons = Swal.mixin({
        buttonsStyling: false,
        customClass: {
          confirmButton: 'btn btn-success mx-2',
          cancelButton: 'btn btn-secondary',
        },
      });

      swalWithButtons.fire({
        icon: 'success',
        text: 'Reembolso Realizado',
        timer: 2000
      }).then(() => {
        const mainWindowId = ipcRenderer.sendSync('get-main-window-id');
        ipcRenderer.send('actualizar-ventana-proveedores', mainWindowId, rol);
        window.close();
      });
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
        text: 'Dinero Insuficiente',
        timer: 2000
      });
    }
  });
});
