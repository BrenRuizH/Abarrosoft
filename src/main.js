const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const url = require('url');
const mysql = require('mysql');
const moment = require('moment');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let dbConnection;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'views/login.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  // Ocultar la barra de herramientas
  mainWindow.setMenuBarVisibility(false);
  
  mainWindow.on('closed', function () {
    app.quit();
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Conectarse a la base de datos
dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'db_abarrosoft'
});

dbConnection.connect((err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  }
});

ipcMain.on('get-main-window-id', (event) => {
  event.returnValue = mainWindow.id; // Enviar el ID de la ventana principal como respuesta
});

ipcMain.on('obtener-lista-usuarios', (event) => {
  const query = 'SELECT id, nombreU FROM usuarios'; // Ajusta la consulta según tu esquema de base de datos

  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener la lista de usuarios:', err.message);
      event.sender.send('lista-usuarios', []);
    } else {
      event.sender.send('lista-usuarios', results);
    }
  });
});

// Manejar el evento de inicio de sesión
ipcMain.on('login', (event, { username, password }) => {
  const query = 'SELECT * FROM usuarios WHERE id = ? AND contrasena = ?';
  //const query = 'SELECT * FROM usuarios WHERE user = ? AND contrasena = ? AND rol = "admin"';

  dbConnection.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Error al realizar la consulta:', err.message);
    } else {
      if (results.length > 0) {
        // Las credenciales son válidas
        const usuarioId = results[0].id;
        const usuario = results[0];
        const rol = usuario.rol;

        store.set('rol', rol);
        store.set('id', usuarioId);
        
        const query = 'CALL iniciar_sesion(?)';
  
        dbConnection.query(query, [usuarioId], (err, results) => {
          if (err) {
            console.error('Error al eliminar el producto:', err.message);
            event.sender.send('producto-error', 'Error al eliminar el producto');
          }});

        const queryName = 'SELECT nombreU FROM usuarios WHERE id = ?';
        dbConnection.query(queryName, [usuarioId], (err, results) => {
          if (err) {
            console.error('Error al obtener el nombre de usuario:', err.message);
            return;
          }

          if (results.length > 0) {
            const nombreUsuario = results[0].nombreU;
            console.log(nombreUsuario);

            // Enviar el nombre de usuario al proceso de renderizado
            event.sender.send('set-username', nombreUsuario);
          }
        });


          if(rol === 'admin'){
            // Enviar el ID de usuario al proceso de renderizado
            event.sender.send('login-success', usuarioId, rol);

            mainWindow.loadURL(
              url.format({
                pathname: path.join(__dirname, 'admin/dashboard.html'),
                protocol: 'file:',
                slashes: true,
              })
            );
          } 
          if(rol === 'gerente'){
            // Enviar el ID de usuario al proceso de renderizado
            event.sender.send('login-success', usuarioId, rol);

            mainWindow.loadURL(
              url.format({
                pathname: path.join(__dirname, 'gerente/inventario.html'),
                protocol: 'file:',
                slashes: true,
              })
          );
          }
          if(usuarioId === 3){
            // Enviar el ID de usuario al proceso de renderizado
            event.sender.send('login-success', usuarioId, rol);

            mainWindow.loadURL(
              url.format({
                pathname: path.join(__dirname, 'cajeroV/ventas.html'),
                protocol: 'file:',
                slashes: true,
              })
            );
          }
          if(usuarioId === 4){
            // Enviar el ID de usuario al proceso de renderizado
            event.sender.send('login-success', usuarioId, rol);

            mainWindow.loadURL(
              url.format({
                pathname: path.join(__dirname, 'cajeroA/ventas.html'),
                protocol: 'file:',
                slashes: true,
              })
            );
          }
        } else {
          event.sender.send('login-error', 'Credenciales inválidas');
        }
      };
    });
  });

  ipcMain.on('obtener-cantidad-disponible', (event, productoId) => {
    try {
      const query = `SELECT cantidad FROM productos WHERE id = ?`;
      dbConnection.query(query, [productoId], (error, results) => {
        if (error) {
          console.error('Error al obtener la cantidad disponible en stock:', error.message);
          throw error;
        }
  
        if (results.length > 0) {
          const cantidadDisponible = results[0].cantidad;
          console.log('Cantidad disponible en stock:', cantidadDisponible);
          event.reply('cantidad-disponible', cantidadDisponible); // Responde con la cantidad disponible
        } else {
          console.log('El producto no se encontró en la base de datos, asumiendo que no hay stock.');
          event.reply('cantidad-disponible', 0); // Responde con 0 si no se encuentra el producto
        }
      });
    } catch (error) {
      console.error('Error al obtener la cantidad disponible en stock:', error.message);
      throw error;
    }
  });
  


  ipcMain.on('open-productos-form', (event, productoId) => {
    const rol = store.get('rol');
    
    if (productoId) {
      // Editar producto existente
      const query = 'SELECT * FROM productos WHERE id = ?';
      // Obtener el rol del almacenamiento local
      

      dbConnection.query(query, [productoId], (err, results) => {
        if (err) {
          console.error('Error al obtener el producto:', err.message);
          event.reply('producto-error', 'Error al obtener el producto');
        } else {
          if (results.length > 0) {
            const producto = results[0];
            const productoJSON = JSON.stringify(producto);
            const ventanaEditar = new BrowserWindow({
              width: 500,
              height: 700,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
              },
            });
            if( rol === 'gerente') {
            ventanaEditar.loadURL(`file://${__dirname}/gerente/editar_producto.html?id=${productoId}`);
            }
            if( rol === 'admin') {
              ventanaEditar.loadURL(`file://${__dirname}/admin/editar_producto.html?id=${productoId}`);
              }
          } else {
            event.reply('producto-error', 'No se encontró el producto');
          }
        }
      });
    }
    else {
      const ventanaAgregar = new BrowserWindow({
        width: 500,
        height: 700,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
        },
      });
      if( rol === 'gerente') {
      ventanaAgregar.loadURL(`file://${__dirname}/gerente/agregar_producto.html`);
      }
      if( rol === 'admin') {
        ventanaAgregar.loadURL(`file://${__dirname}/admin/agregar_producto.html`);
      }
    }
  });
  
  ipcMain.on('actualizar-ventana-principal', (event, mainWindowId) => {
    // Buscar la ventana principal por su ID
    const mainWindow = BrowserWindow.fromId(parseInt(mainWindowId));
    const rol = store.get('rol');

    if (mainWindow) {
      if (rol === 'gerente'){
      // Recargar la ventana principal
      mainWindow.loadURL(`file://${__dirname}/gerente/inventario.html`);
      }
      if (rol === 'admin')
      {
        mainWindow.loadURL(`file://${__dirname}/admin/inventario.html`);
      }
    }
  });

  ipcMain.on('actualizar-ventana-ventas', (event, mainWindowId) => {
    // Buscar la ventana principal por su ID
    const mainWindow = BrowserWindow.fromId(parseInt(mainWindowId));
  
    const rol = store.get('rol');
    const usuarioId = store.get('id');
    if (mainWindow) {
      if (usuarioId === 3) {// Recargar la ventana principal
        mainWindow.loadURL(`file://${__dirname}/cajeroV/ventas.html`);
      }
      if (usuarioId === 4) {// Recargar la ventana principal
        mainWindow.loadURL(`file://${__dirname}/cajeroA/ventas.html`);
      }
      if (rol === 'gerente') {
      // Recargar la ventana principal
      mainWindow.loadURL(`file://${__dirname}/gerente/ventas.html`);
    }
    if (rol === 'admin') {
      // Recargar la ventana principal
      mainWindow.loadURL(`file://${__dirname}/admin/ventas.html`);
    }
  }
  });
  
  ipcMain.on('actualizar-ventana-rembolso', (event, mainWindowId) => {
    // Buscar la ventana principal por su ID
    const mainWindow = BrowserWindow.fromId(parseInt(mainWindowId));
  
    const rol = store.get('rol');
    const usuarioId = store.get('id');
    if (mainWindow) {
      if (usuarioId === 3) {// Recargar la ventana principal
        mainWindow.loadURL(`file://${__dirname}/cajeroV/rembolsoC.html`);
      }
      if (usuarioId === 4) {// Recargar la ventana principal
        mainWindow.loadURL(`file://${__dirname}/cajeroA/rembolsoC.html`);
      }
      if (rol === 'gerente') {
      // Recargar la ventana principal
      mainWindow.loadURL(`file://${__dirname}/gerente/rembolsoC.html`);
    }
    if (rol === 'admin') {
      // Recargar la ventana principal
      mainWindow.loadURL(`file://${__dirname}/admin/rembolsoC.html`);
    }
  }
  });

  ipcMain.on('actualizar-ventana-proveedores', (event, mainWindowId) => {
    // Buscar la ventana principal por su ID
    const mainWindow = BrowserWindow.fromId(parseInt(mainWindowId));
  
    const rol = store.get('rol');
    const usuarioId = store.get('id');
    if (mainWindow) {
      if (rol === 'gerente') {
      // Recargar la ventana principal
      mainWindow.loadURL(`file://${__dirname}/gerente/rembolsoP.html`);
    }
    if (rol === 'admin') {
      // Recargar la ventana principal
      mainWindow.loadURL(`file://${__dirname}/admin/rembolsoP.html`);
    }
  }
  });

  ipcMain.on('actualizar-ventana', () => {
    
    // Buscar la ventana principal por su ID
    const mainWindow = BrowserWindow.getFocusedWindow();
  
    if (mainWindow) {
      // Recargar la ventana principal
      mainWindow.reload();
    }
  });
  
  // Escuchar el evento 'verificar-codigo-barras' del proceso de representación
  ipcMain.on('verificar-codigo-barras', (event, codigoBarras) => {
    
    // Consulta para verificar si existe un producto con el mismo código de barras
    const query = `SELECT COUNT(*) AS total FROM productos WHERE codigo_barras = ?`;
    
    dbConnection.query(query, [codigoBarras], (error, results) => {
      if (error) {
        console.error('Error al verificar el código de barras:', error);
        event.reply('codigo-barras-verificado', false); // Envía una respuesta de "falso" en caso de error
        return;
      }
      const existeProducto = results[0].total > 0;
      event.reply('codigo-barras-verificado', existeProducto);
    });
  });
  
  // Manejar el evento de agregar producto
  ipcMain.on('agregar-producto', (event, producto) => {
    const id = store.get('id');
    dbConnection.query('CALL agregar_producto(?, ?, ?, ?, ?, ?, ?, ?)', [
      producto.nombre,
      producto.precio_compra,
      producto.precio_venta,
      producto.unidad_venta,
      producto.cantidad,
      producto.fecha_compra,
      producto.codigo_barras,
      id // Asegúrate de obtener el usuario_id adecuado}
    ], (err, result) => {
    
      if (err) {
        console.error('Error al guardar el producto:', err.message);
        event.sender.send('producto-error', 'Error al guardar el producto');
      } else {
        event.sender.send('producto-agregado');
      }
    });
    
  });
  
  // Manejar el evento de abrir la ventana para agregar cantidad
  ipcMain.on('abrir-ventana-agregar-cantidad', (event, productoId) => {
    const ventanaAgregarCantidad = new BrowserWindow({
      width: 550,
      height: 350,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
      },
    });
  
    const rol = store.get('rol');

    if (rol === 'gerente') {
      ventanaAgregarCantidad.loadFile(path.join(__dirname, 'gerente/agregar_cantidad.html'), {
        query: { productoId: productoId }
      });
    }
    if (rol === 'admin') {
      ventanaAgregarCantidad.loadFile(path.join(__dirname, 'admin/agregar_cantidad.html'), {
        query: { productoId: productoId }
      });
    }
  });

  ipcMain.on('agregar-cantidad', (event, { productoId, cantidad }) => {
    const id = store.get('id');
    const query = 'CALL agregar_stock(?, ?, ?)';
  
    dbConnection.query(query, [productoId, cantidad, id], (err, results) => {
      if (err) {
        console.error('Error al actualizar la cantidad del producto:', err.message);
        event.sender.send('cantidad-error', 'Error al actualizar la cantidad del producto');
      } else {
        dbConnection.commit((commitErr) => {
          if (commitErr) {
            console.error('Error al guardar los cambios en la base de datos:', commitErr.message);
            event.sender.send('cantidad-error', 'Error al guardar los cambios en la base de datos');
          } else {
            event.sender.send('cantidad-agregada');
            
          }
        });
      }
    });
  });
  
  // Manejar el evento de editar producto
  ipcMain.on('editar-producto', (event, producto) => {
    const idUsuario = store.get('id');
    const query = 'CALL modificar_producto(?, ?, ?, ?, ?, ?, ?, ?)';
    const { id, nombre, precio_compra, precio_venta, unidad_venta, cantidad, codigo_barras } = producto;
    console.log(producto);
    dbConnection.query(
      query,
      [id, nombre, precio_compra, precio_venta, unidad_venta, cantidad, codigo_barras, idUsuario],
      (err, results) => {

        if (err) {
          console.error('Error al editar el producto:', err.message);
          event.sender.send('producto-error', 'Error al editar el producto');
        } else {
          dbConnection.commit((commitErr) => {
            if (commitErr) {
              console.error('Error al guardar los cambios en la base de datos:', commitErr.message);
              event.sender.send('producto-error', 'Error al guardar los cambios en la base de datos');
            } else {
              const productoActualizado = { // Definir el objeto productoActualizado antes de enviar el evento producto-editado
                id: id,
                nombre: nombre,
                precio_compra: precio_compra,
                precio_venta: precio_venta,
                unidad_venta: unidad_venta,
                cantidad: cantidad,
                codigo_barras: codigo_barras
              };
              event.sender.send('producto-editado', productoActualizado); // Enviar el evento producto-editado con el objeto productoActualizado
            }
          });
        }
      }
    );
  });
  
  // Manejar el evento de eliminar producto
  ipcMain.on('eliminar-producto', (event, productoId) => {
    const idUsuario = store.get('id');
    
    const query = 'CALL eliminar_producto(?, ?)';
  
    dbConnection.query(query, [productoId, idUsuario], (err, results) => {
      if (err) {
        console.error('Error al eliminar el producto:', err.message);
        event.sender.send('producto-error', 'Error al eliminar el producto');
      } else {
        event.sender.send('producto-eliminado');
        const rol = store.get('rol');

        if( rol === 'gerente') {
        mainWindow.loadURL(
          url.format({
            pathname: path.join(__dirname, './gerente/inventario.html'),
            protocol: 'file:',
            slashes: true,
          })
        );
      }
      if( rol === 'admin') {
        mainWindow.loadURL(
          url.format({
            pathname: path.join(__dirname, './admin/inventario.html'),
            protocol: 'file:',
            slashes: true,
          })
        );
      }
      }
    });
  });
  
  // Manejar la carga de productos
  ipcMain.on('load-productos', (event, page) => {
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const queryCount = 'SELECT COUNT(*) as totalRecords FROM productos';
    const queryProducts = `CALL obtener_productos_paginados(${offset}, ${pageSize})`;
  
    dbConnection.query(queryCount, (err, countResults) => {
      if (err) {
        console.error('Error al obtener el número total de registros:', err.message);
        event.sender.send('producto-error', 'Error al obtener los productos');
      } else {
        const totalRecords = countResults[0].totalRecords;
  
        dbConnection.query(queryProducts, (err, results) => {
          if (err) {
            console.error('Error al obtener los productos:', err.message);
            event.sender.send('producto-error', 'Error al obtener los productos');
          } else {
            const productos = results[0];
            event.sender.send('productos-loaded', productos, totalRecords);
          }
        });
      }
    });
  });

  // Manejar el evento 'get-historial' desde el proceso de renderizado
