# 🖼️ Private Gallery Vault

> *A poetic, secure, and emotionally intelligent image vault — built exclusively for two trusted souls.*

## ✨ Overview

Private Gallery Vault is a secure image storage and viewing platform designed for two specific users only — no public access, no extra roles. It offers advanced protection of personal photos using Firebase Authentication, Firestore, ImageKit, and custom serverless logic.

But more than just protection, it provides an emotionally rich, aesthetically pleasing experience — with AI tagging, encrypted notes, ambient interactions, and interactive filtering, wrapped in a responsive, minimalist design.

## 🌟 Key Features

### 🔐 Security Features
- **Whitelisted Authentication**: Only 2 specific email addresses can access the vault
- **Auto-Lock Mechanism**: Vault automatically locks after 10 minutes of inactivity
- **Encrypted Private Notes**: Secret messages encrypted client-side with AES
- **Signed Image URLs**: All images served through signed, expiring URLs
- **Firebase Security Rules**: Backend protected with strict access controls

### 🧠 Emotional Intelligence
- **AI-Powered Tagging**: Automatic emotion and scene detection for uploaded images
- **Mood-Based Filtering**: Filter memories by Love 💗, Rain 🌧️, Travel ✈️, Letters ✉️, Night 🌌
- **Secret Notes**: Encrypted captions that fade after viewing for security
- **Poetic UI**: Loading messages and interactions designed to feel warm and personal

### 🎨 Beautiful UX
- **Ambient Cursor Glow**: Soft light follows your cursor creating a magical atmosphere
- **Masonry Gallery**: Responsive grid layout with smooth hover animations
- **Vault Animations**: Elegant opening/closing transitions with GSAP
- **Mobile Responsive**: Touch-friendly interface optimized for all devices
- **Dark Theme**: Warm grayscale palette with soft accent colors

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, GSAP
- **Authentication**: Firebase Auth with email/password
- **Database**: Firebase Firestore for metadata storage
- **Image Storage**: ImageKit.io with private signed URLs
- **Encryption**: AES.js for client-side note encryption
- **Deployment**: Vercel with serverless functions
- **Styling**: Custom CSS with CSS variables and animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Firebase project with Authentication and Firestore enabled
- ImageKit.io account for image storage
- Vercel account for deployment

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd private-gallery-vault
   pnpm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual credentials
   ```

3. **Configure Firebase**
   - Create a new Firebase project
   - Enable Authentication with Email/Password
   - Enable Firestore Database
   - Add your domain to authorized domains

4. **Configure ImageKit**
   - Create ImageKit.io account
   - Get your public key, private key, and URL endpoint
   - Add credentials to environment variables

5. **Start development server**
   ```bash
   pnpm run dev --host
   ```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# ImageKit Configuration
VITE_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imageio.io/your_imagekit_id
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key

# Allowed Users (only these 2 emails can access)
VITE_ALLOWED_EMAIL_1=user1@example.com
VITE_ALLOWED_EMAIL_2=user2@example.com

# Encryption Secret
VITE_ENCRYPTION_SECRET=your_secret_encryption_key

# API Base URL
VITE_API_BASE_URL=https://your-app.vercel.app
```

## 📱 Usage

### Authentication
1. Only the two whitelisted email addresses can log in
2. Vault automatically locks after 10 minutes of inactivity
3. Timer shows remaining time until auto-lock

### Uploading Images
1. Click the "Upload" button in the header
2. Drag and drop images or click to select
3. Add title, tags, and optional secret notes
4. Choose whether to encrypt notes
5. AI will suggest relevant tags based on image content

### Viewing Images
1. Browse images in the responsive masonry grid
2. Filter by mood tags using the floating strip
3. Click images to view in full-screen lightbox
4. Decrypt and view secret notes (auto-hide after 30 seconds)

### Managing Images
1. Edit tags and notes directly in the lightbox
2. Delete images with confirmation dialog
3. All changes sync in real-time

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Import your GitHub repository in Vercel
   - Add all environment variables in Vercel dashboard
   - Deploy automatically

3. **Configure Domain**
   - Add your custom domain in Vercel
   - Update `VITE_API_BASE_URL` to your production URL

## 🔒 Security Considerations

- **Email Whitelist**: Only 2 specific emails can access the vault
- **Client-Side Encryption**: Secret notes encrypted before sending to server
- **Signed URLs**: All images served through time-limited signed URLs
- **Auto-Lock**: Automatic logout after inactivity
- **Firebase Rules**: Strict database security rules
- **HTTPS Only**: All communications encrypted in transit

## 🎨 Customization

### Themes
Edit CSS variables in `src/App.css`:
```css
:root {
  --vault-primary: #1a1a2e;
  --vault-secondary: #16213e;
  --vault-accent: #e94560;
  --vault-accent-soft: #f4a6cd;
}
```

### Auto-Lock Timer
Adjust timeout in `src/App.jsx`:
```javascript
const { timeRemaining, formattedTime, resetTimer } = useAutoLock(10); // 10 minutes
```

### AI Tags
Customize suggested tags in `src/components/Upload/UploadModal.jsx`:
```javascript
const mockTags = ['beautiful', 'memory', 'precious', 'love', 'joy'];
```

## 📁 Project Structure

```
private-gallery-vault/
├── api/                    # Vercel serverless functions
│   ├── auth.js            # ImageKit authentication
│   └── delete-image.js    # Image deletion endpoint
├── src/
│   ├── components/        # React components
│   │   ├── Auth/         # Authentication components
│   │   ├── Gallery/      # Image gallery components
│   │   ├── Upload/       # Upload functionality
│   │   └── UI/           # UI components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # External service integrations
│   └── App.jsx           # Main application component
├── .env.example          # Environment variables template
├── vercel.json           # Vercel deployment configuration
└── README.md             # This file
```

## 💫 Easter Eggs

- **Ambient Cursor**: Soft glow follows your mouse movement
- **Poetic Messages**: Loading states with romantic, poetic text
- **Floating Animations**: Subtle animations throughout the interface
- **Secret Notes**: Encrypted messages that auto-hide for security

## 🤝 Contributing

This is a private project designed for two specific users. However, you can fork it and customize it for your own use case.

## 📄 License

Private project - All rights reserved.

---

*"Every memory. Every heartbeat. Protected." 🗝️❤️*

