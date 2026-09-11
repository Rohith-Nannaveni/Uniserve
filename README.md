# 🎓 UniServe - High-Trust Services Marketplace

**UniServe** is a comprehensive, university-anchored ecosystem bridging the gap between talent, academia, and industry. Designed for high-trust professional networking, it functions as both a secure freelancing marketplace and a powerful student recruitment engine. UniServe empowers students to showcase their verified skills, enables Placement Officers (POs) to govern campus drives, and allows HRs to discover top-tier talent with precision using AI-driven insights.

---

## 🚀 Core Features

- **🛡️ Trust Modules**: Features university-anchored verification, verified review systems, and triple-verification badges.
- **✨ Subscription Tiers**: 
  - **Premium**: Unlocks the AI Career Engine (Resume Optimization, ATS Gap Analysis) and verified badges.
  - **Business**: Grants everything in Premium plus full Placement Support, Direct HR Visibility, Spotlight in Talent Searches, and branch portability.
- **💬 Real-Time Messaging**: Integrated Socket.io for instant, private chat between buyers and sellers, including a "Clear Chat" privacy feature and WhatsApp integration.
- **💳 Flexible Payment Options**: Supports automated digital payments via **Razorpay** (UPI, Cards, Netbanking), manual **Cash** payments, and direct **Provider QR Code** payments.
- **🎟️ Advanced Coupon System**: Global and vendor-specific discount coupons validated server-side during checkout.
- **📄 Automated PDF Billing**: Auto-generates and emails PDF invoices for every completed transaction.
- **❤️ Wishlist System**: Users can bookmark and compare services for future purchase.
- **⚖️ Dispute Resolution**: Dedicated admin dashboard for resolving payment disputes with proof attachments.

---

## 🏛️ Architecture & Tech Stack

- **Frontend**: React (Vite), Bootstrap 5, Vanilla CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-Time & Features**: Socket.io (Chat), Razorpay (Payments), PDFKit (Billing), Nodemailer (Emails), JWT/Google OAuth (Auth), Gemini API (Resume Parsing)
- **Architecture Pattern**: Strict MVC (Model-View-Controller) implementation

### 👥 User Roles
1. **Admin**: Platform governance, arbitration of disputes, verifying institutional identities, and global platform analytics.
2. **Placement Officer (PO)**: Dedicated institutional dashboard to manage university placement pipelines, track analytics, approve jobs, restrict/endorse students, and collaborate directly with HRs.
3. **HR (Corporate Recruiter)**: Advanced talent discovery engine to find verified students via ATS score filters, manage complete job applicant lifecycles, and send drive proposals to universities.
4. **Vendor (Seller)**: Service management, sales tracking, professional profiles with personal payment QR codes, and custom coupon requests.
5. **Student (Buyer/Candidate)**: Service discovery, encrypted chat, Smart Job Board (Dual-Feed), AI-driven resume gap analysis, and applications.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v16+)
- **MongoDB** (Running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas)

### 1. Backend Setup
```bash
cd server
npm install
npm start
```
*The backend runs on port `5000`.*

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
*The frontend runs on port `3000` or `5173` (depending on Vite config).*

### 3. Database Seeding (Optional)
To quickly populate the database with users, services, and realistic data for testing:
```bash
cd server
node seed.js
```


## 📜 License
MIT License