ipcMain.on('get-all-ventas', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getHistorial para obtener el historial
  getAllVentas(fechaInicio, fechaFin, (error, ventas) => {
    if (error) {
      console.error('Error al obtener las ventas: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('all-ventas-loaded', ventas);
  });
});

// Función para obtener el historial
function getAllVentas(fechaInicio, fechaFin, callback) {
  const query = `SELECT
  v.id AS id_venta,
  u.nombreU AS nombre_usuario,
  h.fecha AS fecha,
  h.hora AS hora,
  p.nombre AS producto,
  p.precio_venta as precio,
  d.cantidad as cantidad,
  p.unidad_venta as unidad,
  d.subtotal as subtotal,
  v.total AS total_venta
FROM ventas v
INNER JOIN detalle_venta d ON d.venta_id = v.id
INNER JOIN productos p ON d.producto_id = p.id
INNER JOIN historial h ON v.id = SUBSTRING(h.evento, LOCATE('ID de venta:', h.evento) + LENGTH('ID de venta:'))
INNER JOIN usuarios u ON h.usuario_id = u.id
WHERE h.evento LIKE '% realizó una nueva venta%' AND h.fecha BETWEEN '${fechaInicio}' AND '${fechaFin}'
ORDER BY h.fecha, h.hora`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Formatear las fechas del historial utilizando moment.js
    const formattedResults = results.map((row) => {
      const formattedFecha = moment(row.fecha).format('YYYY-MM-DD');
      return { ...row, fecha: formattedFecha };
    });

    // Llamar al callback con el historial obtenido
    callback(null, formattedResults);
  });
}

