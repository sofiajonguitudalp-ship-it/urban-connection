var cuerpo = document.body;
var pagina = cuerpo.getAttribute("data-pagina");
var yo = usuarioActual();

// Utilidades
function el(id) {
    return document.getElementById(id);
}

function limpiar(texto) {
    var div = document.createElement("div");
    div.textContent = texto == null ? "" : texto;
    return div.innerHTML;
}

function parametro(nombre) {
    return new URLSearchParams(window.location.search).get(nombre);
}

function iniciales(nombre) {
    var partes = nombre.trim().split(" ");
    var ini = partes[0].charAt(0);
    if (partes.length > 1) {
        ini += partes[1].charAt(0);
    }
    return ini.toUpperCase();
}

function icono(nombre) {
    return '<img src="img/' + nombre + '.svg" class="icono" alt="" aria-hidden="true">';
}

function etiquetaEstado(estado, grande) {
    var clase = "estado estado-" + estado + (grande ? " estado-grande" : "");
    return '<span class="' + clase + '">' + estados[estado] + "</span>";
}

function avisar(id, texto, tipo) {
    var caja = el(id);
    if (!caja) {
        alert(texto);
        return;
    }
    caja.className = tipo == "error" ? "mensaje-error" : "mensaje-ok";
    caja.textContent = texto;
    caja.scrollIntoView({ behavior: "smooth", block: "center" });
}

function grupo(rol) {
    if (rol == "adulto" || rol == "familiar") {
        return "adulto";
    }
    return rol;
}

function promedio(idEstudiante) {
    var lista = leer("valoraciones");
    var suma = 0;
    var total = 0;
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].idEstudiante == idEstudiante) {
            suma += lista[i].estrellas;
            total++;
        }
    }
    return { valor: total > 0 ? suma / total : 0, total: total };
}

function estrellasTexto(n) {
    n = Math.round(n);
    var t = "";
    for (var i = 1; i <= 5; i++) {
        t += i <= n ? "★" : "☆";
    }
    return '<span class="estrellas" aria-label="' + n + ' de 5 estrellas">' + t + "</span>";
}

function adultosDe(usuario) {
    var lista = leer("adultos");
    var mios = [];
    for (var i = 0; i < lista.length; i++) {
        var a = lista[i];
        if (usuario.rol == "coordinador" || a.idUsuario == usuario.id || a.idFamiliar == usuario.id) {
            mios.push(a);
        }
    }
    return mios;
}

function puedeVer(usuario, sol) {
    if (!usuario || !sol) {
        return false;
    }
    if (usuario.rol == "coordinador") {
        return true;
    }
    if (usuario.rol == "estudiante") {
        return sol.idEstudiante == usuario.id;
    }
    var a = buscar(leer("adultos"), sol.idAdulto);
    return a && (a.idUsuario == usuario.id || a.idFamiliar == usuario.id);
}

function solicitudesDe(usuario) {
    var lista = leer("solicitudes");
    var mias = [];
    for (var i = 0; i < lista.length; i++) {
        if (puedeVer(usuario, lista[i])) {
            mias.push(lista[i]);
        }
    }
    mias.sort(function (a, b) {
        return (a.fecha + a.hora) < (b.fecha + b.hora) ? -1 : 1;
    });
    return mias;
}

function estaActiva(sol) {
    return sol.estado != "finalizada" && sol.estado != "cancelada";
}

function proximaActiva(usuario) {
    var lista = solicitudesDe(usuario);
    for (var i = 0; i < lista.length; i++) {
        if (estaActiva(lista[i])) {
            return lista[i];
        }
    }
    return null;
}

function guardarSolicitud(sol) {
    var lista = leer("solicitudes");
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].id == sol.id) {
            lista[i] = sol;
        }
    }
    guardar("solicitudes", lista);
}

function cambiarEstado(sol, nuevo, texto) {
    sol.estado = nuevo;
    sol.historial.push({ estado: nuevo, texto: texto || "", fecha: ahora() });
    guardarSolicitud(sol);
}

function yaValorada(idSolicitud) {
    var lista = leer("valoraciones");
    for (var i = 0; i < lista.length; i++) {
        if (lista[i].idSolicitud == idSolicitud) {
            return lista[i];
        }
    }
    return null;
}

// Protección de páginas
var rolesPermitidos = cuerpo.getAttribute("data-roles");
if (rolesPermitidos) {
    if (!yo) {
        window.location.href = "login.html";
    } else if (rolesPermitidos.split(",").indexOf(yo.rol) == -1) {
        window.location.href = "panel.html";
    }
}

// Menú según el perfil
function armarMenu() {
    var menu = el("menu");
    var links = [];

    if (!yo) {
        links = [["index.html", "Inicio"], ["index.html#como", "Cómo funciona"], ["login.html", "Entrar"]];
    } else if (yo.rol == "adulto" || yo.rol == "familiar") {
        links = [["panel.html", "Inicio"], ["solicitar.html", "Pedir acompañamiento"], ["solicitudes.html", "Mis solicitudes"],
                 ["valoraciones.html", "Calificar"], ["perfil.html", "Mi perfil"]];
    } else if (yo.rol == "estudiante") {
        links = [["panel.html", "Inicio"], ["servicios.html", "Mis servicios"], ["valoraciones.html", "Calificaciones"],
                 ["perfil.html", "Mi perfil"]];
    } else {
        links = [["panel.html", "Inicio"], ["asignaciones.html", "Asignaciones"], ["solicitudes.html", "Solicitudes"],
                 ["perfil.html", "Mi perfil"]];
    }

    var actual = window.location.pathname.split("/").pop() || "index.html";
    var html = "";
    for (var i = 0; i < links.length; i++) {
        var clase = links[i][0] == actual ? ' class="activo" aria-current="page"' : "";
        html += '<a href="' + links[i][0] + '"' + clase + ">" + links[i][1] + "</a>";
    }
    if (yo) {
        html += '<a href="#" id="btn-salir" class="salir">Salir</a>';
    }
    menu.innerHTML = html;

    if (yo) {
        el("btn-salir").addEventListener("click", function (e) {
            e.preventDefault();
            cerrarSesion();
        });
        var saludo = el("saludo");
        if (saludo) {
            var nombres = { adulto: "adulto mayor", familiar: "familiar", estudiante: "alumno", coordinador: "coordinación" };
            saludo.textContent = "Hola, " + yo.nombre.split(" ")[0] + " (" + nombres[yo.rol] + ")";
            saludo.classList.remove("oculto");
        }
    }
}
armarMenu();

// Tamaño de letra y alto contraste
var nivel = 1;

function ponerLetra(nuevo) {
    if (nuevo < 0 || nuevo > 3) {
        return;
    }
    cuerpo.classList.remove("letra-" + nivel);
    nivel = nuevo;
    cuerpo.classList.add("letra-" + nivel);
    guardar("letra", nivel);
}

function ponerContraste(activo) {
    cuerpo.classList.toggle("contraste", activo);
    el("btn-contraste").setAttribute("aria-pressed", activo ? "true" : "false");
    el("btn-contraste").textContent = activo ? "Quitar alto contraste" : "Alto contraste";
    guardar("contraste", activo);
}

if (leer("letra") != null) {
    ponerLetra(parseInt(leer("letra")));
}
ponerContraste(leer("contraste") == true);

el("btn-mas").addEventListener("click", function () {
    ponerLetra(nivel + 1);
});
el("btn-menos").addEventListener("click", function () {
    ponerLetra(nivel - 1);
});
el("btn-contraste").addEventListener("click", function () {
    ponerContraste(!cuerpo.classList.contains("contraste"));
});

// Leer texto
var btnLeer = el("btn-leer");
var leyendo = false;
var colaLectura = [];
var posLectura = 0;
var lecturaActual = null;

function elegirVoz() {
    var voces = window.speechSynthesis.getVoices();
    var espanol = [];
    for (var i = 0; i < voces.length; i++) {
        if (voces[i].lang.replace("_", "-").toLowerCase().indexOf("es") == 0) {
            espanol.push(voces[i]);
        }
    }

    // De la que suena más natural a la más robótica
    var orden = [
        function (v) { return v.name.indexOf("Natural") != -1 && esMexico(v); },
        function (v) { return v.name.indexOf("Natural") != -1; },
        function (v) { return v.name.indexOf("Google") != -1 && v.lang.indexOf("US") != -1; },
        function (v) { return v.name.indexOf("Google") != -1; },
        function (v) { return v.name.indexOf("Paulina") != -1; },
        function (v) { return esMexico(v); }
    ];
    for (var j = 0; j < orden.length; j++) {
        for (var k = 0; k < espanol.length; k++) {
            if (orden[j](espanol[k])) {
                return espanol[k];
            }
        }
    }
    return espanol.length > 0 ? espanol[0] : null;
}

