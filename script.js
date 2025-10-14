// ---------- UTILIDADES ----------
function getGrupos() {
  return JSON.parse(localStorage.getItem("grupos") || "[]");
}
function saveGrupos(arr) {
  localStorage.setItem("grupos", JSON.stringify(arr));
}
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
function goTo(role) {
  // redirecciones simples desde index (no hay autenticación real en esta demo)
  if (role === "profesor") window.location.href = "profesor.html";
  else window.location.href = "alumno.html";
}

// ---------- INDEX (no JS necesario aquí) ----------

// ---------- PROFESOR PAGE ----------
document.addEventListener("DOMContentLoaded", () => {
  // detectar si estamos en profesor.html
  const formCrearGrupo = document.getElementById("formCrearGrupo");
  if (formCrearGrupo) {
    mostrarListaGruposProfesor();

    formCrearGrupo.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = document.getElementById("profNombre").value.trim();
      const apellido = document.getElementById("profApellido").value.trim();
      const materia = document.getElementById("profMateria").value.trim();

      if (!nombre || !apellido || !materia) {
        alert("Complete todos los campos para crear el grupo.");
        return;
      }

      const grupos = getGrupos();
      const id = newId();
      const grupo = {
        id,
        profNombre: nombre,
        profApellido: apellido,
        materia,
        createdAt: new Date().toISOString(),
        alumnos: [] // aquí guardamos los alumnos que se unan
      };
      grupos.push(grupo);
      saveGrupos(grupos);

      // redirigir a la página del grupo creado
      window.location.href = `grupo.html?groupId=${encodeURIComponent(id)}`;
    });
  }

  // ---------- GRUPO PAGE ----------
  const groupTitle = document.getElementById("groupTitle");
  if (groupTitle) {
    // obtener id del query param
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("groupId");
    if (!groupId) {
      groupTitle.textContent = "Grupo no encontrado";
      return;
    }
    renderGrupo(groupId);
  }

  // ---------- ALUMNO PAGE ----------
  const buscarBtn = document.getElementById("buscarMateria");
  if (buscarBtn) {
    // al entrar no hacer nada; buscar se realiza con el botón
    // también podemos mostrar todos si se deja vacío
    document.getElementById("buscarMateria").addEventListener("keyup", (e) => {
      // si presionan Enter
      if (e.key === "Enter") buscarGrupos();
    });
  }
});

// mostrar lista de grupos en profesor.html
function mostrarListaGruposProfesor() {
  const lista = document.getElementById("listaGrupos");
  const sin = document.getElementById("sinGrupos");
  if (!lista) return;
  const grupos = getGrupos();
  lista.innerHTML = "";
  if (grupos.length === 0) {
    sin.style.display = "block";
    return;
  } else {
    sin.style.display = "none";
  }

  grupos.forEach(g => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.style.flex = "1";
    left.innerHTML = `<strong>${escapeHtml(g.materia)}</strong><br><span class="muted">Profesor: ${escapeHtml(g.profNombre)} ${escapeHtml(g.profApellido)}</span>`;
    const buttons = document.createElement("div");

    const btnVer = document.createElement("button");
    btnVer.className = "btn small";
    btnVer.textContent = "Ver";
    btnVer.onclick = () => window.location.href = `grupo.html?groupId=${encodeURIComponent(g.id)}`;

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn small outline";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.onclick = () => {
      if (confirm("¿Eliminar este grupo? Se perderán los registros asociados.")) {
        const nuevos = getGrupos().filter(x => x.id !== g.id);
        saveGrupos(nuevos);
        mostrarListaGruposProfesor();
      }
    };

    buttons.appendChild(btnVer);
    buttons.appendChild(btnEliminar);
    li.appendChild(left);
    li.appendChild(buttons);
    lista.appendChild(li);
  });
}

// render grupo en grupo.html
function renderGrupo(groupId) {
  const grupos = getGrupos();
  const g = grupos.find(x => x.id === groupId);
  const groupTitle = document.getElementById("groupTitle");
  const groupInfo = document.getElementById("groupInfo");
  const alumnosList = document.getElementById("alumnosList");
  const sinAlumnos = document.getElementById("sinAlumnos");

  if (!g) {
    groupTitle.textContent = "Grupo no encontrado";
    groupInfo.textContent = "";
    return;
  }

  groupTitle.textContent = `${g.materia}`;
  groupInfo.textContent = `Profesor: ${g.profNombre} ${g.profApellido} • Creado: ${new Date(g.createdAt).toLocaleString()}`;

  alumnosList.innerHTML = "";
  if (!g.alumnos || g.alumnos.length === 0) {
    sinAlumnos.style.display = "block";
    return;
  } else {
    sinAlumnos.style.display = "none";
  }

  g.alumnos.forEach((a, idx) => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.style.flex = "1";
    left.innerHTML = `<strong>${escapeHtml(a.nombre)} ${escapeHtml(a.apellido)}</strong><br>
                      <span class="muted">Cel: ${escapeHtml(a.celular)} • ${formatDateTime(a.fechaHora)}</span>`;
    li.appendChild(left);

    // botón para marcar asistencia manualmente (opcional)
    const btn = document.createElement("button");
    btn.className = "btn small";
    btn.textContent = "Presente";
    btn.onclick = () => {
      // marcar la asistencia (podemos guardar un campo presente = true)
      const grupos = getGrupos();
      const grupoLocal = grupos.find(x => x.id === groupId);
      if (!grupoLocal.alumnos[idx].presente) {
        grupoLocal.alumnos[idx].presente = true;
        saveGrupos(grupos);
        alert(`${a.nombre} marcado como presente.`);
        renderGrupo(groupId);
      } else {
        alert(`${a.nombre} ya está marcado como presente.`);
      }
    };

    // indicador si ya está presente
    if (a.presente) {
      const badge = document.createElement("span");
      badge.textContent = "Presente";
      badge.style.marginLeft = "8px";
      badge.style.padding = "4px 8px";
      badge.style.borderRadius = "8px";
      badge.style.background = "#dcfce7";
      badge.style.color = "#166534";
      li.appendChild(badge);
    } else {
      li.appendChild(btn);
    }

    alumnosList.appendChild(li);
  });
}

