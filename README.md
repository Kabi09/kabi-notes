# Kabi Notes - Full-Stack MERN Notes Application

A complete, production-ready, personal cloud-based **Notes Management Web Application** built using the **MERN Stack** (MongoDB, Express.js, React.js with Vite, Node.js) featuring JWT authentication, Nodemailer password reset emails, Cloudinary file uploads, debounced autosave drafts, pin/unpin notes, rich text editor, search, tag filtering, dark/light theme persistence, and strict user data isolation.

---

## 🌟 Features

- **Authentication & Security**
  - Secure Signup & Login with bcrypt password hashing
  - JWT Authentication via HTTP-only Cookies & Bearer Tokens
  - Forgot Password & Password Reset links dispatched via Nodemailer HTML emails
  - Strict User Ownership Enforcement (User A can never read, edit, delete, or access User B's notes or files)
  - Rate limiting & Helmet security headers

- **Notes Management**
  - WYSIWYG Rich Text Editor (Bold, Italic, Underline, Headings, Lists, Links, Code formatting, Undo/Redo)
  - Easy Draft System with debounced autosaving (`Saving...` -> `Saved ✓`)
  - Pin / Unpin important notes to render at top
  - Real-time search across titles, content, and tags
  - View filters (All Notes, Pinned, Drafts, Archived) & dynamic tag filtering
  - Multiple sorting options (Recently Updated, Recently Created, Oldest, Title A-Z, Title Z-A)

- **File Attachments**
  - Multi-file attachment support (PDF, DOC, DOCX, TXT, CSV, XLS, PPT, ZIP, JPG, PNG, WEBP, GIF)
  - Cloudinary cloud storage integration with automatic user-isolated folder organization
  - Built-in local upload fallback for development
  - Progress bar during uploads
  - Modal image previewer and direct attachment downloading

- **Modern UX & Aesthetics**
  - Dark Mode and Light Mode with instant toggle & `localStorage` persistence
  - Glassmorphic modern aesthetic, responsive desktop sidebar, and mobile navigation drawer
  - Accessible modal dialogs and toast notifications

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, React Router DOM v7, Axios, CSS Modules, MUI Icons, DOMPurify
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Nodemailer, Multer, Cloudinary, Express Rate Limit, Helmet

---

## 📂 Folder Structure

```text
Kabi-Notes/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── noteController.js
│   │   └── fileController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── rateLimitMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── Note.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── noteRoutes.js
│   │   └── fileRoutes.js
│   ├── services/
│   │   ├── mailService.js
│   │   └── cloudinaryService.js
│   ├── utils/
│   │   ├── token.js
│   │   └── validation.js
│   ├── test-ownership.js
│   ├── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/
│   │   │   ├── Sidebar/
│   │   │   ├── NoteCard/
│   │   │   ├── RichEditor/
│   │   │   ├── FileAttachment/
│   │   │   ├── SearchBar/
│   │   │   ├── Modal/
│   │   │   └── Toast/
│   │   ├── pages/
│   │   │   ├── Signup/
│   │   │   ├── Login/
│   │   │   ├── Welcome/
│   │   │   ├── ForgotPassword/
│   │   │   ├── ResetPassword/
│   │   │   ├── Dashboard/
│   │   │   └── NoteEditorPage/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authApi.js
│   │   │   ├── notesApi.js
│   │   │   └── filesApi.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/kabi-notes

JWT_SECRET=your_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

# Nodemailer SMTP Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM="Kabi Notes <noreply@kabinotes.com>"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a free MongoDB Atlas URI

### 2. Backend Setup & Run

```bash
cd backend
npm install
npm run dev
```
The Express server will start listening at `http://localhost:5000`.

### 3. Frontend Setup & Run

```bash
cd frontend
npm install
npm run dev
```
The React Vite app will open at `http://localhost:5173`.

---

## 🔑 Authentication & Authorization Flow

1. **Signup / Login**: Credentials validated -> Password hashed with bcrypt (salt round 10) -> JWT issued -> Set in HTTP-only cookie and returned in JSON response.
2. **Protected Requests**: JWT verified by `authMiddleware` on every API route -> Authenticated user object attached to `req.user`.
3. **Data Isolation Rule**: Every single Note and File database query strictly appends `{ userId: req.user.id }`.
   ```js
   Note.findOne({ _id: noteId, userId: req.user.id });
   ```
   This guarantees User A can never inspect or manipulate User B's data even if note IDs are guessed.

---

## 🔒 Automated Testing

Run the mandatory ownership data isolation suite:

```bash
cd backend
node test-ownership.js
```

### Verified Test Cases:
- ✅ Test 1: User B CANNOT read User A's note (returns 404/null)
- ✅ Test 2: User B CANNOT edit User A's note
- ✅ Test 3: User B CANNOT delete User A's note
- ✅ Test 4: User A successfully reads, updates, and deletes their own note

---

## 📄 License
MIT License. Free for educational and commercial use.
