const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  // Obtener referencias a los elementos del formulario
  const selectTemporalidad = document.getElementById('select-temporalidad');
  const inputFechaInicio = document.getElementById('input-fecha-inicio');
  const inputFechaFin = document.getElementById('input-fecha-fin');
  const btnGenerar = document.getElementById('btn-generar');

  const labelGanancias = document.getElementById('ganancia');
  const labelIngresos = document.getElementById('ingresos');
  const labelEgresos = document.getElementById('egresos');
  const labelVentas = document.getElementById('ventas-card');
  const labelProductos = document.getElementById('productos');

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

    // Obtener los ingresos según las fechas proporcionadas
    ipcRenderer.send('get-ingresos', fechaInicio, fechaFin);
    ipcRenderer.send('get-egresos', fechaInicio, fechaFin);
    ipcRenderer.send('get-ventas', fechaInicio, fechaFin);
    ipcRenderer.send('get-productos', fechaInicio, fechaFin);
    ipcRenderer.send('get-historial', fechaInicio, fechaFin);
    ipcRenderer.send('get-top', fechaInicio, fechaFin);
    ipcRenderer.send('get-menos', fechaInicio, fechaFin);
  });

  // Escuchar el evento 'ingresos-loaded' desde el proceso de renderizado
  ipcRenderer.on('ingresos-loaded', (event, ingresos) => {
    // Mostrar los ingresos en el label de ingresos
    labelIngresos.textContent = ingresos;
    calcularGanancias()
  });

  // Escuchar el evento 'ingresos-loaded' desde el proceso de renderizado
  ipcRenderer.on('egresos-loaded', (event, egresos) => {
    // Mostrar los ingresos en el label de ingresos
    labelEgresos.textContent = egresos;
    calcularGanancias()
  });

  // Escuchar el evento 'ingresos-loaded' desde el proceso de renderizado
  ipcRenderer.on('ventas-loaded', (event, ventas) => {
    // Mostrar los ingresos en el label de ingresos
    labelVentas.textContent = ventas;
    calcularGanancias()
  });

  // Escuchar el evento 'ingresos-loaded' desde el proceso de renderizado
  ipcRenderer.on('productos-loaded', (event, productos) => {
    // Mostrar los ingresos en el label de ingresos
    labelProductos.textContent = productos;
    calcularGanancias()
  });

// Manejar la respuesta del proceso principal con el historial cargado
ipcRenderer.on('historial-loaded', (event, historial) => {
  // Obtener el tbody de la tabla de historial
  const tbody = document.querySelector('#tabla-historial tbody');

  // Vaciar el contenido actual de la tabla
  tbody.innerHTML = '';

  // Iterar sobre los registros del historial y agregar filas a la tabla
  historial.forEach((registro) => {
    const fila = document.createElement('tr');

    const fechaColumna = document.createElement('td');
    fechaColumna.textContent = registro.fecha;
    fila.appendChild(fechaColumna);

    const horaColumna = document.createElement('td');
    horaColumna.textContent = registro.hora;
    fila.appendChild(horaColumna);

    const eventoColumna = document.createElement('td');
    eventoColumna.textContent = registro.evento;
    fila.appendChild(eventoColumna);

    const totalColumna = document.createElement('td');
    totalColumna.textContent = registro.total;
    fila.appendChild(totalColumna);

    tbody.appendChild(fila);
  });
});

// Manejar la respuesta del proceso principal con el historial cargado
ipcRenderer.on('top-loaded', (event, top) => {
  // Obtener el tbody de la tabla de historial
  const tbody = document.querySelector('#tabla-productos-top tbody');

  // Vaciar el contenido actual de la tabla
  tbody.innerHTML = '';

  // Iterar sobre los registros del historial y agregar filas a la tabla
  top.forEach((registro) => {
    const fila = document.createElement('tr');

    const nombreColumna = document.createElement('td');
    nombreColumna.textContent = registro.nombre;
    fila.appendChild(nombreColumna);

    const piezasColumna = document.createElement('td');
    piezasColumna.textContent = registro.total_vendido;
    fila.appendChild(piezasColumna);

    const unidadColumna = document.createElement('td');
    unidadColumna.textContent = '$'+registro.precio_venta;
    fila.appendChild(unidadColumna);

    tbody.appendChild(fila);
  });
});

// Manejar la respuesta del proceso principal con el historial cargado
ipcRenderer.on('menos-loaded', (event, menos) => {
  // Obtener el tbody de la tabla de historial
  const tbody = document.querySelector('#tabla-productos-menos tbody');

  // Vaciar el contenido actual de la tabla
  tbody.innerHTML = '';

  // Iterar sobre los registros del historial y agregar filas a la tabla
  menos.forEach((registro) => {
    const fila = document.createElement('tr');

    const nombreColumna = document.createElement('td');
    nombreColumna.textContent = registro.nombre;
    fila.appendChild(nombreColumna);

    const piezasColumna = document.createElement('td');
    piezasColumna.textContent = registro.total_vendido;
    fila.appendChild(piezasColumna);

    const unidadColumna = document.createElement('td');
    unidadColumna.textContent = '$'+registro.precio_venta;
    fila.appendChild(unidadColumna);

    tbody.appendChild(fila);
  });
});
  // Función para calcular las ganancias
  function calcularGanancias() {
    const ingresos = parseFloat(labelIngresos.textContent);
    const egresos = parseFloat(labelEgresos.textContent);
    const ganancias = ingresos - egresos;
    // Mostrar las ganancias en el label de ganancias
    labelGanancias.textContent = ganancias;
  }
});
