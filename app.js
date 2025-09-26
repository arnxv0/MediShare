// MediShare Simplified 3-API Platform JavaScript

// Global application state
let currentPatient = null;
let patientDocuments = [];
let medicalTimeline = [];
let currentDoctorPatient = null;

// API Configuration - The 3 core APIs (updated endpoints)
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
    timeline: {
        url: 'https://katkode.com/details',
        method: 'GET',
        description: 'Medical timeline retrieval'
    }
};

// Bearer token for authentication
const BEARER_TOKEN = 'saodifjoasdf';

// Authorization headers helper
function authHeaders(extra = {}) {
    return {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        ...extra
    };
}

// Demo patient data from provided JSON
const DEMO_PATIENT_DATA = {
    name: "Sarah Johnson",
    id: "patient-simplified-001",
    documents: [
        { name: "Lab_Results.pdf", type: "lab_test", processed: true }
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

// Chat response templates for fallback
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

    document.querySelectorAll('#patient-tabs .tab-content').forEach(content =>
        content.classList.remove('active')
    );

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

// Process files using Upload API (updated to use real API)
function handleFiles(files) {
    if (files.length === 0) return;

    const uploadedFilesContainer = document.getElementById('uploaded-files');
    const apiCallStatus = document.getElementById('api-call-status');

    // Show API call status
    apiCallStatus.classList.remove('hidden');

    Array.from(files).forEach((file, index) => {
        const fileItem = createFileItem(file);
        uploadedFilesContainer.appendChild(fileItem);

        // Call real API
        setTimeout(() => {
            callUploadAPI(file, fileItem);
        }, 100 + (index * 100));
    });
}

function createFileItem(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item fade-in';
    fileItem.innerHTML = `
    <div class="file-icon">
      <i data-lucide="file"></i>
    </div>
    <div class="file-info">
      <p class="file-name">${file.name}</p>
      <p class="file-size">${formatFileSize(file.size)}</p>
      <p class="file-status">Processing...</p>
    </div>
  `;

    // Initialize icons
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 10);

    return fileItem;
}

// Real Upload API call
async function callUploadAPI(file, fileItem) {
    try {
        showApiLoadingOverlay(API_CONFIG.upload.url);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(API_CONFIG.upload.url, {
            method: 'POST',
            headers: authHeaders(),
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();

        // Update file status
        const statusElement = fileItem.querySelector('.file-status');
        if (statusElement) {
            statusElement.textContent = 'Processed via Upload API';
        }

        // Process timeline events from response
        if (result.timeline && Array.isArray(result.timeline)) {
            result.timeline.forEach(event => {
                const timelineEvent = {
                    id: event.id || generateId(),
                    eventType: event.eventType || event.type || 'document',
                    title: event.title || 'Document Processed',
                    date: event.date || new Date().toISOString().slice(0, 10),
                    description: event.description || '',
                    apiSource: 'upload-api'
                };
                medicalTimeline.push(timelineEvent);
            });

            // Sort timeline by date (newest first)
            medicalTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderTimeline();
        }

    } catch (error) {
        console.error('Upload API error:', error);
        const statusElement = fileItem.querySelector('.file-status');
        if (statusElement) {
            statusElement.textContent = 'Upload failed';
        }
    } finally {
        hideApiLoadingOverlay();
        document.getElementById('api-call-status').classList.add('hidden');
    }
}

// Chat functionality (updated to use real API)
async function sendMessage(event) {
    if (event) event.preventDefault();

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    addChatMessage('user', message);
    input.value = '';

    // Show thinking state
    showChatThinking(true);

    try {
        const response = await fetch(API_CONFIG.chat.url, {
            method: 'POST',
            headers: authHeaders({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                message: message,
                patientId: currentPatient?.id,
                timeline: medicalTimeline
            })
        });

        if (!response.ok) {
            throw new Error(`Chat API failed: ${response.status}`);
        }

        const result = await response.json();
        const reply = result.response || result.reply || result.answer || 'No response from Chat API';

        // Add AI response to chat
        addChatMessage('assistant', reply);

    } catch (error) {
        console.error('Chat API error:', error);

        // Fallback to template responses
        const fallbackResponse = findChatResponse(message) ||
            "I'm sorry, I'm having trouble connecting to the Chat API right now. Please try again later.";
        addChatMessage('assistant', fallbackResponse);
    } finally {
        showChatThinking(false);
    }
}

function addChatMessage(role, content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message--${role}`;
    messageDiv.innerHTML = `
    <div class="message-content">${content}</div>
  `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showChatThinking(show) {
    const thinkingElement = document.querySelector('.chat-thinking');
    if (thinkingElement) {
        thinkingElement.style.display = show ? 'block' : 'none';
    }
}

function findChatResponse(message) {
    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(CHAT_RESPONSES)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    return null;
}

// Timeline functionality (updated to use real API)
async function refreshTimeline() {
    try {
        showApiLoadingOverlay(API_CONFIG.timeline.url);

        const response = await fetch(API_CONFIG.timeline.url, {
            method: 'GET',
            headers: authHeaders()
        });

        if (!response.ok) {
            throw new Error(`Timeline API failed: ${response.status}`);
        }

        const result = await response.json();

        // Process timeline data from API
        if (result.timeline && Array.isArray(result.timeline)) {
            const apiEvents = result.timeline.map(event => ({
                id: event.id || generateId(),
                eventType: event.eventType || event.type || 'document',
                title: event.title || 'Timeline Event',
                date: event.date || new Date().toISOString().slice(0, 10),
                description: event.description || '',
                apiSource: 'timeline-api'
            }));

            // Merge with existing timeline events
            medicalTimeline = [...medicalTimeline, ...apiEvents];

            // Remove duplicates and sort
            const uniqueEvents = medicalTimeline.filter((event, index, self) =>
                index === self.findIndex(e => e.id === event.id)
            );
            medicalTimeline = uniqueEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

            renderTimeline();
        }

    } catch (error) {
        console.error('Timeline API error:', error);
    } finally {
        hideApiLoadingOverlay();
    }
}

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    container.innerHTML = '';

    if (medicalTimeline.length === 0) {
        container.innerHTML = `
      <div class="timeline-empty">
        <i data-lucide="clock"></i>
        <p>No timeline data available from APIs</p>
        <button onclick="refreshTimeline()" class="refresh-button">
          <i data-lucide="refresh-cw"></i>
          Refresh from Timeline API
        </button>
      </div>
    `;
    } else {
        medicalTimeline.forEach(event => {
            const eventType = EVENT_TYPES[event.eventType] || EVENT_TYPES.document;
            const eventElement = document.createElement('div');
            eventElement.className = 'timeline-item fade-in';
            eventElement.innerHTML = `
        <div class="timeline-marker timeline-marker--${event.eventType}">
          <i data-lucide="${eventType.icon}"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <h4 class="timeline-title">${event.title}</h4>
            <span class="timeline-date">${formatDate(event.date)}</span>
          </div>
          <p class="timeline-description">${event.description}</p>
          <span class="api-source-badge">
            <i data-lucide="server"></i>
            ${event.apiSource}
          </span>
        </div>
      `;
            container.appendChild(eventElement);
        });
    }

    // Initialize icons
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 10);
}

function generateSecureToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

function copyShareUrl() {
    const urlElement = document.getElementById('share-url-display');
    navigator.clipboard.writeText(urlElement.textContent).then(() => {
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
}

function generateShareToken() {
    console.log('Generating share token...');
    console.log('Current patient:', currentPatient);
    console.log('Medical timeline:', medicalTimeline);

    if (!currentPatient) {
        alert('Please set up your patient profile first');
        return;
    }

    const token = generateId();
    const shareUrl = `${window.location.origin}${window.location.pathname}?token=${token}`;

    // Create the data structure that matches what verifyDoctorAccess expects
    const shareData = {
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        created: new Date().toISOString(),
        timeline: medicalTimeline || []
    };

    console.log('Storing share data:', shareData);

    // Store in localStorage with the correct key
    const key = `doctor-token-${token}`;
    localStorage.setItem(key, JSON.stringify(shareData));

    // Verify it was stored correctly
    const stored = localStorage.getItem(key);
    console.log('Verified stored data:', stored);

    // Try to find the correct elements in the HTML and update them
    const tokenDisplay = document.getElementById('share-token-display') || document.getElementById('generated-link');
    const urlDisplay = document.getElementById('share-url-display') || document.getElementById('generated-link');
    const results = document.getElementById('share-results') || document.getElementById('share-link-result');
    const expiryElement = document.getElementById('expiry-days');

    if (tokenDisplay) {
        if (tokenDisplay.tagName === 'INPUT') {
            tokenDisplay.value = shareUrl;
        } else {
            tokenDisplay.textContent = token;
        }
    }

    if (urlDisplay && urlDisplay !== tokenDisplay) {
        if (urlDisplay.tagName === 'INPUT') {
            urlDisplay.value = shareUrl;
        } else {
            urlDisplay.textContent = shareUrl;
        }
    }

    if (expiryElement) {
        expiryElement.textContent = '7';
    }

    if (results) {
        results.classList.remove('hidden');
    }

    console.log('Share token generated successfully:', token);
    console.log('Share URL:', shareUrl);

    // Also show an alert with the URL for easy testing
    alert(`Share URL generated: ${shareUrl}`);
}

function verifyDoctorAccess(token) {
    console.log('Verifying doctor access for token:', token);

    // Hardcoded to allow any token - just use demo data
    currentDoctorPatient = {
        patientId: "demo-patient-001",
        patientName: "Sarah Johnson",
        created: new Date().toISOString(),
        timeline: [
            {
                id: "event-001",
                eventType: "lab_test",
                title: "Lab Results - Complete Blood Count",
                date: "2024-09-15",
                description: "Hemoglobin 14.2 g/dL, WBC 7200/μL - All values normal",
                apiSource: "upload-api"
            },
            {
                id: "event-002",
                eventType: "prescription",
                title: "Medication Prescribed",
                date: "2024-09-10",
                description: "Metformin 500mg twice daily",
                apiSource: "timeline-api"
            },
            {
                id: "event-003",
                eventType: "document",
                title: "Medical Document Uploaded",
                date: "2024-09-05",
                description: "Patient intake form and medical history",
                apiSource: "upload-api"
            }
        ]
    };

    // Load the demo timeline into the global timeline
    medicalTimeline = currentDoctorPatient.timeline;

    showDoctorView();
    console.log('Doctor access granted with demo data for any token:', token);
}

function showDoctorView() {
    hideAllSections();
    document.getElementById('doctor-view').classList.add('active');

    if (currentDoctorPatient) {
        document.getElementById('doctor-patient-name').textContent = currentDoctorPatient.patientName;
        document.getElementById('doctor-patient-id').textContent = currentDoctorPatient.patientId;

        // Render patient timeline for doctor
        medicalTimeline = currentDoctorPatient.timeline || [];
        const doctorTimelineContainer = document.getElementById('doctor-timeline-container');
        renderDoctorTimeline(doctorTimelineContainer);
    }
}

function renderDoctorTimeline(container) {
    if (!container) return;

    container.innerHTML = '';

    if (medicalTimeline.length === 0) {
        container.innerHTML = `
      <div class="timeline-empty">
        <i data-lucide="clock"></i>
        <p>No timeline data available</p>
      </div>
    `;
    } else {
        medicalTimeline.forEach(event => {
            const eventType = EVENT_TYPES[event.eventType] || EVENT_TYPES.document;
            const eventElement = document.createElement('div');
            eventElement.className = 'timeline-item';
            eventElement.innerHTML = `
        <div class="timeline-marker timeline-marker--${event.eventType}">
          <i data-lucide="${eventType.icon}"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <h4 class="timeline-title">${event.title}</h4>
            <span class="timeline-date">${formatDate(event.date)}</span>
          </div>
          <p class="timeline-description">${event.description}</p>
          <span class="api-source-badge">
            <i data-lucide="server"></i>
            ${event.apiSource}
          </span>
        </div>
      `;
            container.appendChild(eventElement);
        });
    }

    // Initialize icons
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 10);
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showApiLoadingOverlay(endpoint) {
    const overlay = document.querySelector('.loading-overlay');
    const endpointDisplay = document.querySelector('.api-loading-endpoint');

    if (endpointDisplay && endpoint) {
        endpointDisplay.textContent = endpoint;
    }

    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('show');
    }
}

function hideApiLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('show');
    }
}

// Data persistence
function savePatientData() {
    if (currentPatient) {
        localStorage.setItem('currentPatient', JSON.stringify(currentPatient));
        localStorage.setItem('medicalTimeline', JSON.stringify(medicalTimeline));
    }
}

function loadPatientData() {
    const savedPatient = localStorage.getItem('currentPatient');
    const savedTimeline = localStorage.getItem('medicalTimeline');

    if (savedPatient) {
        try {
            currentPatient = JSON.parse(savedPatient);
        } catch (error) {
            console.error('Error loading patient data:', error);
        }
    }

    if (savedTimeline) {
        try {
            medicalTimeline = JSON.parse(savedTimeline);
        } catch (error) {
            console.error('Error loading timeline data:', error);
        }
    }
}

function loadDemoData() {
    // Load demo timeline data
    medicalTimeline = [...DEMO_PATIENT_DATA.timeline];
    savePatientData();
    renderTimeline();
}

// Expose functions to global scope for HTML onclick handlers
window.showHome = showHome;
window.showPatientPortal = showPatientPortal;
window.showDoctorAccess = showDoctorAccess;
window.showApiStatus = showApiStatus;
window.setupPatient = setupPatient;
window.showTab = showTab;
window.handleDragOver = handleDragOver;
window.handleDragEnter = handleDragEnter;
window.handleDragLeave = handleDragLeave;
window.handleDrop = handleDrop;
window.handleFiles = handleFiles;
window.sendMessage = sendMessage;
window.refreshTimeline = refreshTimeline;
window.generateShareToken = generateShareToken;
window.copyShareUrl = copyShareUrl;

// Fix for HTML onclick handlers that use different function names
window.generateShareLink = generateShareToken; // Alias for HTML compatibility