// ---------- ALUMNO PAGE ----------
function buscarGrupos() {
  const input = document.getElementById("buscarMateria").value.trim().toLowerCase();
  const resultados = document.getElementById("resultados");
  const sinResultados = document.getElementById("sinResultados");
  resultados.innerHTML = "";

  const grupos = getGrupos();
  const encontrados = grupos.filter(g => g.materia.toLowerCase().includes(input));

  if (encontrados.length === 0) {
    sinResultados.style.display = "block";
    return;
  } else {
    sinResultados.style.display = "none";
  }

  encontrados.forEach(g => {
    const li = document.createElement("li");
    const left = document.createElement("div");
    left.style.flex = "1";
    left.innerHTML = `<strong>${escapeHtml(g.materia)}</strong><br><span class="muted">Profesor: ${escapeHtml(g.profNombre)} ${escapeHtml(g.profApellido)}</span>`;

    const btn = document.createElement("button");
    btn.className = "btn small";
    btn.textContent = "Unirse";
    btn.onclick = () => mostrarFormularioUnirse(g.id);

    li.appendChild(left);
    li.appendChild(btn);
    resultados.appendChild(li);
  });
}

// mostrar modal / prompt para unirse (simple)
function mostrarFormularioUnirse(groupId) {
  // Creamos una forma sencilla usando prompt() o un pequeño form dinámico
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.right = "0";
  container.style.bottom = "0";
  container.style.background = "rgba(0,0,0,0.45)";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.zIndex = "9999";

  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.padding = "16px";
  box.style.borderRadius = "12px";
  box.style.width = "360px";
  box.innerHTML = `
    <h3>Unirse al grupo</h3>
    <input id="a_nombre" placeholder="Tu nombre" style="width:100%;margin:8px 0;padding:8px;border-radius:8px;border:1px solid #ddd">
    <input id="a_apellido" placeholder="Tu apellido" style="width:100%;margin:8px 0;padding:8px;border-radius:8px;border:1px solid #ddd">
    <input id="a_celular" placeholder="Número de celular" style="width:100%;margin:8px 0;padding:8px;border-radius:8px;border:1px solid #ddd">
    <label style="display:block;font-size:13px;color:#64748b;margin-top:6px">Fecha y hora (cuando te presentás)</label>
    <input id="a_fechaHora" type="datetime-local" style="width:100%;margin:8px 0;padding:8px;border-radius:8px;border:1px solid #ddd">
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
      <button id="cancelJoin" class="btn outline small">Cancelar</button>
      <button id="confirmJoin" class="btn small">Unirme</button>
    </div>
  `;

  container.appendChild(box);
  document.body.appendChild(container);

  document.getElementById("cancelJoin").onclick = () => document.body.removeChild(container);

  document.getElementById("confirmJoin").onclick = () => {
    const nombre = document.getElementById("a_nombre").value.trim();
    const apellido = document.getElementById("a_apellido").value.trim();
    const celular = document.getElementById("a_celular").value.trim();
    const fechaHora = document.getElementById("a_fechaHora").value;

    if (!nombre || !apellido || !celular || !fechaHora) {
      alert("Complete todos los campos para unirse.");
      return;
    }

    const grupos = getGrupos();
    const grupo = grupos.find(g => g.id === groupId);
    if (!grupo) {
      alert("Grupo no encontrado.");
      document.body.removeChild(container);
      return;
    }

    // añadir alumno al grupo
    grupo.alumnos = grupo.alumnos || [];
    grupo.alumnos.push({
      id: newId(),
      nombre,
      apellido,
      celular,
      fechaHora,
      presente: false
    });
    saveGrupos(grupos);

    alert(`Te uniste al grupo ${grupo.materia}`);
    document.body.removeChild(container);
  };
}

// ---------- HELPERS ----------
function formatDateTime(v) {
  try {
    const d = new Date(v);
    return d.toLocaleString();
  } catch {
    return v;
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
