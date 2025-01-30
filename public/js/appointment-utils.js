// Appointment status constants
export const AppointmentStatus = {
    REQUESTED: 'requested',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Status badge styles
export const getStatusBadgeClass = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
        case AppointmentStatus.REQUESTED:
            return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case AppointmentStatus.CONFIRMED:
            return `${baseClasses} bg-green-100 text-green-800`;
        case AppointmentStatus.IN_PROGRESS:
            return `${baseClasses} bg-blue-100 text-blue-800`;
        case AppointmentStatus.COMPLETED:
            return `${baseClasses} bg-gray-100 text-gray-800`;
        case AppointmentStatus.CANCELLED:
            return `${baseClasses} bg-red-100 text-red-800`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
};

// Generate appointment card HTML
export const generateAppointmentCard = (appointment) => {
    return `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transform transition duration-200 hover:shadow-md">
            <div class="flex justify-between items-start">
                <div class="flex items-center">
                    <img src="${appointment.doctor?.profileImage || appointment.patient?.profileImage || '/images/default-avatar.png'}" 
                         alt="Profile" 
                         class="w-12 h-12 rounded-full object-cover">
                    <div class="ml-4">
                        <h3 class="font-semibold text-gray-800">
                            ${appointment.doctor?.name || appointment.patient?.name}
                        </h3>
                        <p class="text-sm text-gray-500">
                            ${appointment.doctor?.specialization || 'Patient'}
                        </p>
                    </div>
                </div>
                <span class="${getStatusBadgeClass(appointment.status)}">
                    ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
            </div>
            <div class="mt-4">
                <div class="flex items-center text-sm text-gray-600 mb-2">
                    <i class="fas fa-calendar-alt mr-2"></i>
                    <span>${new Date(appointment.date).toLocaleDateString()}</span>
                    <i class="fas fa-clock ml-4 mr-2"></i>
                    <span>${appointment.time}</span>
                </div>
                ${appointment.symptoms ? `
                    <div class="text-sm text-gray-600 mt-2">
                        <p class="font-medium">Symptoms:</p>
                        <p>${appointment.symptoms}</p>
                    </div>
                ` : ''}
            </div>
            ${generateActionButtons(appointment)}
        </div>
    `;
};

// Generate action buttons based on appointment status and user role
export const generateActionButtons = (appointment) => {
    const isDoctor = window.location.pathname.includes('doctor');
    let buttons = '';

    if (isDoctor) {
        switch (appointment.status) {
            case AppointmentStatus.REQUESTED:
                buttons = `
                    <div class="mt-4 flex justify-end space-x-2">
                        <button onclick="updateAppointmentStatus('${appointment._id}', '${AppointmentStatus.CONFIRMED}')"
                                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150">
                            Confirm
                        </button>
                        <button onclick="updateAppointmentStatus('${appointment._id}', '${AppointmentStatus.CANCELLED}')"
                                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150">
                            Decline
                        </button>
                    </div>
                `;
                break;
            case AppointmentStatus.CONFIRMED:
                buttons = `
                    <div class="mt-4 flex justify-end space-x-2">
                        <button onclick="updateAppointmentStatus('${appointment._id}', '${AppointmentStatus.IN_PROGRESS}')"
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150">
                            Start Session
                        </button>
                    </div>
                `;
                break;
            case AppointmentStatus.IN_PROGRESS:
                buttons = `
                    <div class="mt-4 flex justify-end space-x-2">
                        <button onclick="updateAppointmentStatus('${appointment._id}', '${AppointmentStatus.COMPLETED}')"
                                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150">
                            Complete
                        </button>
                    </div>
                `;
                break;
        }
    } else {
        // Patient actions
        if (appointment.status === AppointmentStatus.REQUESTED || appointment.status === AppointmentStatus.CONFIRMED) {
            buttons = `
                <div class="mt-4 flex justify-end space-x-2">
                    <button onclick="rescheduleAppointment('${appointment._id}')"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150">
                        Reschedule
                    </button>
                    <button onclick="updateAppointmentStatus('${appointment._id}', '${AppointmentStatus.CANCELLED}')"
                            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150">
                        Cancel
                    </button>
                </div>
            `;
        }
    }

    return buttons;
};

// Format time slots for display
export const formatTimeSlot = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
};

// Generate time slots for booking
export const generateTimeSlots = (startTime, endTime, duration = 30, bookedSlots = []) => {
    const slots = [];
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    while (start < end) {
        const timeString = start.toTimeString().slice(0, 5);
        if (!bookedSlots.includes(timeString)) {
            slots.push({
                time: timeString,
                formatted: formatTimeSlot(timeString)
            });
        }
        start.setMinutes(start.getMinutes() + duration);
    }
    
    return slots;
};

// Check if a time slot is available
export const isTimeSlotAvailable = (timeSlot, bookedSlots) => {
    return !bookedSlots.includes(timeSlot);
}; 