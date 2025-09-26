// MediShare Simplified 3-API Platform JavaScript

// Global application state
let currentPatient = null;
let patientDocuments = [];
let medicalTimeline = [];
let currentDoctorPatient = null;

// API Configuration - The 3 core APIs

const API_CONFIG = {
  upload: {
    url: 'https://karkode.com/upload',
    method: 'POST',
    description: 'Document processing and timeline generation'
  },
  chat: {
    url: 'https://katkode.com/chat',
    method: 'POST',
    description: 'AI-powered medical chat responses'
  },
  // keep the key name "timeline" for compatibility; it calls Details
  timeline: {
    url: 'https://katkode.com/details',
    method: 'GET',
    description: 'Medical timeline retrieval'
  }
};

const BEARER_TOKEN = 'saodifjoasdf';

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    ...extra,
  };
}

// Mock API responses from provided data
const MOCK_API_RESPONSES = {
    upload: {
        success: true,
        documentId: "doc-123",
        timeline: [
            {
                id: "evt-456",
                eventType: "lab_test", 
                title: "Laboratory Results",
                date: "2024-09-15",
                description: "Complete blood count - normal values",
                apiSource: "upload-api"
            }
        ]
    },
    chat: {
        success: true,
        response: "Based on the patient's lab results, all values appear within normal ranges...",
        confidence: 0.92,
        sources: ["Medical Timeline"]
    },
    timeline: {
        success: true,
        timeline: [
            {
                id: "evt-789",
                eventType: "prescription",
                title: "Medication Review", 
                date: "2024-09-10",
                description: "Metformin 500mg twice daily for diabetes management",
                apiSource: "timeline-api"
            }
        ],
        totalEvents: 3
    }
};

// Demo patient data from provided JSON
const DEMO_PATIENT_DATA = {
    name: "Sarah Johnson",
    id: "patient-simplified-001",
    documents: [
        {
            name: "Lab_Results.pdf",
            type: "lab_test", 
            processed: true
        }
    ],
    timeline: [
        {
            id: "event-001",
            date: "2024-09-15",
            type: "lab_test",
            title: "Lab Results - Complete Blood Count",
            description: "Hemoglobin 14.2 g/dL, WBC 7200/μL - All values normal",
            apiSource: "upload-api"
        },
        {
            id: "event-002", 
            date: "2024-09-10",
            type: "prescription",
            title: "Medication Prescribed",
            description: "Metformin 500mg twice daily",
            apiSource: "timeline-api"
        }
    ]
};

// Medical event type configurations
const EVENT_TYPES = {
    lab_test: { icon: "test-tube", color: "blue" },
    prescription: { icon: "pill", color: "green" },
    document: { icon: "file-text", color: "gray" }
};

// Chat response templates
const CHAT_RESPONSES = {
    "drug interactions": "I've analyzed the patient's medications using the Chat API. The combination of Metformin and current prescriptions shows no major drug interactions. Regular monitoring is recommended for optimal safety.",
    "lab results": "The Chat API analysis of recent lab results shows all values within normal ranges. Hemoglobin levels indicate good oxygen capacity, and metabolic markers suggest well-controlled diabetes management.",
    "medical history": "Based on Chat API analysis of the patient's timeline, there's a consistent pattern of good diabetes management with regular monitoring. Recent medication adjustments appear appropriate."
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    hideApiLoadingOverlay();
    loadPatientData();
    
    // Check for doctor access token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        verifyDoctorAccess(token);
    } else {
        showHome();
    }
    
    // Initialize icons
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
});

// Navigation functions
function showHome() {
    hideAllSections();
    document.getElementById('home').classList.add('active');
    window.history.pushState({}, '', window.location.pathname);
}

function showPatientPortal() {
    hideAllSections();
    document.getElementById('patient-portal').classList.add('active');
    
    if (currentPatient) {
        document.getElementById('patient-setup').classList.add('hidden');
        document.getElementById('patient-tabs').classList.remove('hidden');
        document.getElementById('patient-name-display').textContent = `Welcome, ${currentPatient.name}`;
    } else {
        document.getElementById('patient-setup').classList.remove('hidden');
        document.getElementById('patient-tabs').classList.add('hidden');
    }
}

function showDoctorAccess() {
    hideAllSections();
    document.getElementById('doctor-access').classList.add('active');
}

function showApiStatus() {
    hideAllSections();
    document.getElementById('api-status').classList.add('active');
}

function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
}