function esMexico(voz) {
    return voz.lang.replace("_", "-").toLowerCase() == "es-mx";
}

function textoDe(elemento) {
    var copia = elemento.cloneNode(true);
    var quitar = copia.querySelectorAll("button, input, select, textarea, .no-leer, [aria-hidden='true'], img");
    for (var i = 0; i < quitar.length; i++) {
        quitar[i].remove();
    }
    var saltos = copia.querySelectorAll("br");
    for (var b = 0; b < saltos.length; b++) {
        saltos[b].replaceWith(". ");
    }
    var codigos = copia.querySelectorAll(".codigo");
    for (var c = 0; c < codigos.length; c++) {
        codigos[c].textContent = codigos[c].textContent.split("").join(" ");
    }
    if (copia.classList && copia.classList.contains("codigo")) {
        copia.textContent = copia.textContent.split("").join(" ");
    }
    var conNombre = copia.querySelectorAll("[aria-label]");
    for (var j = 0; j < conNombre.length; j++) {
        conNombre[j].textContent = conNombre[j].getAttribute("aria-label");
    }
    return copia.textContent
        .replace(/[·•]/g, ",")
        .replace(/→/g, " a ")
        .replace(/[★☆✕“”]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function armarCola() {
    var principal = el("contenido");
    var partes = principal.querySelectorAll("h1, h2, h3, p, li, label, legend, th, td, .leer");
    var cola = [];
    for (var i = 0; i < partes.length; i++) {
        var p = partes[i];
        if (p.closest(".oculto, .no-leer, nav, button, [aria-hidden='true']")) {
            continue;
        }
        if (p.parentElement.closest("p, li, label, td, th, .leer")) {
            continue;
        }
        var texto = textoDe(p);
        if (texto != "") {
            cola.push({ parte: p, texto: texto });
        }
    }
    return cola;
}

function quitarResaltado() {
    var marcados = document.querySelectorAll(".leyendo-ahora");
    for (var i = 0; i < marcados.length; i++) {
        marcados[i].classList.remove("leyendo-ahora");
    }
}

function pararLectura() {
    leyendo = false;
    window.speechSynthesis.cancel();
    quitarResaltado();
    btnLeer.textContent = "Leer texto";
    btnLeer.classList.remove("leyendo");
    btnLeer.setAttribute("aria-pressed", "false");
}

function leerSiguiente() {
    if (!leyendo) {
        return;
    }
    if (posLectura >= colaLectura.length) {
        pararLectura();
        return;
    }
    var actual = colaLectura[posLectura];
    quitarResaltado();
    actual.parte.classList.add("leyendo-ahora");
    actual.parte.scrollIntoView({ behavior: "smooth", block: "center" });

    lecturaActual = new SpeechSynthesisUtterance(actual.texto);
    lecturaActual.lang = "es-MX";
    lecturaActual.rate = 0.95;
    lecturaActual.pitch = 1;
    var voz = elegirVoz();
    if (voz) {
        lecturaActual.voice = voz;
        lecturaActual.lang = voz.lang;
    }
    lecturaActual.onend = function () {
        posLectura++;
        leerSiguiente();
    };
    lecturaActual.onerror = function () {
        posLectura++;
        leerSiguiente();
    };
    window.speechSynthesis.speak(lecturaActual);
}

function empezarLectura() {
    colaLectura = armarCola();
    posLectura = 0;
    if (colaLectura.length == 0) {
        return;
    }
    leyendo = true;
    btnLeer.textContent = "Detener lectura";
    btnLeer.classList.add("leyendo");
    btnLeer.setAttribute("aria-pressed", "true");
    window.speechSynthesis.cancel();
    leerSiguiente();
}

if ("speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function () {
        window.speechSynthesis.getVoices();
    };
    btnLeer.addEventListener("click", function () {
        if (leyendo) {
            pararLectura();
        } else {
            empezarLectura();
        }
    });
    window.addEventListener("beforeunload", function () {
        window.speechSynthesis.cancel();
    });
} else {
    btnLeer.addEventListener("click", function () {
        alert("Tu navegador no puede leer en voz alta. Prueba con Google Chrome.");
    });
}

// Validación de formularios
function nombreCampo(campo) {
    if (campo.getAttribute("data-nombre")) {
        return campo.getAttribute("data-nombre");
    }
    var etiqueta = document.querySelector("label[for='" + campo.id + "']");
    if (etiqueta) {
        return etiqueta.textContent.replace("*", "").trim();
    }
    return campo.name;
}

function calcularEdad(fecha) {
    var nac = new Date(fecha + "T00:00:00");
    var hoy = new Date();
    var edad = hoy.getFullYear() - nac.getFullYear();
    var mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes == 0 && hoy.getDate() < nac.getDate())) {
        edad--;
    }
    return edad;
}

function revisar(zona) {
    var errores = [];
    var radios = [];
    var campos = zona.querySelectorAll("input, select, textarea");

    for (var i = 0; i < campos.length; i++) {
        var c = campos[i];
        var valor = c.value.trim();

        if (c.type == "hidden" || c.disabled || c.closest(".oculto")) {
            continue;
        }
        if (c.type == "radio") {
            if (c.required && radios.indexOf(c.name) == -1) {
                radios.push(c.name);
                if (!zona.querySelector("input[name='" + c.name + "']:checked")) {
                    errores.push("Elige una opción en: " + nombreCampo(c));
                }
            }
            continue;
        }
        if (c.type == "checkbox") {
            if (c.required && !c.checked) {
                errores.push(nombreCampo(c));
            }
            continue;
        }
        if (c.required && valor == "") {
            errores.push("Falta llenar: " + nombreCampo(c));
            continue;
        }
        if (valor == "") {
            continue;
        }
        if (c.type == "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
            errores.push("El correo no está bien escrito. Ejemplo: nombre@correo.com");
        }
        if (c.getAttribute("data-tipo") == "telefono" && !/^[0-9]{10}$/.test(valor)) {
            errores.push("El teléfono debe tener 10 números, sin espacios.");
        }
        if (c.getAttribute("data-tipo") == "clave" && valor.length < 5) {
            errores.push("La contraseña debe tener al menos 5 caracteres.");
        }
        if (c.getAttribute("data-igual") && el(c.getAttribute("data-igual")).value != c.value) {
            errores.push("Las contraseñas no son iguales.");
        }
        if (c.getAttribute("data-futura") && valor < hoyTexto()) {
            errores.push("La fecha no puede ser antes de hoy.");
        }
        if (c.getAttribute("data-mayor-edad") && calcularEdad(valor) < 18) {
            errores.push("Para ser acompañante necesitas tener 18 años o más.");
        }
        if (c.getAttribute("data-edad-minima") && parseInt(valor) < parseInt(c.getAttribute("data-edad-minima"))) {
            errores.push("El programa es para personas de " + c.getAttribute("data-edad-minima") + " años o más.");
        }
    }

    var caja = zona.querySelector(".caja-errores");
    if (!caja && zona.closest("form")) {
        caja = zona.closest("form").querySelector(".caja-errores");
    }
    if (errores.length > 0) {
        if (caja) {
            caja.innerHTML = "<strong>Revisa esto:</strong><ul><li>" + errores.join("</li><li>") + "</li></ul>";
            caja.classList.add("visible");
            caja.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
            alert("Revisa esto:\n- " + errores.join("\n- "));
        }
        return false;
    }
    if (caja) {
        caja.classList.remove("visible");
    }
    return true;
}

// Confirmaciones
var confirmar = document.querySelectorAll("[data-confirmar]");
for (var k = 0; k < confirmar.length; k++) {
    confirmar[k].addEventListener("click", function (e) {
        if (!confirm(this.getAttribute("data-confirmar"))) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    });
}

// Inicio
if (pagina == "inicio" && yo) {
    el("con-sesion").classList.remove("oculto");
    el("nombre-sesion").textContent = yo.nombre;
}

