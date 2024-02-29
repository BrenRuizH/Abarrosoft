const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', function() {
  const devolucionLabel = document.getElementById('devolucion');
  const btnDevolvar = document.getElementById('btn-devolver');

  // Obtener el valor de totalVenta de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const total = parseFloat(urlParams.get('total'));
  const rol = urlParams.get('rol');

  // Asignar el valor de totalVenta a la etiqueta totalVentaLabel
  devolucionLabel.textContent = total.toFixed(2);

  // Escuchar el evento de clic en el botón de cobrar
  btnDevolvar.addEventListener('click', () => {

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
        ipcRenderer.send('actualizar-ventana-rembolso', mainWindowId, rol);
        window.close();
      });
  });
});
