const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  // Obtener referencias a los elementos del formulario
  const selectTemporalidad = document.getElementById('select-temporalidad');
  const inputFechaInicio = document.getElementById('input-fecha-inicio');
  const inputFechaFin = document.getElementById('input-fecha-fin');

  const labelTotales = document.getElementById('total-ventas');
  const btnGenerar = document.getElementById('btn-generar');


  const btnSalir = document.querySelector('.dropdown-item');

  // Agregar un evento de clic al elemento "Salir"
  btnSalir.addEventListener('click', () => {
    // Enviar un mensaje al proceso principal para cerrar sesión
    ipcRenderer.send('logout');
  });

  // Configurar evento de cambio en el select de temporalidad
  selectTemporalidad.addEventListener('change', () => {

    const temporalidad = selectTemporalidad.value;

    // Deshabilitar los inputs de fecha por defecto
    inputFechaInicio.disabled = true;
    inputFechaFin.disabled = true;

    // Configurar fechas según la temporalidad seleccionada
    const now = new Date();
    let fechaInicio, fechaFin;

    switch (temporalidad) {
      case 'hoy':
        fechaInicio = now;
        fechaFin = now;
        break;
      case 'semana':
        fechaInicio = getFirstDayOfWeek(now);
        fechaFin = getLastDayOfWeek(now);
        break;
      case 'mes':
        fechaInicio = getFirstDayOfMonth(now);
        fechaFin = getLastDayOfMonth(now);
        break;
      case 'mes-anterior':
        fechaInicio = getFirstDayOfPreviousMonth(now);
        fechaFin = getLastDayOfPreviousMonth(now);
        break;
      case 'primera-quincena':
        fechaInicio = getFirstDayOfMonth(now);
        fechaFin = new Date(now.getFullYear(), now.getMonth(), 15);
        break;
      case 'segunda-quincena':
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), 16);
        fechaFin = getLastDayOfMonth(now);
        break;
      case 'personalizado':
        // Habilitar los inputs de fecha para personalizado
        inputFechaInicio.disabled = false;
        inputFechaFin.disabled = false;
        return; // Salir de la función ya que la selección es personalizada
    }

    // Formatear fechas en formato YYYY-MM-DD
    const formattedFechaInicio = formatDate(fechaInicio);
    const formattedFechaFin = formatDate(fechaFin);

    // Asignar fechas a los inputs
    inputFechaInicio.value = formattedFechaInicio;
    inputFechaFin.value = formattedFechaFin;
  });

  // Función para obtener el primer día de la semana
  function getFirstDayOfWeek(date) {
    const firstDayOfWeek = new Date(date);
    firstDayOfWeek.setDate(date.getDate() - date.getDay());
    return firstDayOfWeek;
  }

  function getLastDayOfWeek(date) {
    const lastDayOfWeek = new Date(date);
    lastDayOfWeek.setDate(date.getDate() - date.getDay() + 6); // Sumar 6 días para llegar al final de la semana
    return lastDayOfWeek;
  }

  // Función para obtener el primer día del mes
  function getFirstDayOfMonth(date) {
    const firstDayOfMonth = new Date(date);
    firstDayOfMonth.setDate(1);
    return firstDayOfMonth;
  }

  // Función para obtener el primer día del mes anterior
  function getFirstDayOfPreviousMonth(date) {
    const firstDayOfPreviousMonth = new Date(date);
    firstDayOfPreviousMonth.setMonth(date.getMonth() - 1);
    firstDayOfPreviousMonth.setDate(1);
    return firstDayOfPreviousMonth;
  }

  // Función para obtener el último día del mes
  function getLastDayOfMonth(date) {
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return lastDayOfMonth;
  }

  // Función para obtener el último día del mes anterior
  function getLastDayOfPreviousMonth(date) {
    const lastDayOfPreviousMonth = new Date(date);
    lastDayOfPreviousMonth.setDate(0);
    return lastDayOfPreviousMonth;
  }

  // Función para formatear una fecha en formato YYYY-MM-DD
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Configurar evento de clic en el botón "Generar"
  btnGenerar.addEventListener('click', () => {
    const temporalidad = selectTemporalidad.value;
    const fechaInicio = inputFechaInicio.value;
    const fechaFin = inputFechaFin.value;

    ipcRenderer.send('get-all-ventas', fechaInicio, fechaFin);
    ipcRenderer.send('get-total-ventas', fechaInicio, fechaFin);
  });

  // Manejar la respuesta del proceso principal con el historial cargado
ipcRenderer.on('all-ventas-loaded', (event, ventas) => {
  // Obtener el tbody de la tabla de historial
  const tbody = document.querySelector('#tabla-ventas tbody');

  // Vaciar el contenido actual de la tabla
  tbody.innerHTML = '';

  // Iterar sobre los registros del historial y agregar filas a la tabla
  ventas.forEach((registro) => {
    const fila = document.createElement('tr');

    const idColumna = document.createElement('td');
    idColumna.textContent = registro.id_venta;
    fila.appendChild(idColumna);

    const fechaVendedor = document.createElement('td');
    fechaVendedor.textContent = registro.nombre_usuario;
    fila.appendChild(fechaVendedor);

    const fechaColumna = document.createElement('td');
    fechaColumna.textContent = registro.fecha;
    fila.appendChild(fechaColumna);

    const horaColumna = document.createElement('td');
    horaColumna.textContent = registro.hora;
    fila.appendChild(horaColumna);

    const productoColumna = document.createElement('td');
    productoColumna.textContent = registro.producto;
    fila.appendChild(productoColumna);

    const precioColumna = document.createElement('td');
    const precio = registro.precio.toFixed(2);
    precioColumna.textContent = '$'+precio;
    fila.appendChild(precioColumna);

    const cantidadColumna = document.createElement('td');
    cantidadColumna.textContent = registro.cantidad+' '+registro.unidad;
    fila.appendChild(cantidadColumna);

    const subtotalColumna = document.createElement('td');
    const subtotal = registro.subtotal.toFixed(2);
    subtotalColumna.textContent = '$'+subtotal;
    fila.appendChild(subtotalColumna);

    const eventoColumna = document.createElement('td');
    const total = registro.total_venta.toFixed(2);
    eventoColumna.textContent = '$'+total;
    fila.appendChild(eventoColumna);

    tbody.appendChild(fila);
  });

// Escuchar el evento 'ingresos-loaded' desde el proceso de renderizado
ipcRenderer.on('totales-loaded', (event, totales) => {
  // Mostrar los ingresos en el label de ingresos
  const tot = totales.toFixed(2);
  labelTotales.textContent = 'TOTAL VENTAS: $'+tot;
});

});
});
