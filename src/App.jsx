import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import TattooStyles from '@/components/TattooStyles';
import Services from '@/components/Services';
import Booking from '@/components/Booking';
import Contact from '@/components/Contact';
import Shop from '@/components/Shop';
import Photos from '@/pages/Photos';
import ProductDetailPage from '@/pages/ProductDetailPage';
import SuccessPage from '@/components/SuccessPage';
import DeliveryCalculator from '@/components/DeliveryCalculator';
import Footer from '@/components/Footer';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/hooks/useCart';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

// Components
import FloatingChat from '@/components/FloatingChat';
import FloatingAnnounce from '@/components/FloatingAnnounce';

// Page Imports
import Policies from '@/pages/Policies';

// Admin Imports
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminGallery from '@/pages/admin/AdminGallery';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminEducation from '@/pages/admin/AdminEducation';
import AdminPodcast from '@/pages/admin/AdminPodcast';
import AdminPQR from '@/pages/admin/AdminPQR';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminBilling from '@/pages/admin/AdminBilling';

// User Imports
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import UserLayout from '@/pages/user/UserLayout';
import UserDashboard from '@/pages/user/UserDashboard';
import UserProfile from '@/pages/user/UserProfile';
import UserBookings from '@/pages/user/UserBookings';
import UserOrders from '@/pages/user/UserOrders';
import UserWishlist from '@/pages/user/UserWishlist';
import UserPQR from '@/pages/user/UserPQR';
import UserChat from '@/pages/user/UserChat';
import PublicPQR from '@/pages/PublicPQR';
import DidYouKnow from '@/pages/DidYouKnow';
import Podcast from '@/pages/Podcast';
import AdminLiveActivity from '@/pages/admin/AdminLiveActivity';
import BoldCheckout from '@/pages/BoldCheckout';
import BoldSuccess from '@/pages/BoldSuccess';
import StoreProductDetail from '@/pages/StoreProductDetail';
import { trackPageView } from '@/lib/analytics';


function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isUserRoute = location.pathname.startsWith('/user');

  // Scroll to top whenever the route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    trackPageView(location.pathname, {
      search: location.search || '',
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery') && location.pathname !== '/reset-password') {
      window.location.replace(`/reset-password${window.location.hash}`);
    }
  }, [location.pathname]);

  return (
   <AuthProvider>
    <CartProvider>
      <Helmet>
        <title>Casa Smoke y Arte SSOT S.A.S - Cultura, Tattoo y Experiencia</title>
        <meta name="description" content="Casa Smoke y Arte SSOT S.A.S es tu estudio de tatuajes y arte en Colombia. Ofrecemos diseños únicos, artistas profesionales y una experiencia cultural incomparable." />
      </Helmet>
      
      {/* Age Verification Modal only for public site */}
      {!isAdminRoute && <AgeVerificationModal />}
      
      <div className={`min-h-screen bg-[#050510] text-[#f5f5f5] flex flex-col`}>
        {!isAdminRoute && <Header />}
        
        <main className={isAdminRoute ? 'flex-grow' : 'flex-grow'}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Hero />} />
            <Route path="/about" element={<div className="pt-16"><About /></div>} />
            <Route path="/store" element={<Shop />} />
            <Route path="/store/:productId" element={<StoreProductDetail />} />
            <Route path="/photos" element={<Photos />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/checkout" element={<BoldCheckout />} />
            <Route path="/pago/resultado" element={<BoldSuccess />} />
            <Route path="/styles" element={<div className="pt-16"><TattooStyles /></div>} />
            <Route path="/services" element={<div className="pt-16"><Services /></div>} />
            <Route path="/delivery-calculator" element={<div className="pt-16"><DeliveryCalculator /></div>} />
            <Route path="/booking" element={<div className="pt-16"><Booking /></div>} />
            <Route path="/contact" element={<div className="pt-16"><Contact /></div>} />
            <Route path="/pqr" element={<div className="pt-16"><PublicPQR /></div>} />
            <Route path="/did-you-know" element={<div className="pt-16"><DidYouKnow /></div>} />
            <Route path="/podcast" element={<div className="pt-16"><Podcast /></div>} />
            <Route path="/policies" element={<div className="pt-16"><Policies /></div>} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* User Panel Routes */}
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<UserDashboard />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="bookings" element={<UserBookings />} />
              <Route path="orders" element={<UserOrders />} />
              <Route path="wishlist" element={<UserWishlist />} />
              <Route path="pqr" element={<UserPQR />} />
              <Route path="chat" element={<UserChat />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="billing" element={<AdminBilling />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="education" element={<AdminEducation />} />
              <Route path="podcast" element={<AdminPodcast />} />
              <Route path="pqr" element={<AdminPQR />} />
              <Route path="activity" element={<AdminLiveActivity />} />
            </Route>
          </Routes>
        </main>
        
        {!isAdminRoute && !isUserRoute && <FloatingChat />}
        {!isAdminRoute && !isUserRoute && <FloatingAnnounce />}
        {!isAdminRoute && <Footer />}
        <Toaster />
      </div>
    </CartProvider>
   </AuthProvider>
  );
}

export default App;
