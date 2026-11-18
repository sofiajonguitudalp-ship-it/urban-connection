// Datos de prueba y guardado en localStorage
var datosIniciales = {
    usuarios: [
        { id: 1, nombre: "Lucía Hernández Ramos", correo: "coordinacion@demo.mx", telefono: "8112345670", clave: "12345", rol: "coordinador" },
        { id: 2, nombre: "Rosa María Garza Leal", correo: "rosa@demo.mx", telefono: "8111111111", clave: "12345", rol: "adulto" },
        { id: 3, nombre: "Jorge Treviño Garza", correo: "jorge@demo.mx", telefono: "8122222222", clave: "12345", rol: "familiar" },
        { id: 4, nombre: "Daniela Martínez López", correo: "daniela@demo.mx", telefono: "8133333333", clave: "12345", rol: "estudiante",
          escuela: "UANL, Facultad de Trabajo Social", matricula: "1987654", nacimiento: "2003-05-14",
          horario: "Lunes a viernes por la mañana", credencial: "credencial_daniela.jpg", horas: 3, validado: true },
        { id: 5, nombre: "Carlos Ruiz Pérez", correo: "carlos@demo.mx", telefono: "8144444444", clave: "12345", rol: "estudiante",
          escuela: "UANL, Facultad de Psicología", matricula: "2011223", nacimiento: "2004-09-02",
          horario: "Martes, jueves y sábado", credencial: "credencial_carlos.pdf", horas: 0, validado: false }
    ],
    adultos: [
        { id: 1, nombre: "Rosa María Garza Leal", edad: 72, telefono: "8111111111",
          direccion: "Calle Hidalgo 245, Col. Mitras Centro, Monterrey", notas: "Prefiere que le hablen despacio.",
          idUsuario: 2, idFamiliar: 3 },
        { id: 2, nombre: "Manuel Treviño Salinas", edad: 81, telefono: "8155555555",
          direccion: "Calle Hidalgo 245, Col. Mitras Centro, Monterrey", notas: "Usa bastón. No sube escaleras largas.",
          idUsuario: null, idFamiliar: 3 },
        { id: 3, nombre: "Elena Cantú Villarreal", edad: 68, telefono: "8166666666",
          direccion: "Av. Lincoln 1020, Col. Valle Verde, Monterrey", notas: "Vive sola. Su vecina tiene copia de las llaves.",
          idUsuario: null, idFamiliar: null }
    ],
    solicitudes: [
        { id: 1, idAdulto: 1, idCreador: 2, idEstudiante: 4, tipo: "banco", motivo: "Cobrar mi pensión",
          fecha: "2026-11-10", hora: "10:00", origen: "Casa, Calle Hidalgo 245", destino: "Banco del centro, Av. Madero",
          notas: "", estado: "finalizada", codigo: "4821", horas: 3,
          historial: [
              { estado: "pendiente", texto: "Solicitud enviada", fecha: "05/11/2026 18:20" },
              { estado: "asignada", texto: "Se asignó a Daniela Martínez López", fecha: "06/11/2026 09:00" },
              { estado: "confirmada", texto: "Daniela aceptó el servicio", fecha: "06/11/2026 12:15" },
              { estado: "en_camino", texto: "", fecha: "10/11/2026 09:35" },
              { estado: "en_tramite", texto: "Se confirmó el código de encuentro", fecha: "10/11/2026 10:02" },
              { estado: "de_regreso", texto: "", fecha: "10/11/2026 12:10" },
              { estado: "finalizada", texto: "Llegó bien a casa", fecha: "10/11/2026 12:45" }
          ],
          pertenencias: [
              { nombre: "Credencial del INE", salida: true, regreso: true },
              { nombre: "Tarjeta del banco", salida: true, regreso: true },
              { nombre: "Llaves de la casa", salida: true, regreso: true },
              { nombre: "Lentes", salida: true, regreso: true },
              { nombre: "Paraguas", salida: true, regreso: false }
          ] },
        { id: 2, idAdulto: 2, idCreador: 3, idEstudiante: 4, tipo: "cita", motivo: "Cita con el cardiólogo",
          fecha: "2026-11-20", hora: "09:30", origen: "Casa, Calle Hidalgo 245", destino: "Clínica 33 del IMSS",
          notas: "Lleva su carnet.", estado: "confirmada", codigo: "1593", horas: 0,
          historial: [
              { estado: "pendiente", texto: "Solicitud enviada", fecha: "14/11/2026 20:00" },
              { estado: "asignada", texto: "Se asignó a Daniela Martínez López", fecha: "15/11/2026 10:00" },
              { estado: "confirmada", texto: "Daniela aceptó el servicio", fecha: "15/11/2026 13:40" }
          ],
          pertenencias: [
              { nombre: "Carnet del IMSS", salida: false, regreso: false },
              { nombre: "Medicamentos", salida: false, regreso: false },
              { nombre: "Llaves de la casa", salida: false, regreso: false },
              { nombre: "Bastón", salida: false, regreso: false }
          ] },
        { id: 3, idAdulto: 3, idCreador: 1, idEstudiante: null, tipo: "compras", motivo: "Despensa de la semana",
          fecha: "2026-11-22", hora: "11:00", origen: "Casa, Av. Lincoln 1020", destino: "Supermercado de la colonia",
          notas: "Necesita ayuda para cargar las bolsas.", estado: "pendiente", codigo: "7302", horas: 0,
          historial: [
              { estado: "pendiente", texto: "Solicitud enviada por la coordinación", fecha: "16/11/2026 11:00" }
          ],
          pertenencias: [
              { nombre: "Cartera", salida: false, regreso: false },
              { nombre: "Bolsas para el mandado", salida: false, regreso: false },
              { nombre: "Llaves de la casa", salida: false, regreso: false }
          ] },
        { id: 4, idAdulto: 1, idCreador: 3, idEstudiante: 4, tipo: "otra", motivo: "Renovar credencial del INAPAM",
          fecha: "2026-11-17", hora: "12:00", origen: "Casa, Calle Hidalgo 245", destino: "Oficina del INAPAM",
          notas: "", estado: "en_camino", codigo: "6640", horas: 0,
          historial: [
              { estado: "pendiente", texto: "Solicitud enviada", fecha: "12/11/2026 17:00" },
              { estado: "asignada", texto: "Se asignó a Daniela Martínez López", fecha: "13/11/2026 09:10" },
              { estado: "confirmada", texto: "Daniela aceptó el servicio", fecha: "13/11/2026 10:30" },
              { estado: "en_camino", texto: "", fecha: "17/11/2026 11:30" }
          ],
          pertenencias: [
              { nombre: "Credencial del INE", salida: false, regreso: false },
              { nombre: "Credencial del INAPAM vencida", salida: false, regreso: false },
              { nombre: "Comprobante de domicilio", salida: false, regreso: false },
              { nombre: "Llaves de la casa", salida: false, regreso: false }
          ] }
    ],
    valoraciones: [
        { id: 1, idSolicitud: 1, idEstudiante: 4, idAutor: 2, estrellas: 5,
          comentario: "Daniela fue muy paciente y me ayudó a llenar el formato. Me sentí muy tranquila.", fecha: "10/11/2026" }
    ],
    incidencias: [
        { id: 1, idSolicitud: 1, idUsuario: 4, mensaje: "El cajero no servía y nos tardamos más de lo planeado.",
          atendida: true, fecha: "10/11/2026 11:30" }
    ]
};