// Patient setup
function setupPatient() {
    const nameInput = document.getElementById('patient-name-input');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    currentPatient = {
        id: generateId(),
        name: name,
        createdAt: new Date().toISOString()
    };
    
    savePatientData();
    
    document.getElementById('patient-setup').classList.add('hidden');
    document.getElementById('patient-tabs').classList.remove('hidden');
    document.getElementById('patient-name-display').textContent = `Welcome, ${name}`;
    
    nameInput.value = '';
    
    // Load demo data
    loadDemoData();
}

// Tab navigation
function showTab(tabName) {
    const tabButtons = document.querySelectorAll('#patient-tabs .tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    const clickedButton = Array.from(tabButtons).find(btn => 
        btn.onclick && btn.onclick.toString().includes(tabName)
    );
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    document.querySelectorAll('#patient-tabs .tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    if (tabName === 'timeline') {
        renderTimeline();
    }
}

// File upload handling
function handleDragOver(event) {
    event.preventDefault();
}

function handleDragEnter(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    const files = event.dataTransfer.files;
    handleFiles(files);
}

// Process files using Upload API
function handleFiles(files) {
    if (files.length === 0) return;
    
    const uploadedFilesContainer = document.getElementById('uploaded-files');
    const apiCallStatus = document.getElementById('api-call-status');
    
    // Show API call status
    apiCallStatus.classList.remove('hidden');
    
    Array.from(files).forEach((file, index) => {
        const fileItem = createFileItem(file);
        uploadedFilesContainer.appendChild(fileItem);
        
        // Simulate API call delay
        setTimeout(() => {
            callUploadAPI(file, fileItem);
        }, 1000 + (index * 500));
    });
    
    // Hide API status after processing
    setTimeout(() => {
        apiCallStatus.classList.add('hidden');
        renderTimeline();
    }, 3000 + (files.length * 500));
}

function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item fade-in';
    fileItem.innerHTML = `
        <i data-lucide="file-text" class="file-icon"></i>
        <div class="file-info">
            <p class="file-name">${file.name}</p>
            <p class="file-size">${formatFileSize(file.size)}</p>
        </div>
        <div class="file-status status status--info">Uploading to API...</div>
    `;
    
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
    
    return fileItem;
}

// app.js — replace callUploadAPI with a real multipart upload
async function callUploadAPI(file, fileItemEl) {
  try {
    showApiLoadingOverlay(API_CONFIG.upload.url);

    const fd = new FormData();
    fd.append('file', file);

    const res = await fetch(API_CONFIG.upload.url, {
      method: 'POST',
      headers: authHeaders(), // fetch sets the multipart boundary automatically
      body: fd
    });

    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const json = await res.json();

    // Normalize and merge events from response
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

// Utility: normalize varying response shapes to the app’s event model
function normalizeTimeline(resp, defaults = {}) {
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
    apiSource: defaults.apiSource || evt.apiSource || 'api'
  }));
}

function mergeAndDedupeTimeline(events) {
  const byId = new Map();
  for (const e of events) {
    const k = e.id || `${e.date}:${e.title}`;
    if (!byId.has(k)) byId.set(k, e);
  }
  // Sort newest first by date
  return Array.from(byId.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function updateFileItemStatus(fileItemEl, status) {
  const statusEl = fileItemEl.querySelector('.file-status');
  if (statusEl) statusEl.textContent = status;
}

function processUploadResponse(fileName, mockResponse) {
    const eventData = mockResponse.timeline[0];
    return {
        type: eventData.eventType,
        title: eventData.title,
        description: `${eventData.description} - ${fileName}`,
        date: new Date(eventData.date),
        details: {
            fileName: fileName,
            apiResponse: mockResponse,
            source: 'Upload API'
        },
        apiSource: 'upload-api'
    };
}

// Timeline management
function addToTimeline(eventData) {
    const timelineEvent = {
        id: generateId(),
        ...eventData,
        addedAt: new Date().toISOString()
    };
    
    medicalTimeline.push(timelineEvent);
    medicalTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));
    savePatientData();
}