// Iniciar sesión
if (pagina == "login") {
    var formLogin = el("form-login");
    var perfilInicial = parametro("perfil");
    if (perfilInicial) {
        var radioPerfil = formLogin.querySelector("input[name='perfil'][value='" + perfilInicial + "']");
        if (radioPerfil) {
            radioPerfil.checked = true;
        }
    }

    formLogin.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!revisar(formLogin)) {
            return;
        }
        var perfil = formLogin.querySelector("input[name='perfil']:checked").value;
        var dato = el("usuario").value.trim().toLowerCase();
        var clave = el("clave").value;
        var usuarios = leer("usuarios");
        var encontrado = null;

        for (var i = 0; i < usuarios.length; i++) {
            var u = usuarios[i];
            if ((u.correo.toLowerCase() == dato || u.telefono == dato) && u.clave == clave) {
                encontrado = u;
            }
        }

        if (!encontrado) {
            avisar("msg-login", "El correo, teléfono o contraseña no coinciden. Revísalos y vuelve a intentar.", "error");
            return;
        }
        if (grupo(encontrado.rol) != perfil) {
            avisar("msg-login", "Esa cuenta es de otro perfil. Elige el correcto arriba.", "error");
            return;
        }
        iniciarSesion(encontrado);
        window.location.href = "panel.html";
    });

    var botonesDemo = document.querySelectorAll(".btn-demo");
    for (var d = 0; d < botonesDemo.length; d++) {
        botonesDemo[d].addEventListener("click", function () {
            formLogin.querySelector("input[name='perfil'][value='" + this.getAttribute("data-perfil") + "']").checked = true;
            el("usuario").value = this.getAttribute("data-correo");
            el("clave").value = "12345";
            formLogin.requestSubmit();
        });
    }

    el("btn-reiniciar").addEventListener("click", function () {
        reiniciarDatos();
        try {
            localStorage.removeItem("uc_sesion");
        } catch (e) {}
        avisar("msg-login", "Listo, los datos de prueba volvieron a como estaban al principio.", "ok");
    });
}

// Registro
if (pagina == "registro") {
    var formRegistro = el("form-registro");

    function mostrarSecciones() {
        var marcado = formRegistro.querySelector("input[name='tipo']:checked");
        var tipo = marcado ? marcado.value : "";
        el("sec-mayor").classList.toggle("oculto", tipo != "adulto" && tipo != "familiar");
        el("sec-alumno").classList.toggle("oculto", tipo != "estudiante");
        var soloFamiliar = document.querySelectorAll(".solo-familiar");
        for (var i = 0; i < soloFamiliar.length; i++) {
            soloFamiliar[i].classList.toggle("oculto", tipo != "familiar");
        }
        el("titulo-mayor").textContent = tipo == "familiar" ? "Datos de tu familiar" : "Tus datos";
    }

    var tipoInicial = parametro("tipo");
    if (tipoInicial) {
        var radioTipo = formRegistro.querySelector("input[name='tipo'][value='" + tipoInicial + "']");
        if (radioTipo) {
            radioTipo.checked = true;
        }
    }
    var radiosTipo = formRegistro.querySelectorAll("input[name='tipo']");
    for (var r = 0; r < radiosTipo.length; r++) {
        radiosTipo[r].addEventListener("change", mostrarSecciones);
    }
    mostrarSecciones();

    formRegistro.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!revisar(formRegistro)) {
            return;
        }
        var tipo = formRegistro.querySelector("input[name='tipo']:checked").value;
        var usuarios = leer("usuarios");
        var correo = el("correo").value.trim().toLowerCase();
        var telefono = el("telefono").value.trim();

        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].correo.toLowerCase() == correo || usuarios[i].telefono == telefono) {
                avisar("msg-registro", "Ya existe una cuenta con ese correo o teléfono.", "error");
                return;
            }
        }

        var nuevo = {
            id: siguienteId(usuarios),
            nombre: el("nombre").value.trim(),
            correo: correo,
            telefono: telefono,
            clave: el("clave").value,
            rol: tipo
        };

        if (tipo == "estudiante") {
            var archivo = el("credencial").files[0];
            nuevo.escuela = el("escuela").value.trim();
            nuevo.matricula = el("matricula").value.trim();
            nuevo.nacimiento = el("nacimiento").value;
            nuevo.horario = el("horario").value.trim();
            nuevo.credencial = archivo ? archivo.name : "";
            nuevo.horas = 0;
            nuevo.validado = false;
        }

        usuarios.push(nuevo);
        guardar("usuarios", usuarios);

        if (tipo == "adulto" || tipo == "familiar") {
            var adultos = leer("adultos");
            adultos.push({
                id: siguienteId(adultos),
                nombre: tipo == "adulto" ? nuevo.nombre : el("nombre-mayor").value.trim(),
                edad: parseInt(el("edad").value),
                telefono: tipo == "adulto" ? telefono : el("telefono-mayor").value.trim(),
                direccion: el("direccion").value.trim(),
                notas: el("notas").value.trim(),
                idUsuario: tipo == "adulto" ? nuevo.id : null,
                idFamiliar: tipo == "familiar" ? nuevo.id : null
            });
            guardar("adultos", adultos);
        }

        iniciarSesion(nuevo);
        window.location.href = "panel.html?nuevo=1";
    });
}

