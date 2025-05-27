# Full Stack Blog & Portfolio Website

This is a full-stack web application created by Ben Hatfield for managing and showcasing blog posts and personal projects. It includes user authentication, blog and project CRUD operations, image uploads, and a responsive UI for both administrators and viewers. The website is currently running on https://benhatfield.com which is using a raspberry Pi based server.

## Tech Stack

**Frontend:**
- React (with TypeScript)
- Next.js
- Axios
- Chakra UI 
- Tailwind css
- LocalStorage-based session management

**Backend:**
- Node.js
- Express.js
- MariaDB (Native support for ARM CPU's)
- Multer (for handling image uploads)

---

## Features

- **Blog Management** – Create, edit, delete, and view blog posts with image support
- **Project Showcase** – Upload and display personal projects with links and descriptions
- **User Management** – Register, update, and delete user profiles
- **Authentication** – Frontend-protected routes for post/project creation and editing
- **Image Upload** – Upload and display images using `multipart/form-data`
- **REST API** – Modular backend API for blog posts, projects, and users
- **Password Security** – Using bcrypt to hash and salt passwords

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- Yarn or npm

### Setup Instructions

#### 1. Clone the repository

```bash
git clone https://github.com/bensbread120/bens_website
```
#### 2. Setup .env files using your own credentials
##### Backend
```JavaScript
DB_TYPE=db_tpye
DB_HOST=host_ip
DB_PORT=host_port
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
SESSION_PASSWORD=session_password
```
##### FrontEnd
```JavaScript
NEXT_PUBLIC_API_URL=http://urlForYourApi.com
```

#### 3. Start both servers
```bash
cd bens_website/backend

npm install

npm start
# Running on http://localhost:3001
cd ../frontend

npm install

npm run dev
# Running on http://localhost:3000
```

## 📄 License

This project is licensed under the [MIT License](LICENSE.txt).