// Manejar el evento 'get-historial' desde el proceso de renderizado
ipcMain.on('get-all-compras', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getHistorial para obtener el historial
  getAllCompras(fechaInicio, fechaFin, (error, compras) => {
    if (error) {
      console.error('Error al obtener las compras: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('all-compras-loaded', compras);
  });
});

// Función para obtener el historial
function getAllCompras(fechaInicio, fechaFin, callback) {
  const query = `SELECT
  u.nombreU AS nombre_usuario,
  h.fecha AS fecha,
  h.hora AS hora,
  p.nombre AS producto,
  p.precio_compra AS precio,
SUBSTRING_INDEX(SUBSTRING_INDEX(h.evento, 'piezas', 1), 'agregó', -1) AS cantidad,
  p.unidad_venta AS unidad,
  (p.precio_compra * SUBSTRING_INDEX(SUBSTRING_INDEX(h.evento, 'piezas', 1), 'agregó', -1)) AS subtotal
FROM historial h
INNER JOIN usuarios u ON h.usuario_id = u.id
INNER JOIN productos p ON p.nombre = SUBSTRING_INDEX(SUBSTRING_INDEX(h.evento, '"', -2), '"', 1)
WHERE h.evento LIKE '% piezas al stock del producto %' AND h.fecha BETWEEN '${fechaInicio}' AND '${fechaFin}'
ORDER BY h.fecha, h.hora`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Formatear las fechas del historial utilizando moment.js
    const formattedResults = results.map((row) => {
      const formattedFecha = moment(row.fecha).format('YYYY-MM-DD');
      return { ...row, fecha: formattedFecha };
    });

    // Llamar al callback con el historial obtenido
    callback(null, formattedResults);
  });
}

  // Evento para buscar productos en la base de datos
  ipcMain.on('buscar-productos', (event, valor) => {
    const query = `SELECT * FROM productos WHERE nombre LIKE '%${valor}%'`;
  
    dbConnection.query(query, (err, results) => {
      if (err) {
        console.error('Error al buscar productos:', err.message);
        event.reply('productos-encontrados', []);
      } else {
        event.reply('productos-encontrados', results);
      }
    });
  });

  ipcMain.on('buscar-productos-bd', (event, valor) => {
    const query = `SELECT * FROM productos WHERE nombre LIKE '%${valor}%' OR codigo_barras = '${valor}'`;
  
    dbConnection.query(query, (err, results) => {
      if (err) {
        console.error('Error al buscar productos:', err.message);
        event.reply('productos-encontrados', []);
      } else {
        event.reply('productos-encontrados', results);
      }
    });
  });

  ipcMain.on('buscar-productos-codigo', (event, valor) => {
    const query = `SELECT * FROM productos WHERE codigo_barras = '${valor}'`;
  
    dbConnection.query(query, (err, results) => {
      if (err) {
        console.error('Error al buscar productos:', err.message);
        event.reply('productos-encontrados-codigo', []);
      } else {
        event.reply('productos-encontrados-codigo', results);
      }
    });
  });
  
  // Evento para obtener la información de un producto
  ipcMain.on('obtener-producto', (event, productoId) => {
    const query = `SELECT * FROM productos WHERE id = ${productoId}`;
  
    dbConnection.query(query, (err, results) => {
      if (err) {
        console.error('Error al obtener producto:', err.message);
        event.reply('producto-obtenido', {});
      } else {
        event.reply('producto-encontrado', JSON.stringify(results[0]));
      }
    });
  });

  // Manejar el evento de agregar producto a la venta