// Panel
if (pagina == "panel" && yo) {
    var panel = el("panel");
    var html = "";

    if (parametro("nuevo")) {
        html += '<p class="mensaje-ok">Listo, ya tienes tu cuenta.</p>';
    }

    if (yo.rol == "adulto" || yo.rol == "familiar") {
        var proxima = proximaActiva(yo);
        html += "<h1>¿Qué quieres hacer hoy?</h1>";
        if (proxima) {
            var adultoProx = buscar(leer("adultos"), proxima.idAdulto);
            html += '<div class="tarjeta-solicitud"><h2>Tu próximo acompañamiento</h2>' +
                "<p><strong>" + tipos[proxima.tipo] + "</strong> · " + limpiar(adultoProx.nombre) + "</p>" +
                "<p>" + fechaBonita(proxima.fecha) + " a las " + proxima.hora + " · " + limpiar(proxima.destino) + "</p>" +
                "<p>" + etiquetaEstado(proxima.estado) + "</p>" +
                '<a href="seguimiento.html?id=' + proxima.id + '" class="btn-grande">Ver cómo va</a>' +
                '<a href="checklist.html?id=' + proxima.id + '" class="btn-secundario">Mi lista de cosas</a></div>';
        } else {
            html += '<p class="aviso-alcance">Por ahora no tienes salidas pendientes. Cuando necesites ir a algún lado, pídelo aquí abajo.</p>';
        }
        if (yo.rol == "familiar" && adultosDe(yo).length == 0) {
            html += '<p class="aviso-alcance">Primero registra a tu familiar en <a href="perfil.html">Mi perfil</a>.</p>';
        }
        html += '<div class="grid-botones">' +
            '<a href="solicitar.html" class="boton-panel">' + icono("calendario") + "Pedir acompañamiento<small>Para una cita, el banco, compras u otro trámite.</small></a>" +
            '<a href="solicitudes.html" class="boton-panel">' + icono("lista") + "Mis solicitudes<small>Ver en qué va cada una.</small></a>" +
            '<a href="valoraciones.html" class="boton-panel">' + icono("estrella") + "Calificar<small>Cuéntanos cómo te fue.</small></a>" +
            '<a href="perfil.html" class="boton-panel">' + icono("persona") + "Mi perfil<small>Tus datos" + (yo.rol == "familiar" ? " y los de tu familiar" : "") + ".</small></a>" +
            "</div>";
    }

    if (yo.rol == "estudiante") {
        var misServicios = solicitudesDe(yo);
        var porAtender = 0;
        for (var i = 0; i < misServicios.length; i++) {
            if (estaActiva(misServicios[i])) {
                porAtender++;
            }
        }
        var prom = promedio(yo.id);
        html += "<h1>Tu servicio social</h1>";
        if (!yo.validado) {
            html += '<p class="aviso-alcance">Tu cuenta está en revisión. En cuanto la coordinación revise tu credencial te pueden empezar a asignar servicios.</p>';
        }
        html += '<div class="cuadros">' +
            '<div class="cuadro"><span class="numero">' + porAtender + "</span>Por atender</div>" +
            '<div class="cuadro"><span class="numero">' + yo.horas + "</span>Horas acumuladas</div>" +
            '<div class="cuadro"><span class="numero">' + (prom.total > 0 ? prom.valor.toFixed(1) : "—") + "</span>Calificación</div>" +
            "</div>" +
            '<div class="grid-botones">' +
            '<a href="servicios.html" class="boton-panel">' + icono("ubicacion") + "Mis servicios<small>Aceptar, avisar en qué vas y terminar.</small></a>" +
            '<a href="valoraciones.html" class="boton-panel">' + icono("estrella") + "Calificaciones<small>Lo que opinan de ti.</small></a>" +
            '<a href="perfil.html" class="boton-panel">' + icono("persona") + "Mi perfil<small>Tus datos y horario.</small></a>" +
            "</div>";
    }

    if (yo.rol == "coordinador") {
        var todas = leer("solicitudes");
        var usuarios = leer("usuarios");
        var incidencias = leer("incidencias");
        var valoraciones = leer("valoraciones");
        var cuenta = { pendiente: 0, curso: 0, finalizada: 0, horas: 0, olvidados: 0, porValidar: 0, abiertas: 0 };

        for (var a = 0; a < todas.length; a++) {
            var s = todas[a];
            if (s.estado == "pendiente") cuenta.pendiente++;
            if (s.estado == "en_camino" || s.estado == "en_tramite" || s.estado == "de_regreso") cuenta.curso++;
            if (s.estado == "finalizada") {
                cuenta.finalizada++;
                cuenta.horas += s.horas;
                for (var b = 0; b < s.pertenencias.length; b++) {
                    if (s.pertenencias[b].salida && !s.pertenencias[b].regreso) cuenta.olvidados++;
                }
            }
        }
        for (var c = 0; c < usuarios.length; c++) {
            if (usuarios[c].rol == "estudiante" && !usuarios[c].validado) cuenta.porValidar++;
        }
        for (var f = 0; f < incidencias.length; f++) {
            if (!incidencias[f].atendida) cuenta.abiertas++;
        }
        var sumaEstrellas = 0;
        for (var g = 0; g < valoraciones.length; g++) {
            sumaEstrellas += valoraciones[g].estrellas;
        }

        html += "<h1>Panel de coordinación</h1>" +
            '<div class="cuadros">' +
            '<div class="cuadro"><span class="numero">' + cuenta.pendiente + "</span>Sin asignar</div>" +
            '<div class="cuadro"><span class="numero">' + cuenta.curso + "</span>En curso</div>" +
            '<div class="cuadro"><span class="numero">' + cuenta.porValidar + "</span>Alumnos por validar</div>" +
            '<div class="cuadro"><span class="numero">' + cuenta.abiertas + "</span>Incidencias abiertas</div>" +
            '<div class="cuadro"><span class="numero">' + cuenta.finalizada + "</span>Servicios realizados</div>" +
            '<div class="cuadro"><span class="numero">' + (valoraciones.length ? (sumaEstrellas / valoraciones.length).toFixed(1) : "—") + "</span>Calificación promedio</div>" +
            '<div class="cuadro"><span class="numero">' + cuenta.horas + "</span>Horas de servicio social</div>" +
            '<div class="cuadro"><span class="numero">' + cuenta.olvidados + "</span>Cosas que no regresaron</div>" +
            "</div>" +
            '<div class="grid-botones">' +
            '<a href="asignaciones.html" class="boton-panel">' + icono("lista") + "Asignaciones<small>Asignar alumnos y validar nuevos.</small></a>" +
            '<a href="solicitar.html" class="boton-panel">' + icono("calendario") + "Pedir por alguien<small>Para quien no usa el celular.</small></a>" +
            '<a href="perfil.html" class="boton-panel">' + icono("persona") + "Personas mayores<small>Registrar y ver sus datos.</small></a>" +
            "</div>" +
            "<h2>Incidencias</h2>";

        if (incidencias.length == 0) {
            html += "<p>No hay incidencias.</p>";
        }
        for (var h = incidencias.length - 1; h >= 0; h--) {
            var inc = incidencias[h];
            var quien = buscar(usuarios, inc.idUsuario);
            var solInc = buscar(todas, inc.idSolicitud);
            var adultoInc = solInc ? buscar(leer("adultos"), solInc.idAdulto) : null;
            html += '<div class="tarjeta-solicitud">' +
                "<p>" + (inc.atendida ? '<span class="estado estado-finalizada">Atendida</span>' : '<span class="estado estado-cancelada">Sin atender</span>') + " " + inc.fecha + "</p>" +
                "<p><strong>“" + limpiar(inc.mensaje) + "”</strong></p>" +
                "<p>Avisó: " + limpiar(quien ? quien.nombre : "") + " · Tel. " + limpiar(quien ? quien.telefono : "") + "</p>" +
                (adultoInc ? "<p>Servicio: " + tipos[solInc.tipo] + " de " + limpiar(adultoInc.nombre) + "</p>" : "") +
                '<a href="seguimiento.html?id=' + inc.idSolicitud + '" class="btn-secundario">Ver servicio</a>' +
                (inc.atendida ? "" : '<button type="button" class="btn-grande btn-atender" data-id="' + inc.id + '">Marcar como atendida</button>') +
                "</div>";
        }
    }

    panel.innerHTML = html;

    panel.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-atender")) {
            if (!confirm("¿Ya se resolvió esta incidencia?")) {
                return;
            }
            var lista = leer("incidencias");
            buscar(lista, e.target.getAttribute("data-id")).atendida = true;
            guardar("incidencias", lista);
            window.location.reload();
        }
    });
}



// Solicitar acompañamiento
if (pagina == "solicitar" && yo) {
    var misAdultos = adultosDe(yo);
    var selectPara = el("para");

    if (misAdultos.length == 0) {
        el("sin-adultos").classList.remove("oculto");
        el("form-solicitud").classList.add("oculto");
        el("indicador").classList.add("oculto");
    }

    for (var m = 0; m < misAdultos.length; m++) {
        var opcion = document.createElement("option");
        opcion.value = misAdultos[m].id;
        opcion.textContent = misAdultos[m].idUsuario == yo.id ? "Para mí (" + misAdultos[m].nombre + ")" : misAdultos[m].nombre;
        selectPara.appendChild(opcion);
    }
    if (parametro("adulto")) {
        selectPara.value = parametro("adulto");
    }
    if (misAdultos.length == 1) {
        selectPara.value = misAdultos[0].id;
    }

    function ponerOrigen() {
        var a = buscar(misAdultos, selectPara.value);
        if (a) {
            el("origen").value = "Casa, " + a.direccion;
        }
    }
    selectPara.addEventListener("change", ponerOrigen);
    ponerOrigen();

    var pasos = document.querySelectorAll(".paso-form");
    var pasoActual = 0;

    function mostrarPaso(n) {
        for (var i = 0; i < pasos.length; i++) {
            pasos[i].classList.toggle("oculto", i != n);
        }
        var bolitas = document.querySelectorAll("#indicador li");
        for (var j = 0; j < bolitas.length; j++) {
            bolitas[j].className = j < n ? "hecho" : (j == n ? "actual" : "");
        }
        if (n == pasos.length - 1) {
            var tipoMarcado = document.querySelector("input[name='tipo']:checked");
            el("res-para").textContent = selectPara.options[selectPara.selectedIndex].text;
            el("res-tipo").textContent = tipoMarcado ? tipos[tipoMarcado.value] : "";
            el("res-motivo").textContent = el("motivo").value;
            el("res-fecha").textContent = fechaBonita(el("fecha").value) + " a las " + el("hora").value;
            el("res-origen").textContent = el("origen").value;
            el("res-destino").textContent = el("destino").value;
            el("res-notas").textContent = el("notas").value || "Sin notas";
        }
        pasoActual = n;
        window.scrollTo(0, 0);
    }

    var siguientes = document.querySelectorAll("[data-siguiente]");
    for (var s = 0; s < siguientes.length; s++) {
        siguientes[s].addEventListener("click", function () {
            if (revisar(pasos[pasoActual])) {
                mostrarPaso(pasoActual + 1);
            }
        });
    }
    var atras = document.querySelectorAll("[data-atras]");
    for (var t = 0; t < atras.length; t++) {
        atras[t].addEventListener("click", function () {
            mostrarPaso(pasoActual - 1);
        });
    }
    el("form-solicitud").addEventListener("keydown", function (e) {
        if (e.key == "Enter" && e.target.tagName != "TEXTAREA" && pasoActual < pasos.length - 1) {
            e.preventDefault();
            pasos[pasoActual].querySelector("[data-siguiente]").click();
        }
    });
    el("fecha").min = hoyTexto();
    mostrarPaso(0);

    el("form-solicitud").addEventListener("submit", function (e) {
        e.preventDefault();
        var tipo = document.querySelector("input[name='tipo']:checked").value;
        var cosas = ["Credencial del INE", "Llaves de la casa", "Celular"];
        if (tipo == "cita") cosas.push("Carnet o documentos médicos", "Medicamentos");
        if (tipo == "banco") cosas.push("Tarjeta del banco", "Lentes");
        if (tipo == "compras") cosas.push("Cartera", "Bolsas para el mandado");
        if (tipo == "otra") cosas.push("Documentos del trámite");

        var pertenencias = [];
        for (var i = 0; i < cosas.length; i++) {
            pertenencias.push({ nombre: cosas[i], salida: false, regreso: false });
        }

        var lista = leer("solicitudes");
        var nueva = {
            id: siguienteId(lista),
            idAdulto: parseInt(selectPara.value),
            idCreador: yo.id,
            idEstudiante: null,
            tipo: tipo,
            motivo: el("motivo").value.trim(),
            fecha: el("fecha").value,
            hora: el("hora").value,
            origen: el("origen").value.trim(),
            destino: el("destino").value.trim(),
            notas: el("notas").value.trim(),
            estado: "pendiente",
            codigo: String(Math.floor(1000 + Math.random() * 9000)),
            horas: 0,
            historial: [{ estado: "pendiente", texto: "Solicitud enviada", fecha: ahora() }],
            pertenencias: pertenencias
        };
        lista.push(nueva);
        guardar("solicitudes", lista);
        window.location.href = "seguimiento.html?id=" + nueva.id + "&nueva=1";
    });
}

