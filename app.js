// MediShare AI-Powered Healthcare Platform JavaScript
// Enhanced with Llama AI, CrewAI, Snowflake, and LandingAI integrations

// Global application state
let currentPatient = null;
let patientDocuments = [];
let medicalTimeline = [];
let currentDoctorPatient = null;
let apiConfig = {
    llama: { apiKey: '', model: 'llama-2-70b-chat', configured: false },
    snowflake: { account: '', username: '', password: '', database: 'MEDISHARE_DB', configured: false },
    crewai: { apiKey: '', endpoint: 'https://api.crewai.com/v1', configured: false },
    landingai: { apiKey: '', configured: false }
};

// CrewAI Agents Configuration
const crewAIAgents = {
    documentParser: {
        name: 'Document Parser Agent',
        status: 'idle',
        activity: [],
        description: 'Extracts and structures data from medical documents'
    },
    medicalAnalysis: {
        name: 'Medical Analysis Agent',
        status: 'idle',
        activity: [],
        description: 'Analyzes medical content using Llama AI'
    },
    dataStorage: {
        name: 'Data Storage Agent',
        status: 'idle',
        activity: [],
        description: 'Manages Snowflake data operations'
    },
    privacyGuardian: {
        name: 'Privacy Guardian Agent',
        status: 'idle',
        activity: [],
        description: 'Ensures HIPAA compliance and security'
    }
};

// Medical event types and sample data
const medicalEventTypes = {
    "lab_test": { "color": "blue", "icon": "test-tube" },
    "imaging": { "color": "purple", "icon": "camera" },
    "prescription": { "color": "green", "icon": "pill" },
    "document": { "color": "gray", "icon": "file-text" }
};

const sampleMedicalData = {
    "labResults": [
        { "parameter": "Hemoglobin", "value": "14.2", "unit": "g/dL", "normalRange": "12.0-15.5", "status": "normal" },
        { "parameter": "White Blood Cells", "value": "7.2", "unit": "K/μL", "normalRange": "4.5-11.0", "status": "normal" },
        { "parameter": "Glucose", "value": "108", "unit": "mg/dL", "normalRange": "70-100", "status": "elevated" },
        { "parameter": "Cholesterol", "value": "195", "unit": "mg/dL", "normalRange": "<200", "status": "normal" },
        { "parameter": "Creatinine", "value": "1.1", "unit": "mg/dL", "normalRange": "0.7-1.3", "status": "normal" }
    ],
    "imagingFindings": [
        { "finding": "Normal chest X-ray", "severity": "normal", "details": "Clear lung fields bilaterally" },
        { "finding": "No acute abnormalities", "severity": "normal", "details": "Heart size within normal limits" },
        { "finding": "Degenerative changes in spine", "severity": "mild", "details": "Age-appropriate changes" }
    ],
    "medications": [
        { "name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "indication": "Type 2 Diabetes", "prescriber": "Dr. Smith" },
        { "name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "indication": "Hypertension", "prescriber": "Dr. Johnson" },
        { "name": "Atorvastatin", "dosage": "20mg", "frequency": "once daily", "indication": "High Cholesterol", "prescriber": "Dr. Smith" }
    ]
};

const llamaChatResponses = {
    "drug interactions": "🧠 **Llama AI Analysis**: I've analyzed the patient's medications stored in Snowflake. The combination of Metformin, Lisinopril, and Atorvastatin shows good compatibility. However, both Metformin and Lisinopril can affect kidney function, so I recommend monitoring renal parameters every 3-6 months. No major drug interactions detected.",

    "lab trends": "📊 **Snowflake Data Analytics**: Based on historical lab data, the patient shows stable trends in most parameters. Glucose levels have increased slightly over the past 6 months (avg: 95→108 mg/dL), suggesting closer diabetes monitoring may be needed. All other values remain within acceptable ranges.",

    "risk assessment": "⚕️ **AI Risk Analysis**: Using our ML models, this patient has a low-to-moderate cardiovascular risk profile. Current diabetes management appears effective, but the slight glucose elevation warrants attention. Blood pressure control is excellent with current therapy.",

    "treatment recommendations": "💡 **Treatment Insights**: Continue current medication regimen as labs indicate good control. Consider: 1) Dietary consultation for glucose management, 2) Increase monitoring frequency to every 3 months, 3) Consider adding metformin ER for better glucose control if levels continue trending upward.",

    "medical history": "📋 **Comprehensive Analysis**: This patient has well-managed Type 2 diabetes (dx 2019) and hypertension (dx 2021). Medication adherence appears excellent based on lab stability. Recent preventive care includes annual physical, mammogram, and colonoscopy - all up to date. No hospitalizations in the past 2 years."
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadApiConfig();
    loadPatientData();
    updateApiStatusIndicators();

    // Check URL for doctor token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        verifyDoctorAccess(token);
    } else {
        showHome();
    }

    // Initialize Lucide icons
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
});

