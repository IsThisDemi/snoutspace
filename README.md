<div align="center">
  <br />
    <img src="https://github.com/user-attachments/assets/c5b8f933-1c63-4be2-974c-7db3ff886a44" alt="Logo" width="100"/>
  <br />

  <div>
    <img src="https://img.shields.io/badge/-React_JS-black?style=for-the-badge&logoColor=white&logo=react&color=61DAFB" alt="react.js" />
    <img src="https://img.shields.io/badge/-Appwrite-black?style=for-the-badge&logoColor=white&logo=appwrite&color=FD366E" alt="appwrite" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-React_Query-black?style=for-the-badge&logoColor=white&logo=reactquery&color=FF4154" alt="reactquery" />
    <img src="https://img.shields.io/badge/-Typescript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
  </div>
  <h1 aligh="center">SnoutSpace 🐾</h1>
  <h3 align="center">A Social Media Application</h3>
</div>

## 📋 <a name="table">Table of Contents</a>

1. 👋 [Introduction](#introduction)
2. 💻 [Tech Stack](#tech-stack)
3. ✨ [Features](#features)
4. 🚀 [Quick Start](#quick-start)

## <a name="introduction">👋 Introduction</a>

Welcome to SnoutSpace! 🎉

SnoutSpace is a social networking platform where users can create profiles, share photos, and engage with content from other users, similar to popular platforms like Instagram, DeviantArt and Furaffinity. Whether you're an artist showcasing your latest work, a photographer sharing your favorite shots, or just someone looking to connect with others, SnoutSpace provides a fun and interactive space to express yourself.

## <a name="tech-stack">💻 Tech Stack</a>

- React.js
- Appwrite
- React Query
- TypeScript
- Shadcn
- Tailwind CSS

## <a name="features">✨ Features</a>

✅ **Authentication System**: 
- ✅ A robust authentication system ensuring security and user privacy

✅ **Explore Page**: Homepage for users to explore posts 
- 🔜 featured section for top creators

✅ **Like and Save Functionality**: 
- ✅ Enable users to like and save posts
- ✅ Dedicated pages for managing liked and saved content

✅ **Detailed Post Page**: 
- ✅ A detailed post page displaying content
- ✅ Related posts for an immersive user experience

✅ **Profile Page**: A user profile page showcasing liked posts and providing options to edit the profile

✅ **Browse Other Users**: Allow users to browse and explore other users' profiles and posts

✅ **Create Post Page**: Implement a user-friendly create post page with effortless file management, storage, and drag-drop feature

✅ **Edit Post Functionality**: Provide users with the ability to edit the content of their posts at any time

✅ **Responsive UI with Bottom Bar**: A responsive UI with a bottom bar, enhancing the mobile app feel for seamless navigation

✅ **React Query Integration**: Incorporate the React Query (Tanstack Query) data fetching library for, Auto caching to enhance performance, Parallel queries for efficient data retrieval, First-class Mutations, etc

✅ **Backend as a Service (BaaS) - Appwrite**: Utilize Appwrite as a Backend as a Service solution for streamlined backend development, offering features like authentication, database, file storage, and more

## <a name="quick-start">🚀 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/IsThisDemi/snoutspace.git
cd snoutspace
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
VITE_APPWRITE_URL=
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DATABASE_ID=
VITE_APPWRITE_STORAGE_ID=
VITE_APPWRITE_USER_COLLECTION_ID=
VITE_APPWRITE_POST_COLLECTION_ID=
VITE_APPWRITE_SAVES_COLLECTION_ID=
```

Replace the placeholder values with your actual Appwrite credentials. You can obtain these credentials by signing up on the [Appwrite website](https://appwrite.io/).

**Running the Project**

```bash
npm start
```

Open [http://localhost:5173](http://localhost:5173/) in your browser to view the project.