ipcMain.on('agregar-producto-venta', (event, producto) => {
  const { productoId, cantidad } = producto;

  if (!productoId || !cantidad) {
    console.error('Error al agregar producto a la venta: faltan datos');
    event.reply('producto-venta-error', 'Faltan datos para agregar el producto a la venta');
    return;
  }

  const query = 'SELECT * FROM productos WHERE id = ?';

  dbConnection.query(query, [productoId], (err, results) => {
    if (err) {
      console.error('Error al obtener el producto:', err.message);
      event.reply('producto-venta-error', 'Error al obtener el producto');
    } else {
      if (results.length > 0) {
        const producto = results[0];
        const subtotal = producto.precio_venta * cantidad;

        const detalleVenta = {
          producto: {
            codigo_barras: producto.codigo_barras,
            nombre: producto.nombre,
            precio_venta: producto.precio_venta,
            cantidad: producto.cantidad,
            unidad_venta: producto.unidad_venta,
            fecha_compra: producto.fecha_compra
          },
          productoId: productoId,
          cantidad,
          subtotal
        };
        event.reply('producto-venta-agregado', detalleVenta);
      } else {
        console.error('No se encontró el producto con ID', productoId);
        event.reply('producto-venta-error', 'No se encontró el producto');
      }
    }
  });
});