// Lista de solicitudes
if (pagina == "solicitudes" && yo) {
    var filtro = el("filtro");

    function pintarSolicitudes() {
        var lista = solicitudesDe(yo).reverse();
        var adultos = leer("adultos");
        var usuarios = leer("usuarios");
        var html = "";
        var cuantas = 0;

        for (var i = 0; i < lista.length; i++) {
            var s = lista[i];
            if (filtro.value != "" && s.estado != filtro.value) {
                continue;
            }
            cuantas++;
            var a = buscar(adultos, s.idAdulto);
            var alumno = buscar(usuarios, s.idEstudiante);
            html += '<div class="tarjeta-solicitud">' +
                "<h3>" + tipos[s.tipo] + " · " + limpiar(a.nombre) + "</h3>" +
                "<p>" + fechaBonita(s.fecha) + " a las " + s.hora + " · " + limpiar(s.destino) + "</p>" +
                "<p>Acompañante: " + (alumno ? limpiar(alumno.nombre) : "todavía no se asigna") + "</p>" +
                "<p>" + etiquetaEstado(s.estado) + "</p>" +
                '<a href="seguimiento.html?id=' + s.id + '" class="btn-grande">Ver detalle</a>' +
                '<a href="checklist.html?id=' + s.id + '" class="btn-secundario">Lista de cosas</a>';
            if (s.estado == "finalizada" && !yaValorada(s.id) && yo.rol != "coordinador") {
                html += '<a href="valoraciones.html?id=' + s.id + '" class="btn-grande">Calificar</a>';
            }
            if (s.estado == "pendiente" || s.estado == "asignada" || s.estado == "confirmada") {
                html += '<button type="button" class="btn-peligro btn-cancelar" data-id="' + s.id + '">Cancelar</button>';
            }
            html += "</div>";
        }
        if (cuantas == 0) {
            html = '<p class="aviso-alcance">No hay solicitudes para mostrar.</p>';
        }
        el("lista-solicitudes").innerHTML = html;
    }

    filtro.addEventListener("change", pintarSolicitudes);
    pintarSolicitudes();

    el("lista-solicitudes").addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-cancelar")) {
            if (!confirm("¿Seguro que quieres cancelar este acompañamiento?")) {
                return;
            }
            var sol = buscar(leer("solicitudes"), e.target.getAttribute("data-id"));
            cambiarEstado(sol, "cancelada", "Cancelada por " + yo.nombre);
            pintarSolicitudes();
        }
    });
}

// Lista de pertenencias
if (pagina == "checklist" && yo) {
    var solLista = parametro("id") ? buscar(leer("solicitudes"), parametro("id")) : proximaActiva(yo);

    if (!solLista || !puedeVer(yo, solLista)) {
        el("checklist").innerHTML = '<p class="aviso-alcance">No tienes una salida pendiente. Cuando pidas un acompañamiento, aquí aparecerá tu lista.</p>';
    } else {
        var adultoLista = buscar(leer("adultos"), solLista.idAdulto);
        var editable = estaActiva(solLista);
        el("datos-lista").textContent = tipos[solLista.tipo] + " de " + adultoLista.nombre + " · " + fechaBonita(solLista.fecha);
        el("link-seguimiento").href = "seguimiento.html?id=" + solLista.id;
        if (!editable) {
            el("zona-agregar").classList.add("oculto");
            el("instrucciones-lista").textContent = "Este acompañamiento ya terminó. Así quedó la lista:";
        }

        function pintarLista() {
            var html = "";
            var salida = 0;
            var regreso = 0;
            var olvidados = 0;
            var p = solLista.pertenencias;

            for (var i = 0; i < p.length; i++) {
                if (p[i].salida) salida++;
                if (p[i].regreso) regreso++;
                var falta = p[i].salida && !p[i].regreso;
                if (falta) olvidados++;
                var bloqueo = editable ? "" : " disabled";
                html += "<tr>" +
                    '<td class="' + (!editable && falta ? "olvidado" : "") + '">' + limpiar(p[i].nombre) + (!editable && falta ? " (no regresó)" : "") + "</td>" +
                    '<td class="centro"><input type="checkbox" data-i="' + i + '" data-campo="salida" aria-label="' + limpiar(p[i].nombre) + ' al salir"' + (p[i].salida ? " checked" : "") + bloqueo + "></td>" +
                    '<td class="centro"><input type="checkbox" data-i="' + i + '" data-campo="regreso" aria-label="' + limpiar(p[i].nombre) + ' al regresar"' + (p[i].regreso ? " checked" : "") + bloqueo + "></td>" +
                    (editable ? '<td class="centro"><button type="button" class="btn-peligro btn-quitar" data-i="' + i + '" aria-label="Quitar ' + limpiar(p[i].nombre) + '">✕</button></td>' : "") +
                    "</tr>";
            }
            el("filas-lista").innerHTML = html;
            el("col-quitar").classList.toggle("oculto", !editable);
            el("cuenta-salida").textContent = salida + " de " + p.length;
            el("cuenta-regreso").textContent = regreso + " de " + p.length;
            if (!editable) {
                avisar("msg-lista", olvidados == 0 ? "Todo regresó a casa." : "Hubo " + olvidados + " cosa(s) que salieron y no se marcaron al regresar.", olvidados == 0 ? "ok" : "error");
            }
        }
        pintarLista();

        el("filas-lista").addEventListener("change", function (e) {
            var i = e.target.getAttribute("data-i");
            solLista.pertenencias[i][e.target.getAttribute("data-campo")] = e.target.checked;
            guardarSolicitud(solLista);
            pintarLista();
            el("msg-lista").className = "mensaje-ok";
            el("msg-lista").textContent = "Guardado.";
        });

        el("filas-lista").addEventListener("click", function (e) {
            if (e.target.classList.contains("btn-quitar")) {
                var i = e.target.getAttribute("data-i");
                if (confirm("¿Quitar “" + solLista.pertenencias[i].nombre + "” de la lista?")) {
                    solLista.pertenencias.splice(i, 1);
                    guardarSolicitud(solLista);
                    pintarLista();
                }
            }
        });

        function agregarCosa() {
            var nombre = el("nuevo-objeto").value.trim();
            if (nombre == "") {
                avisar("msg-lista", "Escribe qué quieres agregar a la lista.", "error");
                el("nuevo-objeto").focus();
                return;
            }
            solLista.pertenencias.push({ nombre: nombre, salida: false, regreso: false });
            guardarSolicitud(solLista);
            el("nuevo-objeto").value = "";
            pintarLista();
            avisar("msg-lista", "Se agregó “" + nombre + "” a la lista.", "ok");
        }
        el("btn-agregar").addEventListener("click", agregarCosa);
        el("nuevo-objeto").addEventListener("keydown", function (e) {
            if (e.key == "Enter") {
                e.preventDefault();
                agregarCosa();
            }
        });
    }
}

