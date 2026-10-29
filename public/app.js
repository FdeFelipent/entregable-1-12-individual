const state = { resource: 'users', users: [], pets: [], editing: null, noticeTimer: null };
const resourceConfig = {
  users: {
    singular: 'usuario', plural: 'usuarios', label: 'Usuarios', endpoint: '/api/users',
    title: 'Personas', copy: 'Encuentra personas que comparten el cariño y el compromiso por los animales.'
  },
  pets: {
    singular: 'mascota', plural: 'mascotas', label: 'Mascotas', endpoint: '/api/pets',
    title: 'Mascotas', copy: 'Cada mascota tiene una historia y merece encontrar un hogar lleno de cariño.'
  }
};

const API_BASE = location.port === '5500' ? 'http://localhost:8080' : '';
const apiUrl = (path) => `${API_BASE}${path}`;
const assetUrl = (path) => `${API_BASE}${path}`;
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const currentConfig = () => resourceConfig[state.resource];
const records = () => state[state.resource];

function showNotice(message, isError = false) {
  const notice = document.getElementById('notice');
  notice.textContent = message;
  notice.classList.toggle('error', isError);
  notice.hidden = false;
  clearTimeout(state.noticeTimer);
  state.noticeTimer = setTimeout(() => { notice.hidden = true; }, 4200);
}

async function request(url, options = {}) {
  const response = await fetch(apiUrl(url), options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof data === 'object' && data.error ? data.error : `Error HTTP ${response.status}`;
    throw new Error(message);
  }
  return { data, status: response.status };
}

function updateMetrics() {
  const imageCount = state.users.filter((user) => user.avatar).length + state.pets.reduce((total, pet) => total + (pet.img || []).length, 0);
  document.getElementById('usersMetric').textContent = state.users.length;
  document.getElementById('petsMetric').textContent = state.pets.length;
  document.getElementById('imagesMetric').textContent = imageCount;
}

async function loadRecords() {
  try {
    const results = await Promise.all([
      request('/api/users'),
      request('/api/pets')
    ]);
    state.users = results[0].data;
    state.pets = results[1].data;
    document.getElementById('connectionText').textContent = 'Conectado';
    document.getElementById('connectionDot').classList.remove('offline');
    updateMetrics();
    renderList();
  } catch (error) {
    document.getElementById('connectionText').textContent = 'Sin conexión';
    document.getElementById('connectionDot').classList.add('offline');
    document.getElementById('recordList').innerHTML = `<div class="empty"><div class="empty-mark">!</div><h3>No pudimos cargar los registros</h3><p>Inicia el servidor de Macotafy y vuelve a intentarlo. Tus datos no se guardan mientras esté desconectado.</p></div>`;
    showNotice('Inicia Macotafy con npm start y abre localhost:8080. Si usas Live Server, déjalo abierto en el puerto 5500.', true);
  }
}

function renderList() {
  const config = currentConfig();
  const items = records();
  document.getElementById('crumbCurrent').textContent = config.label;
  document.getElementById('pageTitle').textContent = config.title;
  document.getElementById('pageCopy').textContent = config.copy;
  document.getElementById('listTitle').textContent = state.resource === 'users' ? 'Personas de la comunidad' : 'Mascotas que buscan familia';
  document.getElementById('listSubtitle').textContent = state.resource === 'users' ? 'Conoce a quienes ya son parte de Macotafy' : 'Descubre a nuestros amigos de cuatro patas';
  document.getElementById('resultCount').textContent = `${items.length} ${items.length === 1 ? 'registro' : 'registros'}`;
  document.querySelectorAll('[data-resource]').forEach((button) => button.classList.toggle('active', button.dataset.resource === state.resource));
  document.getElementById('formTitle').textContent = state.editing ? `Editar ${config.singular}` : state.resource === 'users' ? 'Crear perfil' : 'Agregar una mascota';
  document.getElementById('formSubtitle').textContent = state.editing ? 'Actualiza la información' : 'Los campos con * son obligatorios';
  document.getElementById('recordList').innerHTML = items.length ? items.map(renderRecord).join('') : `<div class="empty"><div class="empty-mark">${state.resource === 'users' ? '◉' : '⌂'}</div><h3>Aún no hay ${config.plural}</h3><p>Cuando agregues ${config.plural}, aparecerán aquí.</p></div>`;
  renderForm();
}

