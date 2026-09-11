import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import Service from './pages/Service';
import Add from './pages/Add';
import Orders from './pages/Orders';
import MyServices from './pages/MyServices';
import Conversations from './pages/Conversations';
import Message from './pages/Message';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import BusinessPortal from './pages/BusinessPortal';
import CandidateProfile from './pages/CandidateProfile';
import CareerAI from './pages/CareerAI';
import Placements from './pages/Placements';
import HRSearch from './pages/HRSearch';
import POOutreach from './pages/POOutreach';
import HRPOOutreach from './pages/HRPOOutreach';
import HRProposals from './pages/HRProposals';
import ContactPO from './pages/ContactPO';
import POUnregistered from './pages/POUnregistered';
import Pay from './pages/Pay';
import Subscription from './pages/Subscription';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Support from './pages/Support';
import VerifyOTP from './pages/VerifyOTP';
import Wishlist from './pages/Wishlist';
import BanAppeal from './pages/BanAppeal';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import JobBoard from './pages/JobBoard';
import JobDetail from './pages/JobDetail';
import ManageJobs from './pages/ManageJobs';
import JobApplicants from './pages/JobApplicants';
import MyApplications from './pages/MyApplications';
import POStudents from './pages/POStudents';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/appeal" element={<BanAppeal />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/services" element={<Services />} />
            <Route path="/service/:id" element={<Service />} />
            <Route path="/pay/:id" element={<Pay />} />
            <Route path="/add" element={<Add />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/my-services" element={<MyServices />} />
            <Route path="/messages" element={<Conversations />} />
            <Route path="/message/:id" element={<Message />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/business-talent" element={<BusinessPortal />} />
            <Route path="/career-ai" element={<CareerAI />} />
            <Route path="/placements" element={<Placements />} />
            <Route path="/hr-search" element={<HRSearch />} />
            <Route path="/hr-proposals" element={<HRProposals />} />
            <Route path="/po-outreach" element={<POOutreach />} />
            <Route path="/hr-outreach" element={<HRPOOutreach />} />
            <Route path="/po/contact" element={<ContactPO />} />
            <Route path="/po-not-registered" element={<POUnregistered />} />
            <Route path="/candidate/:id" element={<CandidateProfile />} />
            <Route path="/subscription" element={<Subscription />} />
            
            {/* Job Portal Routes */}
            <Route path="/job-board" element={<JobBoard />} />
            <Route path="/job/:id" element={<JobDetail />} />
            <Route path="/manage-jobs" element={<ManageJobs />} />
            <Route path="/manage-applicants/:jobId" element={<JobApplicants />} />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route path="/po-students" element={<POStudents />} />

            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/support" element={<Support />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