// Manejar el evento de actualizar ventas
ipcMain.on('actualizar-ventas', (event, ventas) => {
  const query = 'CALL obtener_ventas';

  dbConnection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las ventas:', err.message);
      event.sender.send('ventas-error', 'Error al obtener las ventas');
    } else {
      const filasVentas = results[0];
      const totalVenta = filasVentas.reduce((total, venta) => total + venta.subtotal, 0);
      event.sender.send('ventas-actualizadas', filasVentas, totalVenta);
    }
  });
});

// Manejar el evento de abrir la ventana para agregar cantidad
ipcMain.on('abrir-ventana-cambio', (event, totalVenta) => {
  const ventanaCambio = new BrowserWindow({
    width: 550,
    height: 425,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  const rol = store.get('rol');
  const usuarioId = store.get('id');

  if(usuarioId === 3){
    ventanaCambio.loadFile(path.join(__dirname, 'cajeroV/cambio.html'), {
      query: { totalVenta: totalVenta },
    });
  }

  if(usuarioId === 4){
    ventanaCambio.loadFile(path.join(__dirname, 'cajeroA/cambio.html'), {
      query: { totalVenta: totalVenta },
    });
  }

  if(rol === 'gerente'){
    ventanaCambio.loadFile(path.join(__dirname, 'gerente/cambio.html'), {
      query: { totalVenta: totalVenta },
    });
  }

  if(rol === 'admin'){
    ventanaCambio.loadFile(path.join(__dirname, 'admin/cambio.html'), {
      query: { totalVenta: totalVenta },
    });
  }
});

// Manejar el evento 'guardar-venta'
ipcMain.on('guardar-venta', (event, ventaData) => {
   const idUsuario = store.get('id');
   const { fechaVenta, venta } = ventaData;

   // Insertar la venta en la base de datos
   const query = `INSERT INTO ventas (fecha_venta, total) VALUES ('${fechaVenta}', ${venta.totalVenta})`;
   dbConnection.query(query, (err, result) => {
     if (err) {
       console.error('Error al guardar la venta:', err.message);
       // Manejar el error al guardar la venta según tus necesidades
     } else {
       const ventaId = result.insertId; // Obtener el ID de la venta insertada

       const query = 'CALL agregar_venta(?, ?)';
  
      dbConnection.query(query, [ventaId, idUsuario], (err, results) => {
      if (err) {
        console.error('Error al guardar en el historial de la venta:', err.message);}});
       // Insertar los detalles de la venta en la base de datos
       venta.detallesVenta.forEach((detalle) => {
         const { productoId, cantidad, subtotal } = detalle;
         const inventioQuery = 'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?';

       dbConnection.query(inventioQuery, [cantidad, productoId], (err, results) => {
         if (err) {
           console.error('Error al actualizar la cantidad del producto:', err.message);
           event.sender.send('cantidad-error', 'Error al actualizar la cantidad del producto');
         } else {
           dbConnection.commit((commitErr) => {
             if (commitErr) {
               console.error('Error al guardar los cambios en la base de datos:', commitErr.message);
               event.sender.send('cantidad-error', 'Error al guardar los cambios en la base de datos');
             } else {
               event.sender.send('cantidad-agregada');
              
             }
           });
         }
       });
       
         const detalleQuery = `INSERT INTO detalle_venta (venta_id, producto_id, cantidad, subtotal) VALUES (${ventaId}, ${productoId}, ${cantidad}, ${subtotal})`;
         dbConnection.query(detalleQuery, (err) => {
           if (err) {
             console.error('Error al guardar el detalle de la venta:', err.message);
             // Manejar el error al guardar el detalle de la venta según tus necesidades
           }
         });
       });
      
     }
   });
 });

 ipcMain.on('guardar-cambio', (event, producto) => {
  const idUsuario = store.get('id');
  const { productoId, motivo } = producto;

  // Insertar el cambio en la base de datos
  const query = 'CALL agregar_cambio(?, ?, ?)';
  dbConnection.query(query, [productoId, motivo, idUsuario], (err, results) => {
    if (err) {
      console.error('Error al guardar el cambio:', err.message);
      // Manejar el error al guardar el cambio según tus necesidades
    } else {
      dbConnection.commit((commitErr) => {
        if (commitErr) {
          console.error('Error al guardar los cambios en la base de datos:', commitErr.message);
          event.sender.send('cantidad-error', 'Error al guardar los cambios en la base de datos');
        } else {
          event.sender.send('cantidad-agregada', producto);
              // Aquí enviamos una respuesta al proceso de renderizado para que pueda actualizar la interfaz si es necesario
        }
      });
    }
  });
 });

 ipcMain.on('guardar-devolucion', (event, producto) => {
  const idUsuario = store.get('id');
  const { productoId, motivo } = producto;

  // Insertar el cambio en la base de datos
  const query = 'CALL agregar_reembolso(?, ?, ?)';
  dbConnection.query(query, [productoId, motivo, idUsuario], (err, results) => {
    if (err) {
      console.error('Error al guardar el cambio:', err.message);
      // Manejar el error al guardar el cambio según tus necesidades
    } else {
      // Si el cambio se guardó correctamente, actualizamos la cantidad del producto en la base de datos
      const inventarioQuery = 'UPDATE productos SET cantidad = cantidad + ? WHERE id = ?';
      dbConnection.query(inventarioQuery, [1, productoId], (inventarioErr, inventarioResults) => {
        if (inventarioErr) {
          console.error('Error al actualizar la cantidad del producto:', inventarioErr.message);
          event.sender.send('cantidad-error', 'Error al actualizar la cantidad del producto');
        } else {
          dbConnection.commit((commitErr) => {
            if (commitErr) {
              console.error('Error al guardar los cambios en la base de datos:', commitErr.message);
              event.sender.send('cantidad-error', 'Error al guardar los cambios en la base de datos');
            } else {
              event.sender.send('cantidad-agregada', producto);
              // Aquí enviamos una respuesta al proceso de renderizado para que pueda actualizar la interfaz si es necesario
            }
          });
        }
      });
    }
  });
});

ipcMain.on('abrir-ventana-devolver', (event, total) => {
  const ventanaRembolso = new BrowserWindow({
    width: 785,
    height: 350,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  const rol = store.get('rol');
  const usuarioId = store.get('id');

  if(usuarioId === 3){
    ventanaRembolso.loadFile(path.join(__dirname, 'cajeroV/devolucion.html'), {
      query: { total: total },
    });
  }

  if(usuarioId === 4){
    ventanaRembolso.loadFile(path.join(__dirname, 'cajeroA/devolucion.html'), {
      query: { total: total },
    });
  }

  if(rol === 'gerente'){
    ventanaRembolso.loadFile(path.join(__dirname, 'gerente/devolucionC.html'), {
      query: { total: total },
    });
  }

  if(rol === 'admin'){
    ventanaRembolso.loadFile(path.join(__dirname, 'admin/devolucionC.html'), {
      query: { total: total },
    });
  }
});

ipcMain.on('guardar-cambio-proveedores', (event, producto) => {
  const idUsuario = store.get('id');
  const { productoId, cantidad, motivo } = producto;

  // Insertar el cambio en la base de datos
  const query = 'CALL agregar_cambio_proveedores(?, ?, ?, ?)';
  dbConnection.query(query, [productoId, cantidad, motivo, idUsuario], (err, results) => {
    if (err) {
      console.error('Error al guardar el cambio:', err.message);
      // Manejar el error al guardar el cambio según tus necesidades
    } else {
      dbConnection.commit((commitErr) => {
        if (commitErr) {
          console.error('Error al guardar los cambios en la base de datos:', commitErr.message);
          event.sender.send('cantidad-error', 'Error al guardar los cambios en la base de datos');
        } else {
          event.sender.send('cantidad-agregada-proveedores', producto);
              // Aquí enviamos una respuesta al proceso de renderizado para que pueda actualizar la interfaz si es necesario
        }
      });
    }
  });
 });

 ipcMain.on('abrir-ventana-devolver-proveedores', (event, total) => {
  const ventanaRembolso = new BrowserWindow({
    width: 785,
    height: 450,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  const rol = store.get('rol');

  if(rol === 'gerente'){
    ventanaRembolso.loadFile(path.join(__dirname, 'gerente/devolucion.html'), {
      query: { total: total },
    });
  }

  if(rol === 'admin'){
    ventanaRembolso.loadFile(path.join(__dirname, 'admin/devolucion.html'), {
      query: { total: total },
    });
  }
});

ipcMain.on('guardar-devolucion-proveedores', (event, producto) => {
  const idUsuario = store.get('id');
  const { productoId, cantidad, motivo } = producto;

  // Insertar el cambio en la base de datos
  const query = 'CALL agregar_reembolso_proveedores(?, ?, ?, ?)';
  dbConnection.query(query, [productoId, cantidad, motivo, idUsuario], (err, results) => {
    if (err) {
      console.error('Error al guardar el cambio:', err.message);
      // Manejar el error al guardar el cambio según tus necesidades
    } else {
      // Si el cambio se guardó correctamente, actualizamos la cantidad del producto en la base de datos
      const inventarioQuery = 'UPDATE productos SET cantidad = cantidad - ? WHERE id = ?';
      dbConnection.query(inventarioQuery, [cantidad, productoId], (inventarioErr, inventarioResults) => {
        if (inventarioErr) {
          console.error('Error al actualizar la cantidad del producto:', inventarioErr.message);
          event.sender.send('cantidad-error', 'Error al actualizar la cantidad del producto');
        } else {
          dbConnection.commit((commitErr) => {
            if (commitErr) {
              console.error('Error al guardar los cambios en la base de datos:', commitErr.message);
              event.sender.send('cantidad-error', 'Error al guardar los cambios en la base de datos');
            } else {
              event.sender.send('cantidad-agregada-proveedores', producto);
              // Aquí enviamos una respuesta al proceso de renderizado para que pueda actualizar la interfaz si es necesario
            }
          });
        }
      });
    }
  });
});

// Manejar el evento de cierre de sesión
ipcMain.on('logout', (event) => {
  const idUsuario = store.get('id');
  const query = 'CALL cerrar_sesion(?)';
  dbConnection.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error('Error al eliminar el producto:', err.message);
      event.sender.send('producto-error', 'Error al eliminar el producto');
    }});
  // Eliminar el rol del almacenamiento local
  store.delete('rol');
  store.delete('id');

  // Opcionalmente, puedes borrar todos los datos almacenados en el almacén
  // store.clear();

  // Cargar la página de inicio de sesión nuevamente
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'views/login.html'),
      protocol: 'file:',
      slashes: true,
    })
  );
});