function renderRecord(item) {
  const isUser = state.resource === 'users';
  const displayName = isUser ? `${item.firstname} ${item.lastname}` : `${item.especie} · ${item.color}`;
  const detail = isUser ? `@${item.username}` : `${item.edad} años · ${item.sexo}`;
  const imagePaths = isUser ? (item.avatar ? [item.avatar] : []) : (item.img || []);
  const portrait = imagePaths.length
    ? `<a class="route-link" href="${escapeHTML(assetUrl(imagePaths[0]))}" target="_blank" rel="noreferrer" aria-label="Abrir imagen"><img class="record-image" src="${escapeHTML(assetUrl(imagePaths[0]))}" alt="Imagen de ${escapeHTML(displayName)}"></a>`
    : `<span class="record-placeholder" aria-hidden="true">${isUser ? '◉' : '⌂'}</span>`;
  const fileLink = imagePaths.length ? `<div class="record-route"><span>${imagePaths.length === 1 ? 'Con foto' : `${imagePaths.length} fotos`}</span></div>` : '<div class="record-route"><span>Sin foto</span></div>';
  return `<article class="record"><div>${portrait}</div><div><p class="record-name">${escapeHTML(displayName)}</p><p class="record-detail">#${item.id} · ${escapeHTML(detail)}</p>${fileLink}</div><div class="record-actions"><button class="quiet-button" type="button" data-edit="${item.id}">Editar</button><button class="danger-button" type="button" data-delete="${item.id}">Eliminar</button></div></article>`;
}

function renderForm() {
  const item = state.editing ? records().find((record) => record.id === state.editing) : null;
  const body = document.getElementById('formBody');
  const imagePreview = item && state.resource === 'users' && item.avatar
    ? `<div class="current-images"><a href="${escapeHTML(assetUrl(item.avatar))}" target="_blank" rel="noreferrer"><img src="${escapeHTML(assetUrl(item.avatar))}" alt="Foto actual"></a></div>`
    : item && state.resource === 'pets' && item.img?.length
      ? `<div class="current-images">${item.img.map((image, index) => `<a href="${escapeHTML(assetUrl(image))}" target="_blank" rel="noreferrer"><img src="${escapeHTML(assetUrl(image))}" alt="Foto actual ${index + 1}"></a>`).join('')}</div>`
      : '';
  const userFields = `
    <div class="field"><label for="firstname">Nombre <span class="required-mark" aria-label="obligatorio">*</span></label><input id="firstname" name="firstname" value="${escapeHTML(item?.firstname || '')}" required></div>
    <div class="field"><label for="lastname">Apellido <span class="required-mark" aria-label="obligatorio">*</span></label><input id="lastname" name="lastname" value="${escapeHTML(item?.lastname || '')}" required></div>
    <div class="field full"><label for="username">Nombre de usuario <span class="required-mark" aria-label="obligatorio">*</span></label><input id="username" name="username" value="${escapeHTML(item?.username || '')}" required autocomplete="username"></div>
    <div class="field full"><label for="password">${item ? 'Nueva contraseña (opcional)' : 'Contraseña'}${item ? '' : ' <span class="required-mark" aria-label="obligatorio">*</span>'}</label><input id="password" name="password" type="password" ${item ? '' : 'required'} autocomplete="new-password" placeholder="${item ? 'Déjala vacía para conservarla' : 'Escribe una contraseña'}"></div>
    <div class="field full"><label for="avatar">Foto de perfil (opcional)</label><input id="avatar" name="avatar" type="file" accept="image/*"><p class="field-note">Puedes elegir una imagen.</p>${imagePreview}</div>`;
  const petFields = `
    <div class="field"><label for="especie">Especie <span class="required-mark" aria-label="obligatorio">*</span></label><input id="especie" name="especie" value="${escapeHTML(item?.especie || '')}" placeholder="Perro" required></div>
    <div class="field"><label for="sexo">Sexo <span class="required-mark" aria-label="obligatorio">*</span></label><select id="sexo" name="sexo" required><option value="">Seleccionar</option><option value="macho" ${item?.sexo === 'macho' ? 'selected' : ''}>Macho</option><option value="hembra" ${item?.sexo === 'hembra' ? 'selected' : ''}>Hembra</option></select></div>
    <div class="field"><label for="color">Color <span class="required-mark" aria-label="obligatorio">*</span></label><input id="color" name="color" value="${escapeHTML(item?.color || '')}" placeholder="Negro con manchas" required></div>
    <div class="field"><label for="edad">Edad <span class="required-mark" aria-label="obligatorio">*</span></label><input id="edad" name="edad" type="number" min="0" step="1" value="${escapeHTML(item?.edad ?? '')}" required></div>
    <div class="field full"><label for="img">Fotos (opcional)</label><input id="img" name="img" type="file" accept="image/*" multiple><p class="field-note">Agrega fotos para que la conozcan mejor.</p>${imagePreview}</div>`;
  body.innerHTML = `<div class="form-mode">${item ? `Editando registro #${item.id}` : 'Nuevo integrante'}</div><form id="recordForm" enctype="multipart/form-data"><div class="field-grid">${state.resource === 'users' ? userFields : petFields}</div><div class="form-actions"><button class="primary-button" type="submit">${item ? 'Guardar cambios' : `Crear ${currentConfig().singular}`}</button>${item ? '<button class="quiet-button" id="cancelEdit" type="button">Cancelar</button>' : ''}</div><p class="form-message" id="formMessage" aria-live="polite"></p></form>`;
  document.getElementById('recordForm').addEventListener('submit', submitForm);
  document.getElementById('cancelEdit')?.addEventListener('click', () => { state.editing = null; renderList(); });
}

