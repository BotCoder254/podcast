# Doctor Appointment System

A modern web application for managing doctor appointments, built with Node.js, MongoDB, and Tailwind CSS.

## Features

- User Authentication (Patients and Doctors)
- Appointment Booking System
- Doctor Search and Filtering
- Responsive Design with Tailwind CSS
- Secure Password Handling
- JWT-based Authentication

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

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
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. Start MongoDB service:
```bash
sudo service mongodb start
```

5. Run the application:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
├── models/
│   └── User.js
├── routes/
│   └── auth.js
├── views/
│   ├── index.ejs
│   ├── login.ejs
│   └── register.ejs
├── middleware/
│   └── auth.js
├── .env
├── package.json
├── README.md
└── server.js
```

## Color Scheme

The application uses a professional color scheme:
- Primary: Blue (#2563EB)
- Secondary: Gray (#4B5563)
- Accent: White (#FFFFFF)
- Background: Light Gray (#F9FAFB)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- HTTP-only cookies for token storage
- Input validation and sanitization
- CSRF protection

## Support

For support, email support@medcare.com or create an issue in the repository. 