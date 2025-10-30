# 🧭 Run Instructions

## ⚙️ Project Overview
This project consists of two main parts:
- **Backend** – built with Node.js, Express, and MongoDB.
- **Frontend** – built with NextJS.

---
## 📋 Prerequisites
Before running this project, ensure you have **Node.js** (v16 or higher) installed on your system

---
## 📥 Clone the Repository
### **1. Clone the project from GitHub**
```bash
https://github.com/tomisiiiin/StudentTradeHub.git
```
### **2. Navigate to the project directory**
```bash
cd "Web Application"
```

---
## 🗂 Folder Structure
```
Web Application/
│
├── backend/
│
└── frontend/
```

---
## 🚀 Backend Setup

### **1. Navigate to the backend folder**
```bash
cd backend
```

### **2. Install dependencies**
```bash
npm install
```

### **3. Setup environment variables**
Create a `.env` file in the backend directory with the following variables:

```env
PORT=8800

# Database Configuration
DB_USERNAME=client-user
DB_PASSWORD=KRKgsXjTXMrcrJWd

# JWT Secret Key
JWT_SECRET=secteretkey12345

```

### **4. Run the backend (development mode)**
```bash
npm start
```
This uses `nodemon` for automatic server reloads on file changes.

### **5. Backend base URL**
```
http://localhost:8800/
```

---
## 💻 Frontend Setup

### **1. Navigate to the frontend folder**
```bash
cd frontend
```

### **2. Install dependencies**
```bash
npm install
```

### **3. Setup environment variables**
Create a `.env` file in the frontend directory and specify your backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8800
```

### **4. Run the frontend (development mode)**
```bash
npm run dev
```

### **5. Frontend base URL**
```
http://localhost:3000/
```