// Seguimiento
if (pagina == "seguimiento" && yo) {
    var solSeg = parametro("id") ? buscar(leer("solicitudes"), parametro("id")) : proximaActiva(yo);

    if (!solSeg || !puedeVer(yo, solSeg)) {
        el("seguimiento").innerHTML = '<p class="aviso-alcance">No tienes un acompañamiento en curso. <a href="solicitudes.html">Ver mis solicitudes</a></p>';
    } else {
        var adultoSeg = buscar(leer("adultos"), solSeg.idAdulto);
        var alumnoSeg = buscar(leer("usuarios"), solSeg.idEstudiante);
        var activa = estaActiva(solSeg);
        var html = "";

        if (parametro("nueva")) {
            html += '<p class="mensaje-ok">Listo, ya mandamos tu solicitud. En cuanto la coordinación asigne a un alumno lo vas a ver aquí.</p>';
        }

        html += "<h1>" + tipos[solSeg.tipo] + " de " + limpiar(adultoSeg.nombre) + "</h1>" +
            '<div class="caja"><p class="etiqueta">¿En qué va?</p><p>' + etiquetaEstado(solSeg.estado, true) + "</p>" +
            "<p><strong>Motivo:</strong> " + limpiar(solSeg.motivo) + "</p>" +
            "<p><strong>Fecha:</strong> " + fechaBonita(solSeg.fecha) + " a las " + solSeg.hora + "</p>" +
            "<p><strong>Sale de:</strong> " + limpiar(solSeg.origen) + "</p>" +
            "<p><strong>Va a:</strong> " + limpiar(solSeg.destino) + "</p>" +
            (solSeg.notas ? "<p><strong>Notas:</strong> " + limpiar(solSeg.notas) + "</p>" : "") +
            "</div>";

        if (yo.rol != "estudiante" && activa) {
            html += '<div class="caja"><h2>Código de encuentro</h2><p><span class="codigo">' + solSeg.codigo + "</span></p>" +
                "<p>Cuando llegue el alumno, pregúntale cómo se llama y dale este código. Así los dos saben que es la persona correcta. <strong>No se lo des a nadie más.</strong></p></div>";
        }

        if (yo.rol == "estudiante" || yo.rol == "coordinador") {
            html += '<div class="caja"><h2>Persona mayor</h2><p><strong>' + limpiar(adultoSeg.nombre) + "</strong>, " + adultoSeg.edad + " años</p>" +
                "<p>Dirección: " + limpiar(adultoSeg.direccion) + "</p>" +
                (adultoSeg.telefono ? "<p>Teléfono: " + limpiar(adultoSeg.telefono) + "</p>" : "") +
                (adultoSeg.notas ? "<p>A tomar en cuenta: " + limpiar(adultoSeg.notas) + "</p>" : "") + "</div>";
        }

        if (yo.rol != "estudiante") {
            html += '<div class="caja"><h2>Quién acompaña</h2>';
            if (alumnoSeg) {
                var promSeg = promedio(alumnoSeg.id);
                html += '<div class="tarjeta-estudiante"><div class="foto-iniciales" aria-hidden="true">' + iniciales(alumnoSeg.nombre) + "</div><div>" +
                    "<p><strong>" + limpiar(alumnoSeg.nombre) + "</strong></p>" +
                    "<p>" + limpiar(alumnoSeg.escuela) + " · Alumno verificado</p>" +
                    "<p>" + (promSeg.total > 0 ? estrellasTexto(promSeg.valor) + " " + promSeg.valor.toFixed(1) + " (" + promSeg.total + " calificaciones)" : "Todavía no tiene calificaciones.") + "</p>" +
                    (solSeg.estado != "asignada" ? "<p>Teléfono: " + limpiar(alumnoSeg.telefono) + "</p>" : "") +
                    "</div></div>";
            } else {
                html += "<p>Todavía no hay alumno asignado. La coordinación está buscando a alguien que pueda ir.</p>";
            }
            html += "</div>";
        }

        var listo = 0;
        var vuelta = 0;
        for (var i = 0; i < solSeg.pertenencias.length; i++) {
            if (solSeg.pertenencias[i].salida) listo++;
            if (solSeg.pertenencias[i].regreso) vuelta++;
        }
        html += '<div class="caja"><h2>Lista de cosas</h2>' +
            "<p>Al salir: " + listo + " de " + solSeg.pertenencias.length + " revisadas.</p>" +
            "<p>Al regresar: " + vuelta + " de " + solSeg.pertenencias.length + " revisadas.</p>" +
            '<a href="checklist.html?id=' + solSeg.id + '" class="btn-secundario">Abrir la lista</a></div>';

        html += '<div class="caja"><h2>¿Qué ha pasado?</h2><ul class="linea-tiempo">';
        for (var h = solSeg.historial.length - 1; h >= 0; h--) {
            var paso = solSeg.historial[h];
            html += "<li><strong>" + estados[paso.estado] + "</strong><br>" + (paso.texto ? limpiar(paso.texto) + "<br>" : "") + "<small>" + paso.fecha + "</small></li>";
        }
        html += "</ul></div>";

        var valorada = yaValorada(solSeg.id);
        if (valorada) {
            html += '<div class="caja"><h2>Calificación</h2><p>' + estrellasTexto(valorada.estrellas) + "</p><p>" + limpiar(valorada.comentario) + "</p></div>";
        } else if (solSeg.estado == "finalizada" && (yo.rol == "adulto" || yo.rol == "familiar")) {
            html += '<a href="valoraciones.html?id=' + solSeg.id + '" class="btn-grande ancho">Calificar el servicio</a>';
        }

        if (activa && yo.rol != "coordinador") {
            html += '<div class="caja"><h2>¿Necesitas ayuda?</h2>' +
                "<p>Si algo sale mal, aprieta el botón y le avisamos a la coordinación y a tu familia.</p>" +
                '<p id="msg-ayuda" class="oculto" role="alert"></p>' +
                '<div class="campo"><label for="que-paso">¿Qué pasó? (opcional)</label><input type="text" id="que-paso" maxlength="200" placeholder="Ej. el alumno no ha llegado"></div>' +
                '<button type="button" id="btn-ayuda" class="btn-ayuda">Necesito ayuda</button></div>';
        }

        if (yo.rol == "estudiante") {
            html += '<a href="servicios.html" class="btn-secundario">Regresar a mis servicios</a>';
        } else {
            html += '<a href="solicitudes.html" class="btn-secundario">Regresar a solicitudes</a>';
        }

        el("seguimiento").innerHTML = html;

        if (el("btn-ayuda")) {
            el("btn-ayuda").addEventListener("click", function () {
                if (!confirm("¿Quieres avisar a la coordinación y a la familia que necesitas ayuda?")) {
                    return;
                }
                var lista = leer("incidencias");
                lista.push({
                    id: siguienteId(lista),
                    idSolicitud: solSeg.id,
                    idUsuario: yo.id,
                    mensaje: el("que-paso").value.trim() || "Se presionó el botón de ayuda.",
                    atendida: false,
                    fecha: ahora()
                });
                guardar("incidencias", lista);
                avisar("msg-ayuda", "Ya le avisamos a la coordinación y a tu familia. Te van a llamar en unos minutos. Si es una emergencia, marca al 911.", "ok");
            });
        }
    }
}