// Manejar el evento 'get-ingresos' desde el proceso de renderizado
ipcMain.on('get-ingresos', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getIngresos con las fechas proporcionadas
  getIngresos(fechaInicio, fechaFin, (error, ingresos) => {
    if (error) {
      console.error('Error al obtener los ingresos: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('ingresos-loaded', ingresos);
  });
});

// Función para obtener los ingresos
function getIngresos(fechaInicio, fechaFin, callback) {
  const query = `SELECT COALESCE(SUM(total), 0) AS ingresos
                FROM historial
                WHERE (evento LIKE '%ID de venta%' OR evento LIKE '%proveedor%') AND fecha BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Extraer el valor de los ingresos del resultado
    const ingresos = results[0].ingresos;

    // Llamar al callback con los ingresos obtenidos
    callback(null, ingresos);
  });
}

// Manejar el evento 'get-ingresos' desde el proceso de renderizado
ipcMain.on('get-total-ventas', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getIngresos con las fechas proporcionadas
  getTotales(fechaInicio, fechaFin, (error, totales) => {
    if (error) {
      console.error('Error al obtener los ingresos: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('totales-loaded', totales);
  });
});

// Función para obtener los ingresos
function getTotales(fechaInicio, fechaFin, callback) {
  const query = `SELECT SUM(total) AS totales FROM historial 
  WHERE evento LIKE '% realizó una nueva venta%' AND
  fecha BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Extraer el valor de los ingresos del resultado
    const totales = results[0].totales;

    // Llamar al callback con los ingresos obtenidos
    callback(null, totales);
  });
}