// Guardar y leer
function leer(nombre) {
    try {
        var texto = localStorage.getItem("uc_" + nombre);
        return texto ? JSON.parse(texto) : null;
    } catch (e) {
        return null;
    }
}

function guardar(nombre, valor) {
    try {
        localStorage.setItem("uc_" + nombre, JSON.stringify(valor));
    } catch (e) {
        alert("No se pudo guardar la información en este navegador.");
    }
}

function iniciarDatos() {
    if (leer("usuarios") == null) {
        reiniciarDatos();
    }
}

function reiniciarDatos() {
    guardar("usuarios", datosIniciales.usuarios);
    guardar("adultos", datosIniciales.adultos);
    guardar("solicitudes", datosIniciales.solicitudes);
    guardar("valoraciones", datosIniciales.valoraciones);
    guardar("incidencias", datosIniciales.incidencias);
}

function siguienteId(lista) {
    var mayor = 0;
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id > mayor) {
            mayor = lista[i].id;
        }
    }
    return mayor + 1;
}

function buscar(lista, id) {
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id == id) {
            return lista[i];
        }
    }
    return null;
}

// Sesión
function usuarioActual() {
    var sesion = leer("sesion");
    if (!sesion) {
        return null;
    }
    return buscar(leer("usuarios") || [], sesion.id);
}

function iniciarSesion(usuario) {
    guardar("sesion", { id: usuario.id });
}

function cerrarSesion() {
    try {
        localStorage.removeItem("uc_sesion");
    } catch (e) {}
    window.location.href = "index.html";
}

// Textos
var estados = {
    pendiente: "Esperando que asignen a un alumno",
    asignada: "Alumno asignado, falta que acepte",
    confirmada: "Confirmado",
    en_camino: "El alumno va en camino",
    en_tramite: "En el trámite",
    de_regreso: "De regreso a casa",
    finalizada: "Terminado",
    cancelada: "Cancelado"
};

var tipos = {
    cita: "Cita médica",
    banco: "Banco o pensión",
    compras: "Compras",
    otra: "Otro trámite"
};

var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
             "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function fechaBonita(fecha) {
    if (!fecha) {
        return "";
    }
    var p = fecha.split("-");
    return parseInt(p[2]) + " de " + meses[parseInt(p[1]) - 1] + " de " + p[0];
}

function ahora() {
    var d = new Date();
    var dos = function (n) { return ("0" + n).slice(-2); };
    return dos(d.getDate()) + "/" + dos(d.getMonth() + 1) + "/" + d.getFullYear() + " " + dos(d.getHours()) + ":" + dos(d.getMinutes());
}

function hoyTexto() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
}

iniciarDatos();