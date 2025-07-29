# 📘 NoteNest

A minimal, privacy-focused web application for writing and saving notes with Firebase integration, plus a static image gallery.

## ✨ Features

- **📝 Notes Management**: Create, edit, delete, and organize notes with tags
- **🖼️ Image Gallery**: Display images from the `/images/` folder
- **🔍 Search & Filter**: Search notes by content and filter by tags
- **🌙 Dark Mode**: Toggle between light and dark themes
- **📱 Responsive Design**: Works on desktop and mobile devices
- **☁️ Cloud Storage**: Notes are stored in Firebase Firestore
- **🔒 Privacy-Focused**: No user authentication required

## 🚀 Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Firestore Database
4. Go to Project Settings > General > Your apps
5. Add a web app and copy the configuration object
6. Replace the configuration in `firebase/firebaseConfig.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 2. Firestore Security Rules

In the Firebase Console, go to Firestore Database > Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if true;
    }
  }
}
```

**Note**: These rules allow public access. For production, consider implementing proper authentication and security rules.

### 3. Add Images

1. Add your images to the `/images/` folder
2. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
3. Update the `predefinedImages` array in `scripts/app.js` with your image filenames

### 4. Deploy

#### Option A: Local Development
1. Use a local web server (e.g., `python -m http.server` or Live Server extension)
2. Open `index.html` in your browser

#### Option B: Vercel Deployment
1. Push your code to a GitHub repository
2. Connect your repository to [Vercel](https://vercel.com/)
3. Deploy automatically on every commit

#### Option C: GitHub Pages
1. Push your code to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Your app will be available at `https://username.github.io/repository-name`

## 📁 Project Structure

```
NoteNest/
├── index.html              # Main application page
├── images/                 # Static image folder
│   ├── sample1.jpg
│   ├── sample2.png
│   └── sample3.webp
├── scripts/
│   └── app.js             # Main application logic
├── styles/
│   └── style.css          # Custom styles
├── firebase/
│   └── firebaseConfig.js  # Firebase configuration
└── README.md              # This file
```

## 🎯 Usage

### Notes
- Click "New Note" to create a note
- Click on any note card to edit it
- Use tags to organize your notes (comma-separated)
- Search notes by title or content
- Filter notes by tags
- Sort notes by date or title

### Gallery
- Switch to the Gallery tab to view images
- Click on any image to view it in full size
- Add new images by placing them in the `/images/` folder

### Keyboard Shortcuts
- `Ctrl + N`: Create new note
- `Escape`: Close modals

## 🔧 Customization

### Adding More Images
1. Place image files in the `/images/` folder
2. Update the `predefinedImages` array in `scripts/app.js`:

```javascript
const predefinedImages = [
    'your-image1.jpg',
    'your-image2.png',
    'your-image3.webp',
    // Add more images here
];
```

### Styling
- Modify `styles/style.css` for custom styling
- The app uses Tailwind CSS for base styling
- Dark mode styles are included

### Firebase Configuration
- Update `firebase/firebaseConfig.js` with your Firebase project details
- Modify Firestore security rules as needed for your use case

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Hosting**: Vercel, GitHub Pages, or any static hosting service

## 📝 Notes

- This app doesn't require user authentication
- Notes are stored publicly in Firestore (adjust security rules for production)
- Images are served statically from the `/images/` folder
- The app works offline for viewing existing notes (with service worker implementation)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

