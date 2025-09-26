// app.js — Final (real APIs, no mocks)

// Global application state
let currentPatient = null;
let patientDocuments = [];
let medicalTimeline = [];
let currentDoctorPatient = null;

// API configuration (real endpoints)
const API_CONFIG = {
  upload: {
    url: 'https://karkode.com/upload',
    method: 'POST',
    description: 'Document processing and timeline generation',
  },
  chat: {
    url: 'https://katkode.com/chat',
    method: 'POST',
    description: 'AI-powered medical chat responses',
  },
  // Keep key "timeline" for compatibility; it points to Details
  timeline: {
    url: 'https://katkode.com/details',
    method: 'GET',
    description: 'Medical timeline retrieval',
  },
};

// Bearer token for all calls
const BEARER_TOKEN = 'saodifjoasdf';

// Authorization header helper
function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    ...extra,
  };
}

// ========== File Upload ==========

async function callUploadAPI(file, fileItemEl) {
  try {
    showApiLoadingOverlay(API_CONFIG.upload.url);

    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch(API_CONFIG.upload.url, {
      method: 'POST',
      headers: authHeaders(), // fetch will add boundary for FormData automatically
      body: fd,
    });

    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const json = await res.json();

    const events = normalizeTimeline(json, { apiSource: 'upload-api' });
    if (events.length) {
      medicalTimeline = mergeAndDedupeTimeline([...medicalTimeline, ...events]);
      renderTimeline();
      updateFileItemStatus(fileItemEl, 'Processed via Upload API');
    } else {
      updateFileItemStatus(fileItemEl, 'Uploaded (no timeline events returned)');
    }
  } catch (err) {
    console.error(err);
    updateFileItemStatus(fileItemEl, 'Upload failed');
    showToast(`Upload error: ${err.message}`);
  } finally {
    hideApiLoadingOverlay();
  }
}

// Entry: drag-and-drop or input[type=file]
function handleFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const uploadedFilesContainer = document.getElementById('uploaded-files');
  const apiCallStatus = document.getElementById('api-call-status');

  if (apiCallStatus) apiCallStatus.classList.remove('hidden');

  files.forEach((file) => {
    const fileItem = createFileItem(file);
    uploadedFilesContainer?.appendChild(fileItem);
    callUploadAPI(file, fileItem);
  });

  // hide status area once all calls settle
  Promise.allSettled(files.map((f) => Promise.resolve())).finally(() => {
    if (apiCallStatus) apiCallStatus.classList.add('hidden');
  });
}

function createFileItem(file) {
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item fade-in';
  fileItem.innerHTML = `
    <div class="file-icon"><i data-lucide="file"></i></div>
    <div class="file-info">
      <p class="file-name">${escapeHtml(file.name)}</p>
      <p class="file-size">${formatFileSize(file.size)}</p>
      <p class="file-status">Uploading...</p>
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  return fileItem;
}

function updateFileItemStatus(fileItemEl, status) {
  const statusEl = fileItemEl?.querySelector('.file-status');
  if (statusEl) statusEl.textContent = status;
}

// ========== Chat ==========

async function sendChatMessage(userText) {
  try {
    showChatThinking(true);
    appendChatBubble({ role: 'user', content: userText });

    const payload = {
      message: userText,
      patientId: currentPatient?.id || null,
      timeline: medicalTimeline || [],
    };

    const res = await fetch(API_CONFIG.chat.url, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Chat failed (${res.status})`);
    const json = await res.json();
    const reply =
      json.response ??
      json.reply ??
      json.answer ??
      (typeof json === 'string' ? json : JSON.stringify(json));

    appendChatBubble({ role: 'assistant', content: String(reply) });
  } catch (err) {
    console.error(err);
    appendChatBubble({
      role: 'assistant',
      content: 'There was an error contacting the Chat API.',
    });
    showToast(`Chat error: ${err.message}`);
  } finally {
    showChatThinking(false);
  }
}