// Manejar el evento 'get-ingresos' desde el proceso de renderizado
ipcMain.on('get-total-compras', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getIngresos con las fechas proporcionadas
  getComprasT(fechaInicio, fechaFin, (error, compras) => {
    if (error) {
      console.error('Error al obtener las compras: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('compras-loaded', compras);
  });
});

// Función para obtener los ingresos
function getComprasT(fechaInicio, fechaFin, callback) {
  const query = `SELECT SUM(total) AS totales FROM historial 
  WHERE evento LIKE '% piezas al stock del producto %' AND
  fecha BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Extraer el valor de los ingresos del resultado
    const compras = results[0].totales;

    // Llamar al callback con los ingresos obtenidos
    callback(null, compras);
  });
}

// Manejar el evento 'get-ingresos' desde el proceso de renderizado
ipcMain.on('get-egresos', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getIngresos con las fechas proporcionadas
  getEgresos(fechaInicio, fechaFin, (error, egresos) => {
    if (error) {
      console.error('Error al obtener los egresos: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('egresos-loaded', egresos);
  });
});

// Función para obtener los ingresos
function getEgresos(fechaInicio, fechaFin, callback) {
  const query = `SELECT COALESCE(SUM(total), 0) AS egresos
                FROM historial
                WHERE (evento LIKE '%agregó%' OR evento LIKE '%cliente%') AND fecha BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Extraer el valor de los ingresos del resultado
    const egresos = results[0].egresos;

    // Llamar al callback con los ingresos obtenidos
    callback(null, egresos);
  });
}

