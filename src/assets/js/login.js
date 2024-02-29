const { ipcRenderer } = require('electron');
const Swal = require('sweetalert2');

// Llamar a esta función cuando la página se cargue
document.addEventListener('DOMContentLoaded', function () {
  obtenerListaUsuarios();
});

ipcRenderer.on('lista-usuarios', (event, usuarios) => {
  const userSelect = document.getElementById('userSelect');
  userSelect.innerHTML = ''; // Limpiar el select antes de llenarlo

  usuarios.forEach((usuario) => {
      const option = document.createElement('option');
      option.textContent = usuario.nombreU; // Suponiendo que tienes un campo 'nombreU' en tu tabla de usuarios
      option.value = usuario.id; // Suponiendo que tienes un campo 'id' que representa el valor del usuario
      userSelect.appendChild(option);
  });
});

// Llamar a esta función para solicitar la lista de usuarios
function obtenerListaUsuarios() {
  ipcRenderer.send('obtener-lista-usuarios');
}
// Manejar el evento 'login-success' en el proceso de renderizado
ipcRenderer.on('login-success', (event, usuarioId) => {

  obtenerDetallesUsuario(usuarioId);
});

// Manejar el evento 'login-error' en el proceso de renderizado
ipcRenderer.on('login-error', (event, errorMessage) => {
  Swal.fire({
    icon: 'error',
    title: 'Error de inicio de sesión',
    text: errorMessage,
  });
});

// Función para obtener los detalles del usuario
function obtenerDetallesUsuario(usuarioId) {
  ipcRenderer.send('obtener-detalles-usuario', usuarioId);
}

function login() {
  const username = document.getElementById('userSelect').value;
  const password = document.getElementById('password').value;

  ipcRenderer.send('login', { username, password });
}