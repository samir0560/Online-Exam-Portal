Online Exam Portal

An end-to-end web-based Online Examination System built using HTML, CSS, JavaScript, Node.js, Express, and MongoDB, designed for both students and administrators.

Students can take online quizzes, view their results, and track performance, while admins can manage exams and view student assessments through a secure dashboard.

📋 Features 🎓 Student Side

Login & Authentication via Google OAuth or manual login

Interactive Dashboard showing:

Profile details (name, email, branch, etc.)

Statistics and performance overview

Online Exam Section:

Subjects: MNST, ML, CNS, CD, and MC

Each quiz contains 10 fixed questions (HTML/JS-based)

Answers automatically saved to MongoDB

Results Page:

Displays attempted exams with marks, accuracy, and time

Real-time updates fetched from /api/assessments

🧑‍💼 Admin Side

Secure Admin Login (with credentials stored in .env)

Admin Dashboard:

View all registered students

Access full exam histories and scores

Manage or delete assessments if needed

⚙️ Tech Stack Layer Technologies Frontend HTML5, CSS3, JavaScript (Vanilla) Backend Node.js, Express.js Database MongoDB