function appendChatBubble({ role, content }) {
  const container = document.querySelector('.chat-messages');
  if (!container) return;
  const wrapper = document.createElement('div');
  wrapper.className = `chat-message chat-message--${role}`;
  wrapper.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

function showChatThinking(isLoading) {
  const el = document.querySelector('.chat-api-status');
  if (!el) return;
  el.classList.toggle('hidden', !isLoading);
}

// ========== Timeline / Details ==========

async function refreshTimelineFromApi() {
  try {
    showApiLoadingOverlay(API_CONFIG.timeline.url);

    const res = await fetch(API_CONFIG.timeline.url, {
      method: 'GET',
      headers: authHeaders(),
    });

    if (!res.ok) throw new Error(`Details fetch failed (${res.status})`);
    const json = await res.json();
    const events = normalizeTimeline(json, { apiSource: 'timeline-api' });
    if (events.length) {
      medicalTimeline = mergeAndDedupeTimeline([...medicalTimeline, ...events]);
      renderTimeline();
    }
  } catch (err) {
    console.error(err);
    showToast(`Timeline error: ${err.message}`);
  } finally {
    hideApiLoadingOverlay();
  }
}

// ========== Timeline rendering helpers ==========

function renderTimeline() {
  const container = document.querySelector('.timeline-container');
  if (!container) return;

  container.innerHTML = '';

  if (!medicalTimeline?.length) {
    container.innerHTML = `
      <div class="timeline-empty">
        <i data-lucide="clock"></i>
        <p>No timeline data available from APIs</p>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  for (const evt of medicalTimeline) {
    const type = escapeHtml(evt.eventType || 'document');
    const title = escapeHtml(evt.title || 'Event');
    const date = escapeHtml(evt.date || '');
    const desc = escapeHtml(evt.description || '');
    const apiSource = escapeHtml(evt.apiSource || 'api');

    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-marker timeline-marker--${type}">
        <i data-lucide="${iconForType(type)}"></i>
      </div>
      <div class="timeline-content">
        <div class="timeline-header">
          <h4 class="timeline-title">${title}</h4>
          <span class="timeline-date">${date}</span>
        </div>
        <p class="timeline-description">${desc}</p>
        <span class="api-source-badge">
          <i data-lucide="server"></i> ${apiSource}
        </span>
      </div>
    `;
    container.appendChild(item);
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function iconForType(t) {
  switch (t) {
    case 'lab_test':
      return 'test-tube';
    case 'prescription':
      return 'pill';
    default:
      return 'file-text';
  }
}

// ========== Normalization, utilities, and UX ==========

function normalizeTimeline(resp, defaults = {}) {
  // Try common containers
  const candidate =
    resp?.timeline ??
    resp?.data?.timeline ??
    resp?.events ??
    [];

  if (!Array.isArray(candidate)) return [];

  return candidate.map((evt) => ({
    id: evt.id || generateId(),
    eventType: evt.eventType || evt.type || 'document',
    title: evt.title || 'Document Processed',
    date: evt.date || new Date().toISOString().slice(0, 10),
    description: evt.description || '',
    apiSource: defaults.apiSource || evt.apiSource || 'api',
  }));
}

function mergeAndDedupeTimeline(events) {
  const byId = new Map();
  for (const e of events) {
    const k = e.id || `${e.date}:${e.title}`;
    if (!byId.has(k)) byId.set(k, e);
  }
  return Array.from(byId.values()).sort((a, b) =>
    (b.date || '').localeCompare(a.date || '')
  );
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '';
  const kb = 1024;
  const mb = kb * 1024;
  if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`;
  if (bytes >= kb) return `${(bytes / kb).toFixed(1)} KB`;
  return `${bytes} B`;
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function generateId() {
  return 'evt-' + Math.random().toString(36).slice(2, 10);
}

function showApiLoadingOverlay(endpoint) {
  const overlay = document.querySelector('.loading-overlay');
  const label = document.querySelector('.api-loading-endpoint');
  if (label && endpoint) label.textContent = endpoint;
  overlay?.classList.add('show');
  overlay?.classList.remove('hidden');
}

function hideApiLoadingOverlay() {
  const overlay = document.querySelector('.loading-overlay');
  overlay?.classList.remove('show');
  overlay?.classList.add('hidden');
}

function showToast(msg) {
  // Minimal toast via alert; project may already have a richer toast system
  console.warn('Toast:', msg);
}

// Expose core functions if HTML uses inline handlers
window.handleFiles = handleFiles;
window.sendChatMessage = sendChatMessage;
window.refreshTimelineFromApi = refreshTimelineFromApi;