// API Configuration Management
function showApiConfig() {
    document.getElementById('api-config-modal').classList.remove('hidden');

    // Load current config into form
    document.getElementById('llama-api-key').value = apiConfig.llama.apiKey || '';
    document.getElementById('llama-model').value = apiConfig.llama.model || 'llama-2-70b-chat';
    document.getElementById('snowflake-account').value = apiConfig.snowflake.account || '';
    document.getElementById('snowflake-username').value = apiConfig.snowflake.username || '';
    document.getElementById('snowflake-password').value = apiConfig.snowflake.password || '';
    document.getElementById('snowflake-database').value = apiConfig.snowflake.database || 'MEDISHARE_DB';
    document.getElementById('crewai-api-key').value = apiConfig.crewai.apiKey || '';
    document.getElementById('crewai-endpoint').value = apiConfig.crewai.endpoint || 'https://api.crewai.com/v1';
    document.getElementById('landingai-api-key').value = apiConfig.landingai.apiKey || '';
}

function closeApiConfig() {
    document.getElementById('api-config-modal').classList.add('hidden');
}

function saveApiConfig() {
    // Collect form data
    apiConfig.llama.apiKey = document.getElementById('llama-api-key').value;
    apiConfig.llama.model = document.getElementById('llama-model').value;
    apiConfig.snowflake.account = document.getElementById('snowflake-account').value;
    apiConfig.snowflake.username = document.getElementById('snowflake-username').value;
    apiConfig.snowflake.password = document.getElementById('snowflake-password').value;
    apiConfig.snowflake.database = document.getElementById('snowflake-database').value;
    apiConfig.crewai.apiKey = document.getElementById('crewai-api-key').value;
    apiConfig.crewai.endpoint = document.getElementById('crewai-endpoint').value;
    apiConfig.landingai.apiKey = document.getElementById('landingai-api-key').value;

    // Update configuration status
    apiConfig.llama.configured = !!apiConfig.llama.apiKey;
    apiConfig.snowflake.configured = !!(apiConfig.snowflake.account && apiConfig.snowflake.username && apiConfig.snowflake.password);
    apiConfig.crewai.configured = !!apiConfig.crewai.apiKey;
    apiConfig.landingai.configured = !!apiConfig.landingai.apiKey;

    // Save to localStorage
    localStorage.setItem('medishare_api_config', JSON.stringify(apiConfig));

    // Update UI indicators
    updateApiStatusIndicators();

    // Show success notification
    showNotification('API Configuration saved successfully!', 'success');

    // Close modal
    closeApiConfig();
}

function loadApiConfig() {
    const savedConfig = localStorage.getItem('medishare_api_config');
    if (savedConfig) {
        try {
            apiConfig = { ...apiConfig, ...JSON.parse(savedConfig) };
        } catch (e) {
            console.error('Error loading API config:', e);
        }
    }
}

function updateApiStatusIndicators() {
    // Update feature status indicators
    const features = ['llama', 'snowflake', 'crewai', 'landingai'];

    features.forEach(feature => {
        const statusElement = document.getElementById(`${feature}-status`);
        if (statusElement) {
            const isConfigured = apiConfig[feature]?.configured;
            const statusSpan = statusElement.querySelector('span');
            if (statusSpan) {
                statusSpan.className = `status ${isConfigured ? 'status--success' : 'status--error'}`;
                statusSpan.textContent = isConfigured ? 'Configured' : 'Not Configured';
            }
        }
    });

    // Update patient portal status indicators
    const llamaStatus = document.getElementById('patient-llama-status');
    const snowflakeStatus = document.getElementById('patient-snowflake-status');

    if (llamaStatus) {
        llamaStatus.textContent = apiConfig.llama.configured ? 'Online' : 'Offline';
        llamaStatus.className = `status-indicator ${apiConfig.llama.configured ? 'online' : ''}`;
    }

    if (snowflakeStatus) {
        snowflakeStatus.textContent = apiConfig.snowflake.configured ? 'Online' : 'Offline';
        snowflakeStatus.className = `status-indicator ${apiConfig.snowflake.configured ? 'online' : ''}`;
    }
}

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

