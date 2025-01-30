import NotificationService from './notification-service.js';
import { AppointmentStatus, generateAppointmentCard } from './appointment-utils.js';

let currentPage = 1;
const appointmentsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    loadAppointments();
    setupFilters();
    setupPagination();
});

// Load appointments with pagination
async function loadAppointments(page = 1) {
    try {
        const filters = getFilters();
        const response = await fetch(`/appointments/list?page=${page}&limit=${appointmentsPerPage}&${new URLSearchParams(filters)}`);
        const { appointments, total, totalPages } = await response.json();
        
        const appointmentsContainer = document.querySelector('#appointments-container');
        if (!appointmentsContainer) return;

        if (appointments.length === 0) {
            appointmentsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-times text-4xl mb-4"></i>
                    <p>No appointments found</p>
                </div>
            `;
            return;
        }

        appointmentsContainer.innerHTML = appointments
            .map(appointment => generateAppointmentCard(appointment))
            .join('');

        updatePagination(page, totalPages);
    } catch (error) {
        console.error('Error loading appointments:', error);
        NotificationService.error('Error loading appointments');
    }
}

// Get filter values
function getFilters() {
    return {
        status: document.querySelector('#status-filter')?.value,
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
            loadAppointments(currentPage);
        });

        // Reset filters
        document.querySelector('#reset-filters')?.addEventListener('click', () => {
            filterForm.reset();
            currentPage = 1;
            loadAppointments(currentPage);
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
                    loadAppointments(page);
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

// Cancel appointment
async function cancelAppointment(appointmentId) {
    try {
        const response = await fetch(`/appointments/${appointmentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            NotificationService.success('Appointment cancelled successfully');
            loadAppointments(currentPage);
        } else {
            const error = await response.json();
            NotificationService.error(error.message);
        }
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        NotificationService.error('Error cancelling appointment');
    }
}

// Reschedule appointment
async function rescheduleAppointment(appointmentId) {
    try {
        const newDate = document.querySelector(`#reschedule-date-${appointmentId}`).value;
        const newTime = document.querySelector(`#reschedule-time-${appointmentId}`).value;

        if (!newDate || !newTime) {
            NotificationService.warning('Please select both date and time');
            return;
        }

        const response = await fetch(`/appointments/${appointmentId}/reschedule`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: newDate,
                time: newTime
            })
        });

        if (response.ok) {
            NotificationService.success('Appointment rescheduled successfully');
            loadAppointments(currentPage);
        } else {
            const error = await response.json();
            NotificationService.error(error.message);
        }
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        NotificationService.error('Error rescheduling appointment');
    }
}

// Export functions for global access
window.cancelAppointment = cancelAppointment;
window.rescheduleAppointment = rescheduleAppointment; 