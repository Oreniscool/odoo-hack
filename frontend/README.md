
# 📝 Blog Poster CRUD Web App (MERN Stack)

A full-stack blog platform built with the **MERN** stack featuring three distinct user flows (unauthenticated users, authenticated users, and admins). Includes full CRUD operations, slugified URLs, pagination, and strong focus on **SEO** and **security** using tools like DOMPurify and react-helmet.

---

## Features

* 🔐 **Authentication & Authorization** powered by **Clerk**

  * Unauthenticated users: Can read blogs
  * Authenticated users: Can create, edit, and delete their own posts
  * Admins: Can manage all users’ posts
*  **Rich text editor** using `react-quill`
*  **XSS protection** with `dompurify` and `jsdom`
*  **SEO optimization** with dynamic meta tags using `react-helmet`
*  **Clean URLs** with `slugify`
*  **Pagination** support for smooth blog navigation
*  **Image upload** support with `multer`
*  **Lucide icons** for UI enhancements

---

## 🛠️ Tech Stack

**Frontend**

* React 18
* React Router DOM
* React Quill
* Clerk Auth
* React Helmet
* Lucide React

**Backend**

* Express.js
* Mongoose (MongoDB)
* Multer (Image Uploads)
* CORS & dotenv

**Security & Utility**

* DOMPurify + jsdom for sanitizing HTML
* Slugify for SEO-friendly URLs

---

## 📂 Folder Structure

```
/client      → React Frontend
/server      → Node.js + Express Backend
/uploads     → Stores uploaded images
.env         → Environment config
```

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/TanayBPatel/internship.git
cd internship
```

### 2. Setup Total (Backend + Frontend)

```bash
npm install
touch .env
# Add your MongoDB URI and Clerk secret keys
npm run dev
```

## 🌍 Environment Variables

Create a `.env` file in the `/server` folder with the following:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLERK_SECRET_KEY=your_clerk_secret_key
```

---

## 🔒 Security Considerations

* All blog content is sanitized using **DOMPurify** and **jsdom** to prevent XSS.
* File uploads are validated through **Multer**.
* Auth routes are role-restricted using **Clerk’s metadata**.

---


## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Tanay Patel**

* GitHub: [@TanayBPatel](https://github.com/TanayBPatel)
* LinkedIn: [Tanay Patel](https://www.linkedin.com/in/tanay-patel-48bb76235/)

---# internship