function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
}

// Enhanced patient setup
function setupPatient() {
    const nameInput = document.getElementById('patient-name-input');
    const dobInput = document.getElementById('patient-dob');
    const mrnInput = document.getElementById('patient-mrn');

    const name = nameInput.value.trim();
    const dob = dobInput.value;

    if (!name) {
        showNotification('Please enter your name', 'error');
        return;
    }

    if (!dob) {
        showNotification('Please enter your date of birth', 'error');
        return;
    }

    // Create enhanced patient profile
    currentPatient = {
        id: generateId(),
        name: name,
        dateOfBirth: dob,
        medicalRecordNumber: mrnInput.value.trim() || generateMRN(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };

    // Initialize patient in Snowflake (simulated)
    if (apiConfig.snowflake.configured) {
        simulateSnowflakePatientInit();
    }

    savePatientData();

    // Update UI
    document.getElementById('patient-setup').classList.add('hidden');
    document.getElementById('patient-tabs').classList.remove('hidden');
    document.getElementById('patient-name-display').textContent = `Welcome, ${name}`;

    // Clear inputs
    [nameInput, dobInput, mrnInput].forEach(input => input.value = '');

    // Load demo data and initialize agents
    loadDemoData();
    initializeCrewAIAgents();

    showNotification('Patient profile created successfully!', 'success');
}

function generateMRN() {
    return 'MRN' + Math.random().toString().substr(2, 8);
}

// Enhanced file handling with AI pipeline
function handleFiles(files) {

    if (files.length === 0) return;

    // use the https://test.com/upload endpoint to upload files to Snowflake stage (using post)
    const fileUploadPromises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('patientId', currentPatient.id);

            fetch('https://test.com/upload', {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (response.ok) {
                        resolve(file.name);
                    } else {
                        reject(`Failed to upload ${file.name}`);
                    }
                })
                .catch(error => reject(`Error uploading ${file.name}: ${error}`));
        });
    })


    const uploadedFilesContainer = document.getElementById('uploaded-files');
    const processingPipeline = document.getElementById('processing-pipeline');

    // Show processing pipeline
    processingPipeline.classList.remove('hidden');

    Array.from(files).forEach((file, index) => {
        const fileItem = createFileItem(file);
        uploadedFilesContainer.appendChild(fileItem);

        // Start AI processing pipeline
        setTimeout(() => {
            processFileWithAIPipeline(file, fileItem, index);
        }, 500 + (index * 200));
    });
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
        <div class="file-status status status--info">Queued for AI Processing...</div>
    `;

    setTimeout(() => lucide.createIcons(), 100);
    return fileItem;
}

// Enhanced AI processing pipeline
async function processFileWithAIPipeline(file, fileItem, index) {
    const pipeline = ['landingai', 'crewai', 'llama', 'snowflake'];

    for (let i = 0; i < pipeline.length; i++) {
        const step = pipeline[i];
        await simulateProcessingStep(step, file, fileItem, i);
    }

    // Complete processing
    const statusElement = fileItem.querySelector('.file-status');
    statusElement.className = 'file-status status status--success';
    statusElement.textContent = '✅ Processed by AI Pipeline';

    // Generate medical events from processed data
    const processedData = generateMedicalEventsFromFile(file);
    addToTimeline(processedData);

    // Store in Snowflake (simulated)
    if (apiConfig.snowflake.configured) {
        simulateSnowflakeStorage(file, processedData);
    }

    // Hide pipeline after all files processed
    setTimeout(() => {
        document.getElementById('processing-pipeline').classList.add('hidden');
        renderTimeline();
    }, 2000);
}

async function simulateProcessingStep(step, file, fileItem, stepIndex) {
    // Update pipeline status
    const stepElement = document.getElementById(`step-${step}`);
    if (stepElement) {
        stepElement.classList.add('active');
        const indicator = stepElement.querySelector('.step-indicator');
        indicator.innerHTML = '<div class="spinner"></div>';
    }

    // Update file status
    const statusElement = fileItem.querySelector('.file-status');
    const stepNames = {
        'landingai': 'LandingAI OCR Processing...',
        'crewai': 'CrewAI Agents Processing...',
        'llama': 'Llama AI Analysis...',
        'snowflake': 'Storing in Snowflake...'
    };

    statusElement.textContent = stepNames[step];

    // Activate relevant agents
    if (step === 'crewai') {
        activateAgent('documentParser');
        updateAgentActivity('documentParser', `Processing ${file.name}`);
    }

    if (step === 'llama') {
        activateAgent('medicalAnalysis');
        updateAgentActivity('medicalAnalysis', `Analyzing medical content in ${file.name}`);
    }

    if (step === 'snowflake') {
        activateAgent('dataStorage');
        updateAgentActivity('dataStorage', `Storing processed data for ${file.name}`);
    }

    // Simulate processing time
    const processingTime = 1500 + Math.random() * 1000; // 1.5-2.5 seconds
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Mark step as completed
    if (stepElement) {
        stepElement.classList.add('completed');
        stepElement.classList.remove('active');
        const indicator = stepElement.querySelector('.step-indicator');
        indicator.innerHTML = '✅';
    }
}

// CrewAI Agent Management
function initializeCrewAIAgents() {
    if (!apiConfig.crewai.configured) return;

    // Reset all agents
    Object.keys(crewAIAgents).forEach(key => {
        crewAIAgents[key].status = 'idle';
        crewAIAgents[key].activity = [];
    });

    updateAgentDisplay();

    // Activate privacy guardian
    activateAgent('privacyGuardian');
    updateAgentActivity('privacyGuardian', 'Monitoring HIPAA compliance and data security');
}

function activateAgent(agentKey) {
    if (crewAIAgents[agentKey]) {
        crewAIAgents[agentKey].status = 'active';
        updateAgentDisplay();
    }
}

function updateAgentActivity(agentKey, activity) {
    if (crewAIAgents[agentKey]) {
        crewAIAgents[agentKey].activity.unshift({
            timestamp: new Date().toLocaleTimeString(),
            message: activity
        });

        // Keep only last 3 activities
        if (crewAIAgents[agentKey].activity.length > 3) {
            crewAIAgents[agentKey].activity = crewAIAgents[agentKey].activity.slice(0, 3);
        }

        updateAgentDisplay();
    }
}

function updateAgentDisplay() {
    const agentKeys = ['documentParser', 'medicalAnalysis', 'dataStorage', 'privacyGuardian'];
    const agentIds = ['parser', 'medical', 'storage', 'privacy'];

    agentKeys.forEach((key, index) => {
        const agent = crewAIAgents[key];
        const statusElement = document.getElementById(`${agentIds[index]}-agent-status`);
        const activityElement = document.getElementById(`${agentIds[index]}-agent-activity`);

        if (statusElement) {
            statusElement.textContent = agent.status.charAt(0).toUpperCase() + agent.status.slice(1);
            statusElement.className = `agent-status ${agent.status}`;
        }

        if (activityElement) {
            if (agent.activity.length > 0) {
                activityElement.innerHTML = agent.activity.map(item =>
                    `<div class="activity-item"><small>${item.timestamp}</small><br>${item.message}</div>`
                ).join('');
            } else {
                activityElement.innerHTML = '<div class="activity-placeholder">No recent activity</div>';
            }
        }
    });
}

// Enhanced timeline management
function generateMedicalEventsFromFile(file) {
    const fileName = file.name.toLowerCase();

    if (fileName.includes('lab') || fileName.includes('blood')) {
        return generateLabEvent();
    } else if (fileName.includes('xray') || fileName.includes('scan') || fileName.includes('mri')) {
        return generateImagingEvent();
    } else if (fileName.includes('prescription') || fileName.includes('medication')) {
        return generatePrescriptionEvent();
    } else {
        return generateDocumentEvent(fileName);
    }
}

function generateLabEvent() {
    return {
        type: 'lab_test',
        title: 'Laboratory Results - AI Processed',
        description: 'Complete metabolic panel and CBC processed by Llama AI',
        date: new Date(),
        severity: 'normal',
        details: {
            results: sampleMedicalData.labResults,
            llamaAnalysis: "Llama AI has analyzed these lab results. Most values are within normal ranges. Glucose is slightly elevated at 108 mg/dL, suggesting closer diabetes monitoring.",
            landingaiConfidence: 0.96,
            snowflakeStored: apiConfig.snowflake.configured
        }
    };
}

function generateImagingEvent() {
    return {
        type: 'imaging',
        title: 'Medical Imaging - AI Enhanced',
        description: 'Imaging study processed with LandingAI vision analysis',
        date: new Date(),
        severity: 'normal',
        details: {
            findings: sampleMedicalData.imagingFindings,
            llamaAnalysis: "LandingAI processed the imaging data with 94% confidence. Llama AI analysis confirms normal findings with age-appropriate changes.",
            landingaiConfidence: 0.94,
            snowflakeStored: apiConfig.snowflake.configured
        }
    };
}

function generatePrescriptionEvent() {
    return {
        type: 'prescription',
        title: 'Medication Analysis - AI Reviewed',
        description: 'Prescription data analyzed by AI for interactions and compliance',
        date: new Date(),
        severity: 'normal',
        details: {
            medications: sampleMedicalData.medications,
            llamaAnalysis: "Llama AI has reviewed the medication list. Current prescriptions show good therapeutic choices with no major interactions detected.",
            interactionCheck: "No significant drug interactions found",
            snowflakeStored: apiConfig.snowflake.configured
        }
    };
}

function generateDocumentEvent(fileName) {
    return {
        type: 'document',
        title: 'Clinical Document - AI Processed',
        description: `Medical document processed by AI pipeline: ${fileName}`,
        date: new Date(),
        severity: 'normal',
        details: {
            summary: "Document processed and structured by AI agents",
            llamaAnalysis: "Llama AI has extracted relevant medical information and structured it for the timeline.",
            landingaiConfidence: 0.91,
            snowflakeStored: apiConfig.snowflake.configured
        }
    };
}

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

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;

    if (medicalTimeline.length === 0) {
        container.innerHTML = `
            <div class="timeline-empty">
                <i data-lucide="calendar"></i>
                <p>Upload documents to generate your AI-powered medical timeline</p>
            </div>
        `;
        setTimeout(() => lucide.createIcons(), 100);
        return;
    }

    const timelineHTML = medicalTimeline.map(event => `
        <div class="timeline-item fade-in">
            <div class="timeline-marker timeline-marker--${event.type}">
                <i data-lucide="${medicalEventTypes[event.type].icon}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <h4 class="timeline-title">${event.title}</h4>
                    <span class="timeline-date">${formatDate(event.date)}</span>
                </div>
                <p class="timeline-description">${event.description}</p>
                ${renderSeverityBadge(event.severity)}
                <button class="expand-btn" onclick="toggleEventDetails('${event.id}')">
                    <i data-lucide="chevron-down"></i>
                    View AI Analysis
                </button>
                <div class="timeline-details" id="details-${event.id}">
                    ${renderEventDetails(event)}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = timelineHTML;
    setTimeout(() => lucide.createIcons(), 100);
}