// Servicios del alumno
if (pagina == "servicios" && yo) {
    function pintarServicios() {
        var mios = solicitudesDe(yo);
        var adultos = leer("adultos");
        var html = "";
        var terminados = "";
        var hayActivos = false;

        if (!yo.validado) {
            html += '<p class="aviso-alcance">Tu cuenta está en revisión. Cuando la coordinación valide tu credencial, aquí aparecerán los servicios que te asignen.</p>';
        }

        for (var i = 0; i < mios.length; i++) {
            var s = mios[i];
            var a = buscar(adultos, s.idAdulto);

            if (s.estado == "finalizada") {
                terminados += "<tr><td>" + s.fecha.split("-").reverse().join("/") + "</td><td>" + limpiar(a.nombre) + "</td><td>" + tipos[s.tipo] + "</td><td>" + s.horas + "</td></tr>";
                continue;
            }
            if (s.estado == "cancelada") {
                continue;
            }
            hayActivos = true;

            var faltan = 0;
            for (var j = 0; j < s.pertenencias.length; j++) {
                if (s.pertenencias[j].salida && !s.pertenencias[j].regreso) faltan++;
            }

            html += '<div class="tarjeta-solicitud">' +
                "<h3>" + tipos[s.tipo] + " · " + limpiar(a.nombre) + "</h3>" +
                "<p>" + fechaBonita(s.fecha) + " a las " + s.hora + "</p>" +
                "<p>Sale de: " + limpiar(s.origen) + "</p>" +
                "<p>Va a: " + limpiar(s.destino) + "</p>" +
                (a.notas ? "<p>A tomar en cuenta: " + limpiar(a.notas) + "</p>" : "") +
                "<p>" + etiquetaEstado(s.estado) + "</p>";

            if (s.estado == "asignada") {
                html += '<button type="button" class="btn-grande" data-accion="aceptar" data-id="' + s.id + '">Acepto el servicio</button>' +
                    '<button type="button" class="btn-peligro" data-accion="rechazar" data-id="' + s.id + '">No puedo ir</button>';
            }
            if (s.estado == "confirmada") {
                html += '<button type="button" class="btn-grande" data-accion="camino" data-id="' + s.id + '">Voy en camino</button>';
            }
            if (s.estado == "en_camino") {
                html += '<div class="campo"><label for="codigo-' + s.id + '">Código que te da la persona</label>' +
                    '<input type="text" id="codigo-' + s.id + '" inputmode="numeric" maxlength="4"></div>' +
                    '<button type="button" class="btn-grande" data-accion="llegue" data-id="' + s.id + '">Ya estoy con la persona</button>';
            }
            if (s.estado == "en_tramite") {
                html += '<button type="button" class="btn-grande" data-accion="regreso" data-id="' + s.id + '">Vamos de regreso</button>';
            }
            if (s.estado == "de_regreso") {
                if (faltan > 0) {
                    html += '<p class="mensaje-error">Hay ' + faltan + " cosa(s) sin marcar en el regreso. Revisen la lista antes de terminar.</p>";
                }
                html += '<div class="campo"><label for="horas-' + s.id + '">¿Cuántas horas duró?</label>' +
                    '<input type="number" id="horas-' + s.id + '" min="1" max="8" value="3"></div>' +
                    '<button type="button" class="btn-grande" data-accion="terminar" data-id="' + s.id + '">Terminar servicio</button>';
            }
            if (s.estado != "asignada") {
                html += '<a href="checklist.html?id=' + s.id + '" class="btn-secundario">Lista de cosas</a>';
            }
            html += '<a href="seguimiento.html?id=' + s.id + '" class="btn-secundario">Ver detalle</a></div>';
        }

        if (!hayActivos && yo.validado) {
            html += "<p>No tienes servicios por atender. Cuando la coordinación te asigne uno, aparecerá aquí.</p>";
        }
        el("lista-servicios").innerHTML = html;
        el("filas-terminados").innerHTML = terminados || '<tr><td colspan="4">Todavía no terminas ningún servicio.</td></tr>';
        el("horas-total").textContent = yo.horas;
    }
    pintarServicios();

    el("lista-servicios").addEventListener("click", function (e) {
        var accion = e.target.getAttribute("data-accion");
        if (!accion) {
            return;
        }
        var sol = buscar(leer("solicitudes"), e.target.getAttribute("data-id"));

        if (accion == "aceptar") {
            cambiarEstado(sol, "confirmada", yo.nombre.split(" ")[0] + " aceptó el servicio");
        }
        if (accion == "rechazar") {
            if (!confirm("¿Seguro que no puedes ir? La coordinación va a buscar a alguien más.")) {
                return;
            }
            sol.idEstudiante = null;
            cambiarEstado(sol, "pendiente", yo.nombre.split(" ")[0] + " no pudo tomar el servicio");
        }
        if (accion == "camino") {
            cambiarEstado(sol, "en_camino", "");
        }
        if (accion == "llegue") {
            var codigo = el("codigo-" + sol.id).value.trim();
            if (codigo != sol.codigo) {
                alert("El código no coincide. Pídele a la persona que te lo enseñe otra vez.");
                return;
            }
            cambiarEstado(sol, "en_tramite", "Se confirmó el código de encuentro");
            alert("Código correcto. Antes de salir revisen juntos la lista de cosas.");
        }
        if (accion == "regreso") {
            cambiarEstado(sol, "de_regreso", "");
        }
        if (accion == "terminar") {
            var horas = parseInt(el("horas-" + sol.id).value);
            if (isNaN(horas) || horas < 1 || horas > 8) {
                alert("Escribe cuántas horas duró el servicio (de 1 a 8).");
                return;
            }
            if (!confirm("¿La persona ya está en su casa y revisaron la lista de cosas?")) {
                return;
            }
            sol.horas = horas;
            cambiarEstado(sol, "finalizada", "Llegó bien a casa");
            var usuarios = leer("usuarios");
            var miUsuario = buscar(usuarios, yo.id);
            miUsuario.horas = (miUsuario.horas || 0) + horas;
            guardar("usuarios", usuarios);
            yo = miUsuario;
            alert("Servicio terminado. Se sumaron " + horas + " horas a tu servicio social.");
        }
        pintarServicios();
    });
}

// Asignaciones
if (pagina == "asignaciones" && yo) {
    function pintarAsignaciones() {
        var solicitudes = leer("solicitudes");
        var adultos = leer("adultos");
        var usuarios = leer("usuarios");
        var alumnos = [];
        var html = "";

        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].rol == "estudiante") {
                alumnos.push(usuarios[i]);
            }
        }

        // Solicitudes sin asignar
        var opciones = '<option value="">Elige un alumno</option>';
        for (var j = 0; j < alumnos.length; j++) {
            if (alumnos[j].validado) {
                var ocupados = 0;
                for (var k = 0; k < solicitudes.length; k++) {
                    if (solicitudes[k].idEstudiante == alumnos[j].id && estaActiva(solicitudes[k])) ocupados++;
                }
                opciones += '<option value="' + alumnos[j].id + '">' + limpiar(alumnos[j].nombre) + " · " + limpiar(alumnos[j].horario) + " (" + ocupados + " activos)</option>";
            }
        }

        var pendientes = 0;
        for (var m = 0; m < solicitudes.length; m++) {
            var s = solicitudes[m];
            if (s.estado != "pendiente") {
                continue;
            }
            pendientes++;
            var a = buscar(adultos, s.idAdulto);
            html += '<div class="tarjeta-solicitud">' +
                "<h3>" + tipos[s.tipo] + " · " + limpiar(a.nombre) + "</h3>" +
                "<p>" + fechaBonita(s.fecha) + " a las " + s.hora + "</p>" +
                "<p>" + limpiar(s.origen) + " → " + limpiar(s.destino) + "</p>" +
                (a.notas ? "<p>A tomar en cuenta: " + limpiar(a.notas) + "</p>" : "") +
                '<div class="campo"><label for="alumno-' + s.id + '">Asignar a</label><select id="alumno-' + s.id + '">' + opciones + "</select></div>" +
                '<button type="button" class="btn-grande btn-asignar" data-id="' + s.id + '">Aprobar y asignar</button></div>';
        }
        if (pendientes == 0) {
            html = "<p>No hay solicitudes esperando.</p>";
        }
        el("lista-pendientes").innerHTML = html;

        // Alumnos
        var filas = "";
        for (var n = 0; n < alumnos.length; n++) {
            var al = alumnos[n];
            var prom = promedio(al.id);
            filas += "<tr><td><strong>" + limpiar(al.nombre) + "</strong><br>" + limpiar(al.correo) + "</td>" +
                "<td>" + limpiar(al.escuela) + "<br>Mat. " + limpiar(al.matricula) + "</td>" +
                "<td>" + calcularEdad(al.nacimiento) + " años</td>" +
                "<td>" + (al.credencial ? limpiar(al.credencial) : "Sin archivo") + "</td>" +
                "<td>" + (al.horas || 0) + "</td>" +
                "<td>" + (prom.total > 0 ? prom.valor.toFixed(1) + " ★" : "—") + "</td>" +
                "<td>" + (al.validado
                    ? '<span class="estado estado-confirmada">Validado</span><br><button type="button" class="btn-peligro btn-validar" data-id="' + al.id + '" data-valor="no">Quitar</button>'
                    : '<span class="estado estado-pendiente">Por validar</span><br><button type="button" class="btn-grande btn-validar" data-id="' + al.id + '" data-valor="si">Validar</button>') +
                "</td></tr>";
        }
        el("filas-alumnos").innerHTML = filas;
    }
    pintarAsignaciones();

    el("contenido").addEventListener("click", function (e) {
        var id = e.target.getAttribute("data-id");

        if (e.target.classList.contains("btn-asignar")) {
            var combo = el("alumno-" + id);
            if (combo.value == "") {
                alert("Elige a qué alumno se le asigna.");
                return;
            }
            var alumno = buscar(leer("usuarios"), combo.value);
            if (!confirm("¿Asignar este acompañamiento a " + alumno.nombre + "?")) {
                return;
            }
            var sol = buscar(leer("solicitudes"), id);
            sol.idEstudiante = alumno.id;
            cambiarEstado(sol, "asignada", "Se asignó a " + alumno.nombre);
            avisar("msg-asignar", "Listo. Se asignó a " + alumno.nombre + ". Ahora falta que acepte.", "ok");
            pintarAsignaciones();
        }

        if (e.target.classList.contains("btn-validar")) {
            var validar = e.target.getAttribute("data-valor") == "si";
            var pregunta = validar ? "¿Ya revisaste su credencial y que sea mayor de edad?" : "¿Quitar la validación? Ya no podrá recibir servicios nuevos.";
            if (!confirm(pregunta)) {
                return;
            }
            var usuarios = leer("usuarios");
            buscar(usuarios, id).validado = validar;
            guardar("usuarios", usuarios);
            pintarAsignaciones();
        }
    });
}