async function refreshTimeline() {
    showApiLoadingOverlay('Calling Timeline API...', API_CONFIG.timeline.url);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate Timeline API response
        const mockResponse = MOCK_API_RESPONSES.timeline;
        
        // Process timeline events from API
        const apiEvents = mockResponse.timeline.map(event => ({
            id: generateId(),
            type: event.eventType,
            title: event.title,
            description: event.description,
            date: new Date(event.date),
            apiSource: 'timeline-api',
            details: {
                source: 'Timeline API',
                totalEvents: mockResponse.totalEvents
            }
        }));
        
        // Add new events that aren't already in timeline
        apiEvents.forEach(event => {
            const exists = medicalTimeline.find(existing => 
                existing.title === event.title && existing.description === event.description
            );
            if (!exists) {
                medicalTimeline.push(event);
            }
        });
        
        medicalTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));
        savePatientData();
        renderTimeline();
        
    } catch (error) {
        console.error('Timeline API error:', error);
    } finally {
        hideApiLoadingOverlay();
    }
}

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    if (medicalTimeline.length === 0) {
        container.innerHTML = `
            <div class="timeline-empty">
                <i data-lucide="calendar"></i>
                <p>Upload documents to generate timeline via APIs</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        return;
    }
    
    const timelineHTML = medicalTimeline.map(event => `
        <div class="timeline-item fade-in">
            <div class="timeline-marker timeline-marker--${event.type}">
                <i data-lucide="${EVENT_TYPES[event.type]?.icon || 'file'}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <h4 class="timeline-title">${event.title}</h4>
                    <span class="timeline-date">${formatDate(event.date)}</span>
                </div>
                <p class="timeline-description">${event.description}</p>
                <div class="api-source-badge">
                    <i data-lucide="globe"></i>
                    ${event.apiSource || 'API'}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = timelineHTML;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Share link generation
function generateShareLink() {
    if (medicalTimeline.length === 0) {
        alert('Please upload some documents first to generate a shareable timeline.');
        return;
    }
    
    const duration = document.getElementById('access-duration').value;
    const token = generateSecureToken();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(duration));
    
    const shareData = {
        token: token,
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        timeline: medicalTimeline,
        documents: patientDocuments,
        expiryDate: expiryDate.toISOString(),
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(`medshare_access_${token}`, JSON.stringify(shareData));
    
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?token=${token}`;
    
    document.getElementById('generated-link').value = shareUrl;
    document.getElementById('expiry-days').textContent = duration;
    document.getElementById('share-link-result').classList.remove('hidden');
}

function copyLink() {
    const linkInput = document.getElementById('generated-link');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        const button = document.querySelector('#share-link-result button');
        const originalText = button.innerHTML;
        button.innerHTML = '<i data-lucide="check"></i> Copied!';
        button.classList.add('bg-success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('bg-success');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 2000);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (err) {
        alert('Failed to copy link. Please copy manually.');
    }
}

// Doctor access functions
function verifyAccess() {
    const tokenInput = document.getElementById('access-token-input');
    const token = tokenInput.value.trim();
    
    if (!token) {
        showAccessError('Please enter an access token');
        return;
    }
    
    verifyDoctorAccess(token);
}

function verifyDoctorAccess(token) {
    const shareDataStr = localStorage.getItem(`medshare_access_${token}`);
    
    if (!shareDataStr) {
        showAccessError('Invalid access token');
        return;
    }
    
    const shareData = JSON.parse(shareDataStr);
    
    if (new Date(shareData.expiryDate) < new Date()) {
        showAccessError('Access token has expired');
        return;
    }
    
    currentDoctorPatient = shareData;
    showDoctorInterface();
}

function showAccessError(message) {
    const errorElement = document.getElementById('access-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
}

function showDoctorInterface() {
    hideAllSections();
    document.getElementById('doctor-interface').classList.add('active');
    document.getElementById('doctor-patient-name').textContent = `Patient: ${currentDoctorPatient.patientName}`;
    renderDoctorTimeline();
}

// Doctor interface functions
function showDoctorTab(tabName) {
    const tabButtons = document.querySelectorAll('#doctor-interface .tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    const clickedButton = Array.from(tabButtons).find(btn => 
        btn.onclick && btn.onclick.toString().includes(tabName)
    );
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    document.querySelectorAll('#doctor-interface .tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`doctor-${tabName}-tab`).classList.add('active');
}

async function refreshDoctorTimeline() {
    showApiLoadingOverlay('Fetching latest from Timeline API...', API_CONFIG.timeline.url);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        renderDoctorTimeline();
    } catch (error) {
        console.error('Timeline API error:', error);
    } finally {
        hideApiLoadingOverlay();
    }
}

function renderDoctorTimeline() {
    const container = document.getElementById('doctor-timeline-container');
    if (!container || !currentDoctorPatient) return;
    
    const timeline = currentDoctorPatient.timeline || [];
    
    if (timeline.length === 0) {
        container.innerHTML = '<div class="timeline-empty"><p>No timeline data available from APIs</p></div>';
        return;
    }
    
    const timelineHTML = timeline.map(event => `
        <div class="timeline-item fade-in">
            <div class="timeline-marker timeline-marker--${event.type}">
                <i data-lucide="${EVENT_TYPES[event.type]?.icon || 'file'}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <h4 class="timeline-title">${event.title}</h4>
                    <span class="timeline-date">${formatDate(event.date)}</span>
                </div>
                <p class="timeline-description">${event.description}</p>
                <div class="api-source-badge">
                    <i data-lucide="globe"></i>
                    ${event.apiSource || 'API'}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = timelineHTML;
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function filterTimeline() {
    const filter = document.getElementById('timeline-filter').value;
    if (!currentDoctorPatient) return;
    
    const timeline = currentDoctorPatient.timeline || [];
    
    let filteredTimeline = timeline;
    if (filter !== 'all') {
        filteredTimeline = timeline.filter(event => event.type === filter);
    }
    
    const originalTimeline = currentDoctorPatient.timeline;
    currentDoctorPatient.timeline = filteredTimeline;
    renderDoctorTimeline();
    currentDoctorPatient.timeline = originalTimeline;
}

// Chat API functions
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function askQuickQuestion(questionType) {
    const input = document.getElementById('chat-input');
    
    const quickQuestions = {
        'drug interactions': 'Can you check for any drug interactions in this patient\'s medications?',
        'lab results': 'Can you analyze the recent lab results for this patient?',
        'medical history': 'Can you provide a summary of this patient\'s medical history?'
    };
    
    input.value = quickQuestions[questionType] || questionType;
    sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    const chatApiStatus = document.getElementById('chat-api-status');
    chatApiStatus.classList.remove('hidden');
    
    try {
        // Simulate Chat API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await callChatAPI(message);
        addChatMessage(response, 'assistant');
        
    } catch (error) {
        console.error('Chat API error:', error);
        addChatMessage('Sorry, there was an error calling the Chat API. Please try again.', 'assistant');
    } finally {
        chatApiStatus.classList.add('hidden');
    }
}

async function callChatAPI(message) {
    const lowerMessage = message.toLowerCase();
    
    // Return appropriate response based on message content
    if (lowerMessage.includes('drug') && lowerMessage.includes('interaction')) {
        return CHAT_RESPONSES['drug interactions'];
    }
    
    if (lowerMessage.includes('lab') && (lowerMessage.includes('result') || lowerMessage.includes('test'))) {
        return CHAT_RESPONSES['lab results'];
    }
    
    if (lowerMessage.includes('history') || lowerMessage.includes('summary')) {
        return CHAT_RESPONSES['medical history'];
    }
    
    // Default Chat API response
    return "I've processed your question through the Chat API at https://test.com/chat. Based on the available patient data from our APIs, I can provide insights about lab results, medications, and medical history. Please feel free to ask more specific questions.";
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message chat-message--${sender} fade-in`;
    messageElement.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// API Loading overlay functions
function showApiLoadingOverlay(text, endpoint) {
    const overlay = document.getElementById('api-loading-overlay');
    const textElement = document.getElementById('api-loading-text');
    const endpointElement = document.getElementById('api-loading-endpoint');
    
    if (overlay && textElement && endpointElement) {
        textElement.textContent = text;
        endpointElement.textContent = endpoint;
        overlay.classList.remove('hidden');
        overlay.classList.add('show');
    }
}

function hideApiLoadingOverlay() {
    const overlay = document.getElementById('api-loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
        overlay.classList.add('hidden');
    }
}

// Utility functions
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function generateSecureToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Data persistence
function savePatientData() {
    if (currentPatient) {
        const patientData = {
            patient: currentPatient,
            documents: patientDocuments,
            timeline: medicalTimeline
        };
        localStorage.setItem('medshare_patient_data', JSON.stringify(patientData));
    }
}

function loadPatientData() {
    const savedData = localStorage.getItem('medshare_patient_data');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            currentPatient = data.patient;
            patientDocuments = data.documents || [];
            medicalTimeline = data.timeline || [];
        } catch (e) {
            console.log('Error loading patient data:', e);
            currentPatient = null;
            patientDocuments = [];
            medicalTimeline = [];
        }
    }
}

// Load demo data for demonstration
function loadDemoData() {
    // Initialize with demo timeline events
    const demoTimeline = DEMO_PATIENT_DATA.timeline.map(event => ({
        id: generateId(),
        type: event.type,
        title: event.title,
        description: event.description,
        date: new Date(event.date),
        apiSource: event.apiSource,
        details: {
            source: event.apiSource === 'upload-api' ? 'Upload API' : 'Timeline API'
        }
    }));
    
    medicalTimeline = demoTimeline;
    savePatientData();
}