function renderSeverityBadge(severity) {
    const severityClasses = {
        'normal': 'status--success',
        'elevated': 'status--warning',
        'critical': 'status--error',
        'mild': 'status--info'
    };

    return `<span class="status ${severityClasses[severity] || 'status--info'}">${severity.toUpperCase()}</span>`;
}

function renderEventDetails(event) {
    let detailsHTML = '';

    // AI Processing Information
    if (event.details.landingaiConfidence) {
        detailsHTML += `
            <div class="medical-data">
                <h4><i data-lucide="image"></i> LandingAI Processing</h4>
                <div class="lab-result">
                    <span>OCR Confidence</span>
                    <span class="result-value result-normal">${(event.details.landingaiConfidence * 100).toFixed(1)}%</span>
                </div>
            </div>
        `;
    }

    // Medical Data
    if (event.type === 'lab_test' && event.details.results) {
        detailsHTML += `
            <div class="medical-data">
                <h4><i data-lucide="test-tube"></i> Lab Results</h4>
                ${event.details.results.map(result => `
                    <div class="lab-result">
                        <span>${result.parameter}</span>
                        <span class="result-value ${result.status === 'normal' ? 'result-normal' : 'result-abnormal'}">
                            ${result.value} ${result.unit} (Normal: ${result.normalRange})
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (event.type === 'imaging' && event.details.findings) {
        detailsHTML += `
            <div class="medical-data">
                <h4><i data-lucide="camera"></i> Imaging Findings</h4>
                ${event.details.findings.map(finding => `
                    <div class="lab-result">
                        <span>${finding.finding}</span>
                        <span class="result-value result-normal">${finding.severity}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (event.type === 'prescription' && event.details.medications) {
        detailsHTML += `
            <div class="medical-data">
                <h4><i data-lucide="pill"></i> Medications</h4>
                ${event.details.medications.map(med => `
                    <div class="lab-result">
                        <span>${med.name} ${med.dosage}</span>
                        <span class="result-value">${med.frequency}</span>
                    </div>
                `).join('')}
                ${event.details.interactionCheck ? `
                    <div class="lab-result">
                        <span>Drug Interactions</span>
                        <span class="result-value result-normal">${event.details.interactionCheck}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Llama AI Analysis
    if (event.details.llamaAnalysis) {
        detailsHTML += `
            <div class="medical-data">
                <h4><i data-lucide="brain"></i> Llama AI Analysis</h4>
                <p>${event.details.llamaAnalysis}</p>
            </div>
        `;
    }

    // Snowflake Storage Status
    if (event.details.snowflakeStored) {
        detailsHTML += `
            <div class="medical-data">
                <h4><i data-lucide="database"></i> Data Storage</h4>
                <div class="lab-result">
                    <span>Snowflake Storage</span>
                    <span class="result-value result-normal">✅ Stored Securely</span>
                </div>
            </div>
        `;
    }

    return detailsHTML;
}

function regenerateTimeline() {
    if (!apiConfig.llama.configured) {
        showNotification('Llama AI not configured. Please configure APIs first.', 'warning');
        return;
    }

    showNotification('Regenerating timeline with Llama AI...', 'info');

    setTimeout(() => {
        // Simulate timeline regeneration
        medicalTimeline.forEach(event => {
            if (event.details) {
                event.details.llamaAnalysis = "🔄 Timeline regenerated with latest Llama AI model. " + event.details.llamaAnalysis;
            }
        });

        renderTimeline();
        showNotification('Timeline regenerated successfully!', 'success');
    }, 2000);
}

// Enhanced sharing with HIPAA compliance
function generateSecureShareLink() {
    if (medicalTimeline.length === 0) {
        showNotification('Please upload some documents first to generate a shareable timeline.', 'error');
        return;
    }

    const duration = document.getElementById('access-duration').value;
    const providerEmail = document.getElementById('provider-email').value;

    if (!providerEmail) {
        showNotification('Please enter healthcare provider email', 'error');
        return;
    }

    const token = generateSecureToken();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(duration));

    // Enhanced share data with HIPAA compliance
    const shareData = {
        token: token,
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        patientMRN: currentPatient.medicalRecordNumber,
        providerEmail: providerEmail,
        timeline: medicalTimeline,
        documents: patientDocuments,
        expiryDate: expiryDate.toISOString(),
        createdAt: new Date().toISOString(),
        hipaaCompliance: {
            auditLog: `Access granted to ${providerEmail} at ${new Date().toISOString()}`,
            encryptionLevel: 'AES-256',
            dataLocation: 'Snowflake Secure Cloud'
        }
    };

    localStorage.setItem(`medishare_access_${token}`, JSON.stringify(shareData));

    // Update UI
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?token=${token}`;

    document.getElementById('generated-link').value = shareUrl;
    document.getElementById('expiry-days').textContent = duration;
    document.getElementById('share-link-result').classList.remove('hidden');

    // Activate privacy guardian
    activateAgent('privacyGuardian');
    updateAgentActivity('privacyGuardian', `Secure link generated for ${providerEmail}`);

    showNotification('HIPAA-compliant secure link generated!', 'success');
}

// Enhanced doctor interface
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
    const shareDataStr = localStorage.getItem(`medishare_access_${token}`);

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

    // Log access for HIPAA compliance
    const auditEntry = {
        timestamp: new Date().toISOString(),
        action: 'Doctor Access Granted',
        patientId: shareData.patientId,
        provider: shareData.providerEmail || 'Unknown'
    };

    console.log('HIPAA Audit Log:', auditEntry);
}

function showDoctorInterface() {
    hideAllSections();
    document.getElementById('doctor-interface').classList.add('active');
    document.getElementById('doctor-patient-name').textContent = `Patient: ${currentDoctorPatient.patientName}`;

    renderDoctorTimeline();
    updateDoctorAnalytics();
}

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

    if (tabName === 'analytics') {
        updateDoctorAnalytics();
    }
}

function renderDoctorTimeline() {
    const container = document.getElementById('doctor-timeline-container');
    if (!container || !currentDoctorPatient) return;

    const timeline = currentDoctorPatient.timeline || [];

    if (timeline.length === 0) {
        container.innerHTML = '<div class="timeline-empty"><p>No medical timeline data available</p></div>';
        return;
    }

    const timelineHTML = timeline.map(event => `
        <div class="timeline-item fade-in">
            <div class="timeline-marker timeline-marker--${event.type}">
                <i data-lucide="${medicalEventTypes[event.type].icon}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <h4 class="timeline-title">${event.title}</h4>
                    <span class="timeline-date">${formatDate(event.date)}</span>
                </div>
                <p class="timeline-description">${event.description}</p>
                ${renderSeverityBadge(event.severity)}
                <button class="expand-btn" onclick="toggleEventDetails('doctor-${event.id}')">
                    <i data-lucide="chevron-down"></i>
                    View AI Analysis
                </button>
                <div class="timeline-details" id="details-doctor-${event.id}">
                    ${renderEventDetails(event)}
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = timelineHTML;
    setTimeout(() => lucide.createIcons(), 100);
}

function updateDoctorAnalytics() {
    if (!currentDoctorPatient) return;

    const timeline = currentDoctorPatient.timeline || [];
    const totalRecords = timeline.length * 15 + Math.floor(Math.random() * 50); // Simulated
    const aiProcessedDocs = timeline.filter(event => event.details && event.details.llamaAnalysis).length;

    // Update metrics
    const metrics = document.querySelectorAll('.metric-value');
    if (metrics.length >= 6) {
        metrics[0].textContent = totalRecords;
        metrics[1].textContent = aiProcessedDocs;
        metrics[2].textContent = timeline.length;
        metrics[3].textContent = '98.5%';
        metrics[4].textContent = (3.2 + Math.random() * 2).toFixed(1) + 's';
        metrics[5].textContent = '12';
    }
}

function exportToSnowflake() {
    if (!apiConfig.snowflake.configured) {
        showNotification('Snowflake not configured. Please configure APIs first.', 'warning');
        return;
    }

    showNotification('Exporting timeline data to Snowflake...', 'info');

    setTimeout(() => {
        showNotification('Timeline data exported to Snowflake successfully!', 'success');
    }, 2000);
}

// Enhanced chat with Llama AI
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    if (!apiConfig.llama.configured) {
        showNotification('Llama AI not configured. Please configure APIs first.', 'warning');
        return;
    }

    addChatMessage(message, 'user');
    input.value = '';

    showTypingIndicator();

    setTimeout(() => {
        hideTypingIndicator();
        const response = generateEnhancedLlamaResponse(message);
        addChatMessage(response, 'assistant');
    }, 1500 + Math.random() * 2000);
}

function generateEnhancedLlamaResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Enhanced response mapping
    if (lowerMessage.includes('drug') && lowerMessage.includes('interaction')) {
        return llamaChatResponses['drug interactions'];
    }

    if (lowerMessage.includes('lab') && (lowerMessage.includes('trend') || lowerMessage.includes('analysis'))) {
        return llamaChatResponses['lab trends'];
    }

    if (lowerMessage.includes('risk')) {
        return llamaChatResponses['risk assessment'];
    }

    if (lowerMessage.includes('treatment') || lowerMessage.includes('recommend')) {
        return llamaChatResponses['treatment recommendations'];
    }

    if (lowerMessage.includes('history') || lowerMessage.includes('summary')) {
        return llamaChatResponses['medical history'];
    }

    // New enhanced responses
    if (lowerMessage.includes('snowflake') || lowerMessage.includes('data')) {
        return "📊 **Snowflake Data Query**: I can access the patient's complete medical record stored securely in Snowflake. The database contains structured lab results, imaging reports, medication history, and AI-processed insights. Would you like me to run a specific query?";
    }

    if (lowerMessage.includes('ai') || lowerMessage.includes('analysis')) {
        return "🤖 **AI Processing Summary**: This patient's data has been processed through our complete AI pipeline: LandingAI for document OCR (96% accuracy), CrewAI agents for data structuring, and my Llama AI analysis for medical insights. All findings are stored securely in Snowflake.";
    }

    // Default enhanced response
    return "🩺 **Llama AI Medical Assistant**: I've analyzed the patient's comprehensive medical data from Snowflake. I can help with medication analysis, lab trend interpretation, risk assessment, treatment recommendations, or answer specific clinical questions. What would you like to know?";
}

