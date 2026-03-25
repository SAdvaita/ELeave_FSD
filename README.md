## Project Details
📌 Project Overview
E-Leave  is a full-stack, professional-grade Leave and Attendance Management System. It is designed to replace manual HR processes by offering automated leave balance tracking, holiday integration, real-time clock-in capabilities, and analytics for managers. The enhanced version focuses heavily on edge-case validation (e.g., leave without pay salary deductions, half-days, overlap detection, comp-offs) and provides an intuitive, analytics-driven dashboard.
🛠️ Tech Stack
•	Runtime Environment: Node.js (v22)
•	Backend Framework: Express.js
•	Database: MongoDB (via Mongoose ODM)
•	Authentication: JWT (JSON Web Tokens) with HTTP-only cookies and bcrypt for password hashing
•	Frontend Framework: React 18 + Vite
•	Styling: Vanilla CSS (CSS variables, Inter font, custom flex/grid layouts)
•	Client HTTP: Axios
•	State Management: React Context API

🔐 User Roles and Permissions
1.	Employee:
•	Apply for leave, cancel own leaves.
•	Clock in / Clock out for daily attendance.
•	View personal leave balances, history, and the holiday and leave calendars.
•	Read in-app notifications.
•	Update profile picture.
2.	Manager:
•	Inherits all Employee capabilities.
•	View all employees' leave requests and attendance records.
•	Approve or reject leaves (with rejection reasons).
•	View organization-wide reports and analytics.
•	Add, delete, and manage company holidays.
•	Adjust leave balances for employees manually.


🌐 API Endpoints

Auth Route (/api/auth)
•	POST /register: Register new user
•	POST /login: Authenticate and receive JWT cookie
•	GET /logout: Clear JWT cookie
•	GET /profile: Get logged-in user profile

Leaves Route (/api/leaves)
•	POST /apply: Apply for leave
•	GET /my-leaves: Get employee's own requests
•	GET /my-summary: Get employee's leave balance summaries
•	PUT /:id/cancel: Cancel a strictly personal leave request
•	GET /all: Admin fetch all leave requests
•	PUT /:id/approve: Admin approve leave
•	PUT /:id/reject: Admin reject leave (requires reason body)

Holidays Route (/api/holidays)
•	GET /: Fetch all holidays
•	POST /: Add a custom holiday
•	POST /seed: Seed standard array of default holidays
•	DELETE /:id: Remove a holiday

Attendance Route (/api/attendance)
•	POST /clock-in: Create new attendance record for the day
•	POST /clock-out: Update attendance record with end time/hours
•	GET /status: Check today's clock-in status
•	GET /my-history: Get logged-in user's past attendance
•	GET /all: Admin fetch all employee attendances for today

Notifications Route (/api/notifications)
•	GET /: Fetch user's notifications
•	PUT /mark-all-read: Mark all as read
•	PUT /:id/read: Mark specific ID as read
•	DELETE /:id: Clear a notification

Balance & Reports (/api/balance, /api/reports)
•	GET /balance/my-balance: Get detailed per-type balance
•	POST /balance/adjust: Admin adjust employee balance
•	GET /reports/overview: Get aggregated chart data (distribution, trends)


🗄️ Database Schema (Key Collections)
1.	Users Collection: Extends standard Auth fields (name, email, password, role) with employee-centric fields like designation, department, employeeId, profilePicture, gender, monthlySalary, and an object holding all 9 leaveBalances.
2.	Leaves Collection: Tracks employeeId (foreign key), leaveType, startDate, endDate, isHalfDay, auto-calculated numberOfDays, reason, status (pending/approved/rejected/cancelled), rejectionReason, and action timestamps.
3.	Attendances Collection: Tracks employeeId, date, clockIn timestamp, clockOut timestamp, status (present/half-day), location, and calculated totalHours.
4.	Holidays Collection: Tracks name, date, type (public/company), and description.
5.	Notifications Collection: Polled mapping of userId, title, message, type (e.g., leave_approved), link, and isRead boolean flag.
🔗 Live Deployment Links
Currently, the project is configured for your local development environment with the following local endpoints:
•	Frontend App: https://e-leave-fsd.vercel.app/
•	Backend API: https://eleave-fsd.onrender.com


