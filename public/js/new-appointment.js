import NotificationService from './notification-service.js';
import { generateTimeSlots, isTimeSlotAvailable } from './appointment-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    initializeDatePicker();
    setupEventListeners();
    loadSpecializations();
});

// Initialize Flatpickr date picker
function initializeDatePicker() {
    const appointmentDate = document.querySelector('#appointment-date');
    if (appointmentDate) {
        flatpickr(appointmentDate, {
            minDate: "today",
            dateFormat: "Y-m-d",
            onChange: function(selectedDates) {
                loadDoctors();
            }
        });
    }
}

// Load specializations
async function loadSpecializations() {
    try {
        const response = await fetch('/doctors/specializations');
        const specializations = await response.json();
        
        const specializationSelect = document.querySelector('#specialization');
        if (!specializationSelect) return;

        specializationSelect.innerHTML = `
            <option value="">All Specializations</option>
            ${specializations.map(spec => `
                <option value="${spec}">${spec}</option>
            `).join('')}
        `;
    } catch (error) {
        console.error('Error loading specializations:', error);
        NotificationService.error('Error loading specializations');
    }
}

// Load available doctors
async function loadDoctors() {
    try {
        const specialization = document.querySelector('#specialization').value;
        const date = document.querySelector('#appointment-date').value;
        const searchQuery = document.querySelector('#search-doctor').value;
        
        if (!date) {
            NotificationService.warning('Please select a date first');
            return;
        }

        const queryParams = new URLSearchParams({
            specialization,
            date,
            search: searchQuery
        });

        const response = await fetch(`/doctors/available?${queryParams}`);
        const doctors = await response.json();
        
        const doctorList = document.querySelector('#doctor-list');
        if (!doctorList) return;

        if (doctors.length === 0) {
            doctorList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-user-md text-4xl mb-4"></i>
                    <p>No doctors available for selected criteria</p>
                </div>
            `;
            return;
        }

        doctorList.innerHTML = doctors.map(doctor => `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${doctor.profileImage || '/images/default-avatar.png'}" 
                             alt="${doctor.name}" 
                             class="w-12 h-12 rounded-full object-cover">
                        <div class="ml-4">
                            <h3 class="font-semibold text-gray-800">${doctor.name}</h3>
                            <p class="text-sm text-gray-500">${doctor.specialization}</p>
                            <div class="flex items-center mt-1">
                                <div class="flex text-yellow-400">
                                    ${generateStarRating(doctor.rating)}
                                </div>
                                <span class="text-sm text-gray-500 ml-2">${doctor.totalReviews} reviews</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">Consultation Fee</p>
                        <p class="font-semibold text-gray-800">$${doctor.consultationFee}</p>
                    </div>
                </div>
                <div class="mt-4">
                    <p class="text-sm text-gray-600 mb-2">${doctor.about}</p>
                    <div class="grid grid-cols-4 gap-2">
                        ${generateTimeSlots(doctor.availability.startTime, doctor.availability.endTime)
                            .map(slot => `
                                <button onclick="selectTimeSlot('${doctor._id}', '${slot.time}', this)"
                                        class="px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition duration-150">
                                    ${slot.formatted}
                                </button>
                            `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading doctors:', error);
        NotificationService.error('Error loading doctors');
    }
}

// Select time slot
function selectTimeSlot(doctorId, time, button) {
    // Remove active class from all buttons
    document.querySelectorAll('#doctor-list button').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-blue-50', 'text-blue-600');
    });

    // Add active class to selected button
    button.classList.remove('bg-blue-50', 'text-blue-600');
    button.classList.add('bg-blue-600', 'text-white');

    // Show booking form
    const bookingForm = document.querySelector('#booking-form');
    bookingForm.classList.remove('hidden');
    bookingForm.scrollIntoView({ behavior: 'smooth' });

    // Set form values
    document.querySelector('#selected-doctor-id').value = doctorId;
    document.querySelector('#selected-time').value = time;
}

// Book appointment
async function bookAppointment(event) {
    event.preventDefault();

    try {
        const doctorId = document.querySelector('#selected-doctor-id').value;
        const date = document.querySelector('#appointment-date').value;
        const time = document.querySelector('#selected-time').value;
        const symptoms = document.querySelector('#symptoms').value;
        const notes = document.querySelector('#notes').value;

        if (!validateBookingInputs(date, time, symptoms)) {
            return;
        }

        // Check if slot is still available
        const isAvailable = await checkSlotAvailability(doctorId, date, time);
        if (!isAvailable) {
            NotificationService.warning('This time slot is no longer available. Please choose another time.');
            loadDoctors();
            return;
        }

        const response = await fetch('/appointments/book', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                doctorId,
                date,
                time,
                symptoms,
                notes
            })
        });

        if (response.ok) {
            NotificationService.success('Appointment booked successfully');
            // Reset form
            event.target.reset();
            document.querySelector('#booking-form').classList.add('hidden');
            // Redirect to appointments page
            window.location.href = '/appointments';
        } else {
            const error = await response.json();
            NotificationService.error(error.message);
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        NotificationService.error('Error booking appointment');
    }
}

// Validate booking inputs
function validateBookingInputs(date, time, symptoms) {
    if (!date) {
        NotificationService.warning('Please select a date');
        return false;
    }
    if (!time) {
        NotificationService.warning('Please select a time slot');
        return false;
    }
    if (!symptoms || symptoms.trim().length < 10) {
        NotificationService.warning('Please describe your symptoms (minimum 10 characters)');
        return false;
    }
    return true;
}

// Check slot availability
async function checkSlotAvailability(doctorId, date, time) {
    try {
        const response = await fetch(`/appointments/check-availability?doctorId=${doctorId}&date=${date}&time=${time}`);
        const { available } = await response.json();
        return available;
    } catch (error) {
        console.error('Error checking slot availability:', error);
        return false;
    }
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Setup event listeners
function setupEventListeners() {
    // Specialization change
    document.querySelector('#specialization')?.addEventListener('change', loadDoctors);

    // Doctor search
    const searchInput = document.querySelector('#search-doctor');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadDoctors(), 300));
    }

    // Booking form submission
    const bookingForm = document.querySelector('#booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', bookAppointment);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for global access
window.selectTimeSlot = selectTimeSlot; 