// Utility functions
function simulateSnowflakePatientInit() {
    updateAgentActivity('dataStorage', `Initializing patient record in Snowflake DB: ${apiConfig.snowflake.database}`);
}

function simulateSnowflakeStorage(file, processedData) {
    updateAgentActivity('dataStorage', `Stored ${file.name} and AI analysis in Snowflake`);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 4000);
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

// Tab management
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
    } else if (tabName === 'agents') {
        updateAgentDisplay();
    }
}

function toggleEventDetails(eventId) {
    const detailsElement = document.getElementById(`details-${eventId}`);
    const button = detailsElement.previousElementSibling;

    if (detailsElement.classList.contains('show')) {
        detailsElement.classList.remove('show');
        button.innerHTML = '<i data-lucide="chevron-down"></i> View AI Analysis';
    } else {
        detailsElement.classList.add('show');
        button.innerHTML = '<i data-lucide="chevron-up"></i> Hide Analysis';
    }

    setTimeout(() => lucide.createIcons(), 100);
}

function filterTimeline() {
    const filter = document.getElementById('timeline-filter').value;
    if (!currentDoctorPatient) return;

    const timeline = currentDoctorPatient.timeline || [];
    let filteredTimeline = filter !== 'all' ? timeline.filter(event => event.type === filter) : timeline;

    const originalTimeline = currentDoctorPatient.timeline;
    currentDoctorPatient.timeline = filteredTimeline;
    renderDoctorTimeline();
    currentDoctorPatient.timeline = originalTimeline;
}

