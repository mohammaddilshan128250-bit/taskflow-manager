# 🚀 TaskFlow - Modern Task & Project Management App

A full-stack **Task and Project Management Application** built with the **MERN Stack** (MongoDB, Express.js, React, Node.js). 

Manage projects, create tasks, track progress with a beautiful Kanban board, and collaborate in real-time.

![TaskFlow Banner](https://via.placeholder.com/800x300/3b82f6/ffffff?text=TaskFlow+Banner)  
*(Replace with your actual screenshot later)*

## ✨ Features

### User Features
- User Registration & Login (JWT Authentication)
- Create, Edit, and Delete Projects
- Kanban-style Task Board (To Do, In Progress, Done)
- Drag & Drop tasks between columns
- Real-time updates using Socket.IO
- Responsive design (works on mobile & desktop)

### Tech Highlights
- Secure authentication with JWT
- MongoDB with Mongoose ODM
- Modern React frontend with Vite
- Tailwind CSS for styling
- Real-time collaboration ready

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- React Router
- Axios for API calls
- Socket.IO Client

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO for real-time
- dotenv for environment variables

## 📁 Project Structure

taskflow-manager/
├── backend/                  # Node.js + Express Backend
│   ├── models/               # Mongoose Models (User, Project, Task)
│   ├── routes/               # API Routes (auth, projects, tasks)
│   ├── middleware/           # Auth middleware
│   ├── .env                  # Environment variables
│   └── index.js              # Main server file
│
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Login, Dashboard, Kanban etc.
│   │   └── App.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── README.md
└── .gitignore