// Manejar el evento 'get-ventas' desde el proceso de renderizado
ipcMain.on('get-ventas', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getVentas con las fechas proporcionadas
  getVentas(fechaInicio, fechaFin, (error, ventas) => {
    if (error) {
      console.error('Error al obtener las ventas: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('ventas-loaded', ventas);
  });
});

// Función para obtener las ventas
function getVentas(fechaInicio, fechaFin, callback) {
  const query = `SELECT COUNT(*) AS total_ventas
                 FROM ventas
                 WHERE fecha_venta BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Extraer el valor de las ventas del resultado
    const ventas = results[0].total_ventas;

    // Llamar al callback con las ventas obtenidas
    callback(null, ventas);
  });
}


// Manejar el evento 'get-productos' desde el proceso de renderizado
ipcMain.on('get-productos', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getProductos con las fechas proporcionadas
  getProductos(fechaInicio, fechaFin, (error, productos) => {
    if (error) {
      console.error('Error al obtener los productos: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('productos-loaded', productos);
  });
});

// Función para obtener los productos
function getProductos(fechaInicio, fechaFin, callback) {
  const query = `SELECT SUM(dv.cantidad) AS total_vendido
  FROM productos p
  JOIN detalle_venta dv ON p.id = dv.producto_id
  JOIN ventas v ON dv.venta_id = v.id
  WHERE v.fecha_venta BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Extraer el valor de los productos vendidos del resultado
    const productos = results[0].total_vendido;

    // Llamar al callback con los productos obtenidos
    callback(null, productos);
  });
}

// Manejar el evento 'get-historial' desde el proceso de renderizado
ipcMain.on('get-historial', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getHistorial para obtener el historial
  getHistorial(fechaInicio, fechaFin, (error, historial) => {
    if (error) {
      console.error('Error al obtener el historial: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('historial-loaded', historial);
  });
});

// Función para obtener el historial
function getHistorial(fechaInicio, fechaFin, callback) {
  const query = `SELECT * FROM historial WHERE fecha BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Formatear las fechas del historial utilizando moment.js
    const formattedResults = results.map((row) => {
      const formattedFecha = moment(row.fecha).format('YYYY-MM-DD');
      return { ...row, fecha: formattedFecha };
    });

    // Llamar al callback con el historial obtenido
    callback(null, formattedResults);
  });
}

// Manejar el evento 'get-productos' desde el proceso de renderizado
ipcMain.on('get-productos', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getProductos con las fechas proporcionadas
  getProductos(fechaInicio, fechaFin, (error, productos) => {
    if (error) {
      console.error('Error al obtener los productos: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('productos-loaded', productos);
  });
});

// Función para obtener los productos
function getProductos(fechaInicio, fechaFin, callback) {
  const query = `SELECT SUM(dv.cantidad) AS total_vendido
  FROM productos p
  JOIN detalle_venta dv ON p.id = dv.producto_id
  JOIN ventas v ON dv.venta_id = v.id
  WHERE v.fecha_venta BETWEEN '${fechaInicio}' AND '${fechaFin}'`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Extraer el valor de los productos vendidos del resultado
    const productos = results[0].total_vendido;

    // Llamar al callback con los productos obtenidos
    callback(null, productos);
  });
}

// Manejar el evento 'get-historial' desde el proceso de renderizado
ipcMain.on('get-top', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getHistorial para obtener el historial
  getTop(fechaInicio, fechaFin, (error, top) => {
    if (error) {
      console.error('Error al obtener el top: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('top-loaded', top);
  });
});

// Función para obtener el historial
function getTop(fechaInicio, fechaFin, callback) {
  const query = `SELECT p.nombre, 
  CONCAT(SUM(dv.cantidad), ' ', p.unidad_venta) AS total_vendido, 
  p.precio_venta
FROM productos p
JOIN detalle_venta dv ON p.id = dv.producto_id
JOIN ventas v ON dv.venta_id = v.id
WHERE v.fecha_venta BETWEEN '${fechaInicio}' AND '${fechaFin}'
GROUP BY p.nombre, p.unidad_venta, p.precio_venta
ORDER BY total_vendido DESC
LIMIT 5`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Llamar al callback con el historial obtenido
    callback(null, results);
  });
}

// Manejar el evento 'get-historial' desde el proceso de renderizado
ipcMain.on('get-menos', (event, fechaInicio, fechaFin) => {
  // Llamar a la función getHistorial para obtener el historial
  getMenos(fechaInicio, fechaFin, (error, top) => {
    if (error) {
      console.error('Error al obtener el top: ', error);
      return;
    }
    // Enviar los resultados al proceso de renderizado
    event.sender.send('menos-loaded', top);
  });
});

// Función para obtener el historial
function getMenos(fechaInicio, fechaFin, callback) {
  const query = `SELECT p.nombre, 
  CONCAT(SUM(dv.cantidad), ' ', p.unidad_venta) AS total_vendido, 
  p.precio_venta
FROM productos p
JOIN detalle_venta dv ON p.id = dv.producto_id
JOIN ventas v ON dv.venta_id = v.id
WHERE v.fecha_venta BETWEEN '${fechaInicio}' AND '${fechaFin}'
GROUP BY p.nombre, p.unidad_venta, p.precio_venta
ORDER BY total_vendido ASC
LIMIT 5`;

  dbConnection.query(query, (err, results) => {
    if (err) {
      callback(err);
      return;
    }

    // Llamar al callback con el historial obtenido
    callback(null, results);
  });
}