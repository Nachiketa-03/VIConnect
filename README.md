# VIConnect

VIConnect is a comprehensive web application designed to enhance the campus experience for VIT students. It provides a modern, dark-themed dashboard with AI assistance, hostel management, sports registration, CGPA calculation, campus navigation, and a community forum.

## Features

### 1. AI ChatBot
- Powered by Google Gemini AI
- Real-time conversational responses
- Campus-related query assistance

### 2. Hostel & Mess
- View 26 hostel blocks (Boys & Girls)
- Detailed room types, facilities, and pricing
- Visual gallery of rooms and blocks

### 3. CGPA Calculator
- Calculate cumulative GPA with animated gauge
- Target CGPA planner
- Semester-wise credit tracking

### 4. Campus Navigation
- Interactive Google Maps integration
- 9 key campus locations with directions
- Real-time route planning

### 5. Sports Registration
- 12 sports facilities (Gym, Swimming, Tennis, etc.)
- QR-code based payment system
- Category and gender filtering

### 6. Community Forum
- Create posts with categories (General, Academic, Events, Clubs, Help)
- Like, comment, and delete posts
- Real-time feed with category filtering

### 7. User Authentication
- Email/password registration with bcrypt hashing
- Google OAuth2 Sign-In
- Password reset via email with token-based security
- Inactivity timeout with warning

### 8. Page Transitions
- Smooth blur-in/blur-out page animations
- Purple sweep overlay between navigations

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **AI:** Google Gemini Pro API
- **Auth:** bcrypt, Google OAuth2, JWT-style reset tokens
- **Email:** Nodemailer (Gmail SMTP)
- **Libraries:** SweetAlert2, Font Awesome 6, Canvas Confetti, QRCode.js, Google Maps API
- **Design:** Inter font, glassmorphism, dark/light theme toggle

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/Nachiketa-03/VIConnect.git
```

2. Install dependencies:
```bash
cd VIConnect
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=your_mongodb_connection_string
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
DEVICE_NAME=Your Device
LOCATION=Your Location
USER_NAME=Your Name
```

4. Start the server:
```bash
npm start
```

The application will be running at `http://localhost:3000`

## Project Structure

```
├── server.js              # Express backend (API routes, MongoDB, AI, email)
├── models/
│   └── resetToken.js      # Password reset token schema
├── public/                # Login/Register pages
│   ├── index.html         # Auth page
│   ├── styles.css
│   ├── transitions.css    # Page transition animations
│   ├── transitions.js     # Transition engine
│   └── js/
│       ├── auth.js        # Login/Register/Google auth handlers
│       └── reset-password.js
├── dashboard/
│   ├── index.html         # Main dashboard hub
│   ├── script.js          # Dashboard logic
│   ├── styles.css
│   ├── ai-chat/           # AI chatbot interface
│   ├── CGPA/              # CGPA calculator
│   ├── community/         # Community forum
│   ├── Google map/        # Campus navigation
│   ├── Hostel/            # Hostel management
│   └── Sports registration/  # Sports booking
```

## Contributing

Feel free to contribute by creating pull requests or reporting issues.

## License

This project is open source and available under the MIT License.

## Contact

For any queries, reach out to the project maintainer:
- GitHub: [@Nachiketa-03](https://github.com/Nachiketa-03) 