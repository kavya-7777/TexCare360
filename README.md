# TexCare360 – Smart Management for Textile Industries

TexCare360 is a full-stack industrial management platform designed to streamline maintenance, technician allocation, and inventory control in textile production environments. It provides a unified digital solution that automates essential maintenance operations, reducing downtime and improving operational visibility.

---

## Tech Stack

|      Layer      |              Technology Used                             |
|-----------------|----------------------------------------------------------|
| Frontend        | React.js, Bootstrap,TailwindCSS, Framer Motion, Recharts |
| Backend         | Node.js, Express.js                                      |
| Database        | MySQL                                                    |
| Authentication  | JWT (JSON Web Tokens)                                    |
| Version Control | Git & GitHub                                             |

---

## Project Structure

TexCare360/
│
├── frontend/ # React.js client
│ ├── src/
│ ├── package.json
│ └── ...
│
├── backend/ # Node.js + Express server
│ ├── src/
│ │ ├── index.js
│ │ ├── db.js
│ │ └── routes/
│ ├── .env.example
│ ├── package.json
│ └── ...
│
├── sql/
│ └── setup.sql # Database creation + sample data
│
└── README.md

---

## Setup and Installation

### 1. Clone the Repository
```bash
git clone https://github.com/kavya-7777/TexCare360.git
cd TexCare360

### 2. Setup the Database
mysql -u root -p < sql/setup.sql

### 3. Backend Setup
cd backend
cp .env.example .env      # Add your own credentials if needed
npm install
npm run dev               # Starts the backend server on http://localhost:5000

### 4. Frontend Setup
cd frontend
npm install
npm start                 # Runs the frontend on http://localhost:3000

---

🧠 Key Features

✅ Role-based Access Control — Secure login for Admin, Manager, Technician
✅ Machine Management — Track machine health (Healthy/Unhealthy)
✅ Technician Assignment — Automated allocation based on skill & workload (Rule Based Assignment)
✅ Maintenance Logs — Record date, parts used, and completion status
✅ Inventory Tracking — Auto stock updates, category-wise filtering
✅ Stock History & Audits — Transparent material usage tracking
✅ Analytics Dashboard — Real-time charts for maintenance & stock data

---

🗄️ Database Schema Overview

✅ machines → Machine info + required skill
✅ technicians → Technicians and availability status
✅ inventory → Spare parts, raw materials, and consumables
✅ maintenance_logs → Task details for machine repair
✅ stock_history → Tracks every inventory change
✅ users → Admins, Technicians, Managers with hashed passwords

---

🚀 Future Enhancements
✅ IoT sensor integration for real-time machine health monitoring
✅ Predictive maintenance using ML models
✅ Mobile app support for technicians
✅ Automated purchase order generation for low inventory
✅ Advanced analytics with comparative charts

---

👩‍💻 Author
-> Kavya M
-> Bachelor of Engineering, Computer Science and Design

“TexCare360 transforms manual maintenance tracking into a centralized, data-driven industrial solution.”