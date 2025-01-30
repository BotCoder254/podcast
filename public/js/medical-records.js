import NotificationService from './notification-service.js';

let currentPage = 1;
const recordsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    loadMedicalRecords();
    setupFilters();
    setupPagination();
});

// Load medical records with pagination
async function loadMedicalRecords(page = 1) {
    try {
        const filters = getFilters();
        const response = await fetch(`/medical-records?page=${page}&limit=${recordsPerPage}&${new URLSearchParams(filters)}`);
        const { records, total, totalPages } = await response.json();
        
        const recordsContainer = document.querySelector('#medical-records-container');
        if (!recordsContainer) return;

        if (records.length === 0) {
            recordsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-notes-medical text-4xl mb-4"></i>
                    <p>No medical records found</p>
                </div>
            `;
            return;
        }

        recordsContainer.innerHTML = records.map(record => `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-gray-800">${record.title}</h3>
                        <p class="text-sm text-gray-500">Dr. ${record.doctor.name} - ${record.doctor.specialization}</p>
                        <p class="text-sm text-gray-500">${new Date(record.date).toLocaleDateString()}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="viewRecord('${record._id}')"
                                class="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition duration-150">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="downloadRecord('${record._id}')"
                                class="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition duration-150">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                <div class="mt-4">
                    <p class="text-gray-600">${record.description}</p>
                    ${record.attachments ? `
                        <div class="mt-2">
                            <p class="text-sm font-medium text-gray-500">Attachments:</p>
                            <div class="flex flex-wrap gap-2 mt-1">
                                ${record.attachments.map(attachment => `
                                    <a href="/medical-records/attachment/${attachment._id}"
                                       class="text-sm text-blue-600 hover:text-blue-700 flex items-center">
                                        <i class="fas fa-paperclip mr-1"></i>
                                        ${attachment.name}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        updatePagination(page, totalPages);
    } catch (error) {
        console.error('Error loading medical records:', error);
        NotificationService.error('Error loading medical records');
    }
}

// Get filter values
function getFilters() {
    return {
        doctor: document.querySelector('#doctor-filter')?.value,
        dateFrom: document.querySelector('#date-from')?.value,
        dateTo: document.querySelector('#date-to')?.value,
        search: document.querySelector('#search-input')?.value
    };
}

// Setup filters
function setupFilters() {
    const filterForm = document.querySelector('#filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            currentPage = 1;
            loadMedicalRecords(currentPage);
        });

        // Reset filters
        document.querySelector('#reset-filters')?.addEventListener('click', () => {
            filterForm.reset();
            currentPage = 1;
            loadMedicalRecords(currentPage);
        });
    }
}

// Setup pagination
function setupPagination() {
    const paginationContainer = document.querySelector('#pagination');
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page !== currentPage) {
                    currentPage = page;
                    loadMedicalRecords(page);
                }
            }
        });
    }
}

// Update pagination UI
function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#pagination');
    if (!paginationContainer) return;

    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
        <button class="px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}"
                ${currentPage === 1 ? 'disabled' : `data-page="${currentPage - 1}"`}>
            Previous
        </button>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHtml += `
                <button class="px-3 py-1 rounded-md ${i === currentPage ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'}"
                        data-page="${i}">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHtml += `<span class="px-2">...</span>`;
        }
    }

    // Next button
    paginationHtml += `
        <button class="px-3 py-1 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}"
                ${currentPage === totalPages ? 'disabled' : `data-page="${currentPage + 1}"`}>
            Next
        </button>
    `;

    paginationContainer.innerHTML = paginationHtml;
}

// View medical record details
async function viewRecord(recordId) {
    try {
        const response = await fetch(`/medical-records/${recordId}`);
        const record = await response.json();
        
        const modalContent = `
            <div class="space-y-4">
                <div>
                    <h4 class="font-medium text-gray-500">Doctor</h4>
                    <p class="mt-1">Dr. ${record.doctor.name} - ${record.doctor.specialization}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-500">Date</h4>
                    <p class="mt-1">${new Date(record.date).toLocaleDateString()}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-500">Diagnosis</h4>
                    <p class="mt-1">${record.diagnosis}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-500">Treatment</h4>
                    <p class="mt-1">${record.treatment}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-500">Prescription</h4>
                    <div class="mt-1 space-y-2">
                        ${record.prescription.map(med => `
                            <div class="flex justify-between items-center">
                                <span>${med.name}</span>
                                <span class="text-gray-500">${med.dosage}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${record.notes ? `
                    <div>
                        <h4 class="font-medium text-gray-500">Notes</h4>
                        <p class="mt-1">${record.notes}</p>
                    </div>
                ` : ''}
                ${record.attachments?.length ? `
                    <div>
                        <h4 class="font-medium text-gray-500">Attachments</h4>
                        <div class="mt-1 flex flex-wrap gap-2">
                            ${record.attachments.map(attachment => `
                                <a href="/medical-records/attachment/${attachment._id}"
                                   class="text-blue-600 hover:text-blue-700 flex items-center">
                                    <i class="fas fa-paperclip mr-1"></i>
                                    ${attachment.name}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        showModal('Medical Record Details', modalContent);
    } catch (error) {
        console.error('Error loading record details:', error);
        NotificationService.error('Error loading record details');
    }
}

// Download medical record
async function downloadRecord(recordId) {
    try {
        const response = await fetch(`/medical-records/${recordId}/download`);
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical-record-${recordId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        NotificationService.success('Medical record downloaded successfully');
    } catch (error) {
        console.error('Error downloading record:', error);
        NotificationService.error('Error downloading record');
    }
}

// Show modal
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="text-gray-400 hover:text-gray-500 focus:outline-none">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mt-4">
                    ${content}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Export functions for global access
window.viewRecord = viewRecord;
window.downloadRecord = downloadRecord; 