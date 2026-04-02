
 # Visitor Pass Management System1 (MERN)

 ---> Project Overview

  This is a Visitor Pass Management System built using the MERN stack (MongoDB, Express, React, Node.js). It enables organizations to digitally register, issue, and verify visitor passes using QR codes, with role-based authentication and secure check-in/check-out.

 ---> User Roles :- 
   Admin: Manages users, system, and reports
   Security: Scans QR codes and handles visitor check-in/check-out
   Employee: Invites and approves visitors
   Visitor: Registers and views digital pass

 ---> Features :-
    1. Authentication & Authorization (JWT, role-based)
    2. Visitor Registration with OTP Verification
    3. QR Code Generation for Visitor
    4. Check-In / Check-Out (QR scan logs)
    5. Email Notifications (OTP)
    6. Dashboard & Reports (search, filter, export) 

 ---> Technical Requirements :-

   Backend: Express + MongoDB with JWT, QR code, email.
   Frontend: React with Router, forms, QR scanner, dashboard UI.
   Database: MongoDB with collections for Users, Visitors, Appointments, Passes, CheckLogs.

 ---> Setup Instructions :-

  # Backend :- 
    
 cd backend
 npm install
 npm start

  # frontend

  cd frontend
  npm install 
  npm start

 ---> Environment Variables (.env)

  PORT=4000
  MONGO_URI=mongodb+srv://ahmadsaddam443_db_user:s7H9RymkngTBaebY@cluster0.nkwtxrx.mongodb.net/?appName=Cluster0
  JWT_SECRET=mysecretkey
  EMAIL_USER=saddamahmad5244@gmail.com
  EMAIL_PASS=kybcbpghbkhbjmiz

 ---> /ScreenShots :- 

 ### Register Page
![Register](./screenshots/Register.png)
 
 ### OTP Verify Page
![otp](./screenshots/otp.png)

 ### Login Page
![Login](./screenshots/login.png)

  ### Admin-Dashboard
![admin](./screenshots/admin.png)

  ### Employee-Dashboard
![employee](./screenshots/employee.png)

  ### Security-Dashboard
![security](./screenshots/security.png)

 ### QR Cdoe Page
![genearate pass](./screenshots/generate%20pass.png)

### QRSCanner Page
![qr-scanner](./screenshots/qr%20scanner.png)

### Invite-Visitor Page
  ![invite-visitor](./screenshots/invite%20visitor.png)

### Reports Page
  ![reports](./screenshots/reports.png)  


 ---> Demo Video Link :-

  LINK:  https://drive.google.com/file/d/17dJkHZAdlSCITHapdQ8QeSjDfvxv2RzK/view?usp=drive_link
   
 ---> Author

  # Saddam Ahmad