async function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.getElementById('formMessage');
  const data = new FormData(form);
  if (state.resource === 'users' && state.editing && !data.get('password')) data.delete('password');
  const url = `${currentConfig().endpoint}${state.editing ? `/${state.editing}` : ''}`;
  const method = state.editing ? 'PUT' : 'POST';
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Guardando…';
  message.className = 'form-message';
  message.textContent = 'Guardando…';
  try {
    await request(url, { method, body: data });
    state.editing = null;
    await loadRecords();
    showNotice('Se guardó correctamente.');
  } catch (error) {
    message.classList.add('error');
    message.textContent = error.message;
    submitButton.disabled = false;
    submitButton.textContent = method === 'POST' ? `Crear ${currentConfig().singular}` : 'Guardar cambios';
  }
}

async function deleteRecord(id) {
  const config = currentConfig();
  const item = records().find((record) => record.id === Number(id));
  if (!item || !confirm(`¿Eliminar ${config.singular} #${id}? Esta acción no se puede deshacer.`)) return;
  try {
    await request(`${config.endpoint}/${id}`, { method: 'DELETE' });
    if (state.editing === Number(id)) state.editing = null;
    await loadRecords();
    showNotice(state.resource === 'users' ? 'Perfil eliminado.' : 'Mascota eliminada.');
  } catch (error) {
    showNotice(error.message, true);
  }
}

document.querySelectorAll('[data-resource]').forEach((button) => button.addEventListener('click', () => {
  state.resource = button.dataset.resource;
  state.editing = null;
  renderList();
}));
document.getElementById('refreshButton').addEventListener('click', loadRecords);
document.getElementById('recordList').addEventListener('click', (event) => {
  const editButton = event.target.closest('[data-edit]');
  const deleteButton = event.target.closest('[data-delete]');
  if (editButton) {
    state.editing = Number(editButton.dataset.edit);
    renderList();
  }
  if (deleteButton) deleteRecord(deleteButton.dataset.delete);
});

renderList();
loadRecords();