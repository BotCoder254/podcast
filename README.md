# Doctor Appointment System

A modern web application for managing doctor appointments and medical records.

## Features

- User Authentication (Patients & Doctors)
- Appointment Booking & Management
- Real-time Updates using Socket.IO
- Medical Records Management
- Profile Management
- Responsive Design

## Tech Stack

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Template Engine**: EJS
- **Real-time Communication**: Socket.IO
- **Additional Libraries**: 
  - Flatpickr (Date Picker)
  - Alpine.js (Minimal JavaScript Framework)
  - Font Awesome (Icons)

## Project Structure

```
.
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── appointments.js
│   │   ├── medical-records.js
│   │   ├── new-appointment.js
│   │   ├── profile.js
│   │   ├── socket-service.js
│   │   ├── appointment-utils.js
│   │   └── notification-service.js
│   └── images/
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── appointments.ejs
│   ├── medical-records.ejs
│   ├── new-appointment.ejs
│   └── profile.ejs
├── routes/
│   ├── index.js
│   ├── auth.js
│   ├── appointments.js
│   ├── medical-records.js
│   ├── profile.js
│   └── doctors.js
├── models/
│   ├── user.js
│   ├── appointment.js
│   └── medical-record.js
├── app.js
├── package.json
└── .env
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd doctor-appointment-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/doctor-appointment
   SESSION_SECRET=your_session_secret_here
   NODE_ENV=development
   ```

4. Start MongoDB service:
   ```bash
   sudo service mongod start
   ```

5. Run the application:
   - For development:
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

6. Access the application:
   - Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm start`: Starts the production server
- `npm run dev`: Starts the development server with nodemon
- `npm test`: Runs the test suite

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- HTTP-only cookies for token storage
- Input validation and sanitization
- CSRF protection

## Support

For support, email support@medcare.com or create an issue in the repository. 