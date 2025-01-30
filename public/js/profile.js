import NotificationService from './notification-service.js';

document.addEventListener('DOMContentLoaded', function() {
    setupProfileImageUpload();
    setupProfileForm();
});

// Handle profile image upload
function setupProfileImageUpload() {
    const imageInput = document.querySelector('#profile-image');
    if (!imageInput) return;

    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            NotificationService.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            NotificationService.error('Image size should be less than 5MB');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('profileImage', file);

            const response = await fetch('/profile/upload-image', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const { imageUrl } = await response.json();
                // Update profile image
                document.querySelector('img[alt="Profile"]').src = imageUrl;
                NotificationService.success('Profile image updated successfully');
            } else {
                const error = await response.json();
                NotificationService.error(error.message);
            }
        } catch (error) {
            console.error('Error uploading profile image:', error);
            NotificationService.error('Error uploading profile image');
        }
    });
}

// Handle profile form submission
function setupProfileForm() {
    const form = document.querySelector('#profile-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            // Format emergency contact data
            data.emergencyContact = {
                name: data['emergencyContact.name'],
                relationship: data['emergencyContact.relationship'],
                phone: data['emergencyContact.phone']
            };
            delete data['emergencyContact.name'];
            delete data['emergencyContact.relationship'];
            delete data['emergencyContact.phone'];

            const response = await fetch('/profile/update', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                NotificationService.success('Profile updated successfully');
                // Update displayed name if changed
                const nameElements = document.querySelectorAll('.user-name');
                nameElements.forEach(el => el.textContent = data.name);
            } else {
                const error = await response.json();
                NotificationService.error(error.message);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            NotificationService.error('Error updating profile');
        }
    });
}

// Validate phone number format
function validatePhone(phone) {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
}

// Format date for display
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format allergies for display
function formatAllergies(allergies) {
    if (!allergies) return '';
    return allergies.split(',').map(a => a.trim()).join(', ');
}

// Update profile preview
function updateProfilePreview(data) {
    const previewElements = {
        name: document.querySelector('.profile-name'),
        phone: document.querySelector('.profile-phone'),
        dateOfBirth: document.querySelector('.profile-dob'),
        bloodGroup: document.querySelector('.profile-blood-group'),
        height: document.querySelector('.profile-height'),
        weight: document.querySelector('.profile-weight'),
        allergies: document.querySelector('.profile-allergies')
    };

    if (previewElements.name) previewElements.name.textContent = data.name;
    if (previewElements.phone) previewElements.phone.textContent = data.phone;
    if (previewElements.dateOfBirth) previewElements.dateOfBirth.textContent = formatDate(data.dateOfBirth);
    if (previewElements.bloodGroup) previewElements.bloodGroup.textContent = data.bloodGroup;
    if (previewElements.height) previewElements.height.textContent = `${data.height} cm`;
    if (previewElements.weight) previewElements.weight.textContent = `${data.weight} kg`;
    if (previewElements.allergies) previewElements.allergies.textContent = formatAllergies(data.allergies);
} 