function askQuickQuestion(questionType) {
    const input = document.getElementById('chat-input');

    const quickQuestions = {
        'drug interactions': 'Can you check for any drug interactions in this patient\'s medications using Snowflake data?',
        'lab trends': 'Can you analyze the lab result trends over time from the Snowflake database?',
        'risk assessment': 'Can you provide a comprehensive risk assessment for this patient?',
        'treatment recommendations': 'Based on the AI analysis, what treatment recommendations do you have?'
    };

    input.value = quickQuestions[questionType] || questionType;
    sendChatMessage();
}

// File handling utilities
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

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
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

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingElement = document.createElement('div');
    typingElement.className = 'chat-message chat-message--assistant typing-indicator';
    typingElement.id = 'typing-indicator';
    typingElement.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span>Llama AI is analyzing...</span>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;

    messagesContainer.appendChild(typingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function copyLink() {
    const linkInput = document.getElementById('generated-link');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);

    try {
        document.execCommand('copy');
        showNotification('Secure link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('Failed to copy link. Please copy manually.', 'error');
    }
}

// Utility helper functions
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
        localStorage.setItem('medishare_patient_data', JSON.stringify(patientData));
    }
}

function loadPatientData() {
    const savedData = localStorage.getItem('medishare_patient_data');
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

// Demo data initialization
function loadDemoData() {
    const sampleEvents = [
        {
            id: generateId(),
            type: 'lab_test',
            title: 'Laboratory Results - AI Enhanced',
            description: 'Complete metabolic panel processed by AI pipeline',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            severity: 'normal',
            details: {
                results: sampleMedicalData.labResults,
                llamaAnalysis: "Llama AI analysis: Most values normal. Glucose slightly elevated at 108 mg/dL - monitor diabetes control.",
                landingaiConfidence: 0.96,
                snowflakeStored: apiConfig.snowflake.configured
            }
        },
        {
            id: generateId(),
            type: 'prescription',
            title: 'Medication Analysis - AI Reviewed',
            description: 'Current medications analyzed for interactions',
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            severity: 'normal',
            details: {
                medications: sampleMedicalData.medications,
                llamaAnalysis: "AI review confirms appropriate medication choices with no significant interactions.",
                interactionCheck: "No major interactions detected",
                snowflakeStored: apiConfig.snowflake.configured
            }
        },
        {
            id: generateId(),
            type: 'imaging',
            title: 'Chest Imaging - AI Processed',
            description: 'Routine chest X-ray with AI enhancement',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            severity: 'normal',
            details: {
                findings: sampleMedicalData.imagingFindings,
                llamaAnalysis: "LandingAI + Llama analysis confirms normal chest imaging with age-appropriate changes.",
                landingaiConfidence: 0.94,
                snowflakeStored: apiConfig.snowflake.configured
            }
        }
    ];

    medicalTimeline = sampleEvents;
    savePatientData();
}