// Valoraciones
if (pagina == "valoraciones" && yo) {
    var usuariosVal = leer("usuarios");
    var adultosVal = leer("adultos");
    var solicitudesVal = leer("solicitudes");
    var idCalificar = parametro("id");
    var solCalificar = idCalificar ? buscar(solicitudesVal, idCalificar) : null;

    // Pendientes de calificar
    if (yo.rol == "adulto" || yo.rol == "familiar") {
        var mias = solicitudesDe(yo);
        var pendientesHtml = "";
        for (var i = 0; i < mias.length; i++) {
            if (mias[i].estado == "finalizada" && !yaValorada(mias[i].id)) {
                if (!solCalificar) {
                    solCalificar = mias[i];
                }
                var alu = buscar(usuariosVal, mias[i].idEstudiante);
                pendientesHtml += '<li><a href="valoraciones.html?id=' + mias[i].id + '">' + tipos[mias[i].tipo] + " del " + fechaBonita(mias[i].fecha) + " con " + limpiar(alu ? alu.nombre : "") + "</a></li>";
            }
        }
        if (pendientesHtml) {
            el("por-calificar").innerHTML = "<h2>Te falta calificar</h2><ul>" + pendientesHtml + "</ul>";
            el("por-calificar").classList.remove("oculto");
        }
    }

    var puedeCalificar = solCalificar && (yo.rol == "adulto" || yo.rol == "familiar") &&
        puedeVer(yo, solCalificar) && solCalificar.estado == "finalizada" && !yaValorada(solCalificar.id);

    if (puedeCalificar) {
        var alumnoCal = buscar(usuariosVal, solCalificar.idEstudiante);
        el("zona-calificar").classList.remove("oculto");
        el("datos-calificar").textContent = tipos[solCalificar.tipo] + " del " + fechaBonita(solCalificar.fecha) + ", con " + alumnoCal.nombre + ".";

        el("form-valorar").addEventListener("submit", function (e) {
            e.preventDefault();
            if (!revisar(this)) {
                return;
            }
            var lista = leer("valoraciones");
            lista.push({
                id: siguienteId(lista),
                idSolicitud: solCalificar.id,
                idEstudiante: solCalificar.idEstudiante,
                idAutor: yo.id,
                estrellas: parseInt(this.querySelector("input[name='estrellas']:checked").value),
                comentario: el("comentario").value.trim(),
                fecha: ahora().split(" ")[0]
            });
            guardar("valoraciones", lista);
            alert("¡Gracias! Tu calificación le sirve a otras familias.");
            window.location.href = "valoraciones.html";
        });
    }

    // Calificaciones por alumno
    var html = "";
    var valoraciones = leer("valoraciones");
    for (var u = 0; u < usuariosVal.length; u++) {
        var al = usuariosVal[u];
        if (al.rol != "estudiante") {
            continue;
        }
        if (yo.rol == "estudiante" && al.id != yo.id) {
            continue;
        }
        var prom = promedio(al.id);
        html += '<div class="caja"><div class="tarjeta-estudiante"><div class="foto-iniciales" aria-hidden="true">' + iniciales(al.nombre) + "</div><div>" +
            "<h3>" + limpiar(al.nombre) + "</h3>" +
            "<p>" + (prom.total > 0 ? estrellasTexto(prom.valor) + " " + prom.valor.toFixed(1) + " de 5 · " + prom.total + " calificación(es)" : "Todavía no tiene calificaciones.") + "</p>" +
            "</div></div>";
        for (var v = valoraciones.length - 1; v >= 0; v--) {
            if (valoraciones[v].idEstudiante != al.id) {
                continue;
            }
            var autor = buscar(usuariosVal, valoraciones[v].idAutor);
            html += '<div class="comentario"><p>' + estrellasTexto(valoraciones[v].estrellas) + "</p>" +
                "<p>" + (valoraciones[v].comentario ? limpiar(valoraciones[v].comentario) : "Sin comentario.") + "</p>" +
                '<p class="ayuda-campo">' + limpiar(autor ? autor.nombre : "") + " · " + valoraciones[v].fecha + "</p></div>";
        }
        html += "</div>";
    }
    el("lista-valoraciones").innerHTML = html;
    el("titulo-lista").textContent = yo.rol == "estudiante" ? "Lo que opinan de ti" : "Calificaciones de los alumnos";
}

// Perfil
if (pagina == "perfil" && yo) {
    el("nombre").value = yo.nombre;
    el("correo").value = yo.correo;
    el("telefono").value = yo.telefono;
    el("rol-texto").textContent = { adulto: "Adulto mayor", familiar: "Familiar", estudiante: "Alumno", coordinador: "Coordinación" }[yo.rol];

    if (yo.rol == "estudiante") {
        var promPerfil = promedio(yo.id);
        el("sec-alumno").classList.remove("oculto");
        el("horario").value = yo.horario || "";
        el("datos-alumno").innerHTML =
            "<p><strong>Escuela:</strong> " + limpiar(yo.escuela) + "</p>" +
            "<p><strong>Matrícula:</strong> " + limpiar(yo.matricula) + "</p>" +
            "<p><strong>Estado:</strong> " + (yo.validado ? '<span class="estado estado-confirmada">Validado</span>' : '<span class="estado estado-pendiente">En revisión</span>') + "</p>" +
            "<p><strong>Horas de servicio social:</strong> " + (yo.horas || 0) + "</p>" +
            "<p><strong>Calificación:</strong> " + (promPerfil.total > 0 ? promPerfil.valor.toFixed(1) + " de 5" : "sin calificaciones") + "</p>";
    }

    el("form-perfil").addEventListener("submit", function (e) {
        e.preventDefault();
        if (!revisar(this)) {
            return;
        }
        var usuarios = leer("usuarios");
        var correo = el("correo").value.trim().toLowerCase();
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].id != yo.id && (usuarios[i].correo.toLowerCase() == correo || usuarios[i].telefono == el("telefono").value.trim())) {
                avisar("msg-perfil", "Ese correo o teléfono ya lo usa otra cuenta.", "error");
                return;
            }
        }
        var u = buscar(usuarios, yo.id);
        u.nombre = el("nombre").value.trim();
        u.correo = correo;
        u.telefono = el("telefono").value.trim();
        if (u.rol == "estudiante") {
            u.horario = el("horario").value.trim();
        }
        guardar("usuarios", usuarios);

        if (u.rol == "adulto") {
            var adultos = leer("adultos");
            for (var j = 0; j < adultos.length; j++) {
                if (adultos[j].idUsuario == u.id) {
                    adultos[j].nombre = u.nombre;
                    adultos[j].telefono = u.telefono;
                }
            }
            guardar("adultos", adultos);
        }
        yo = u;
        armarMenu();
        avisar("msg-perfil", "Se guardaron tus datos.", "ok");
    });

    // Personas mayores a cargo
    if (yo.rol != "estudiante") {
        el("sec-personas").classList.remove("oculto");
        el("titulo-personas").textContent = yo.rol == "adulto" ? "Mis datos de salida" : (yo.rol == "familiar" ? "Mis familiares" : "Personas mayores registradas");
        if (yo.rol == "adulto") {
            el("form-persona").classList.add("oculto");
        }

        function pintarPersonas() {
            var lista = adultosDe(yo);
            var html = "";
            for (var i = 0; i < lista.length; i++) {
                var a = lista[i];
                html += '<div class="tarjeta-solicitud"><h3>' + limpiar(a.nombre) + ", " + a.edad + " años</h3>" +
                    "<p>Dirección: " + limpiar(a.direccion) + "</p>" +
                    (a.telefono ? "<p>Teléfono: " + limpiar(a.telefono) + "</p>" : "") +
                    (a.notas ? "<p>A tomar en cuenta: " + limpiar(a.notas) + "</p>" : "") +
                    '<a href="solicitar.html?adulto=' + a.id + '" class="btn-secundario">Pedir acompañamiento</a></div>';
            }
            el("lista-personas").innerHTML = html || "<p>Todavía no hay personas registradas.</p>";
        }
        pintarPersonas();

        el("form-persona").addEventListener("submit", function (e) {
            e.preventDefault();
            if (!revisar(this)) {
                return;
            }
            var adultos = leer("adultos");
            adultos.push({
                id: siguienteId(adultos),
                nombre: el("p-nombre").value.trim(),
                edad: parseInt(el("p-edad").value),
                telefono: el("p-telefono").value.trim(),
                direccion: el("p-direccion").value.trim(),
                notas: el("p-notas").value.trim(),
                idUsuario: null,
                idFamiliar: yo.rol == "familiar" ? yo.id : null
            });
            guardar("adultos", adultos);
            this.reset();
            pintarPersonas();
            avisar("msg-persona", "Listo, ya quedó registrada. Ya puedes pedir acompañamiento para ella.", "ok");
        });
    }

    el("btn-cerrar").addEventListener("click", cerrarSesion);
}