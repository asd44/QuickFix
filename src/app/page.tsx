'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { TutorService } from '@/lib/services/tutor.service';
import { User, Booking } from '@/lib/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { BookingService } from '@/lib/services/booking.service';
import { format } from 'date-fns';

export default function HomePage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allTutors, setAllTutors] = useState<User[]>([]);
  const [topRatedTutors, setTopRatedTutors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderText, setPlaceholderText] = useState('Search for services');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  const [tutorStats, setTutorStats] = useState({ newRequests: 0, totalEarnings: 0, pendingJobs: 0, completedJobs: 0 });
  const [pendingBookings, setPendingBookings] = useState<(Booking & { id: string })[]>([]);

  const curatedExperiences = [
    { title: 'Kitchen Deep Cleaning', video: 'https://assets.mixkit.co/videos/24777/24777-720.mp4' },
    { title: 'Living Space Refresh', video: 'https://assets.mixkit.co/videos/21380/21380-720.mp4' },
    { title: 'Home Painting', video: 'https://assets.mixkit.co/videos/28937/28937-720.mp4' },
    { title: 'Expert Plumbing', video: 'https://assets.mixkit.co/videos/49024/49024-720.mp4' },
    { title: 'Electrical Safety', video: 'https://assets.mixkit.co/videos/23397/23397-720.mp4' },
    { title: 'Garden Maintenance', video: 'https://assets.mixkit.co/videos/840/840-720.mp4' },
  ];

  useEffect(() => {
    const phrases = ['services', 'AC Services', 'Kitchen Appliances', 'Painting', 'Plumbing', 'IT Services'];
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const currentPhrase = phrases[currentPhraseIndex];

      if (isDeleting) {
        setPlaceholderText(`Search for ${currentPhrase.substring(0, currentCharIndex)}`);
        currentCharIndex--;
      } else {
        setPlaceholderText(`Search for ${currentPhrase.substring(0, currentCharIndex + 1)}`);
        currentCharIndex++;
      }

      let typingSpeed = 100;

      if (!isDeleting && currentCharIndex === currentPhrase.length) {
        isDeleting = true;
        typingSpeed = 2000;
      } else if (isDeleting && currentCharIndex === -1) {
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        currentCharIndex = 0;
        typingSpeed = 500;
      } else if (isDeleting) {
        typingSpeed = 50;
      }

      timeoutId = setTimeout(type, typingSpeed);
    };

    timeoutId = setTimeout(type, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Request location permission on app load
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Permission granted
        },
        (error) => {
          console.debug('Location permission request result:', error.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (servicesRef.current) {
        const { bottom } = servicesRef.current.getBoundingClientRect();
        // When the bottom of the service section hits the top area (approx 250px), switch styles
        setIsScrolled(bottom < 250);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/welcome');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);

      const fetchData = async () => {
        try {
          // If user is a tutor, fetch their stats
          if (userData?.role === 'tutor') {
            try {
              const bookings = await BookingService.getTutorBookings(user.uid);
              const newRequests = bookings.filter(b => b.status === 'pending').length;
              const pendingJobs = bookings.filter(b => b.status === 'in_progress').length;
              const completedJobs = bookings.filter(b => b.status === 'completed').length;

              // Calculate earnings manually since we don't have a direct field yet
              // Assuming 'completed' bookings contribute to earnings
              const totalEarnings = bookings
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.finalBillAmount || b.totalPrice || 0), 0);

              setTutorStats({ newRequests, totalEarnings, pendingJobs, completedJobs });
              setPendingBookings(bookings.filter(b => b.status === 'pending'));
            } catch (err) {
              console.error("Error fetching tutor stats:", err);
            }
          }

          let tutors: User[] = [];
          let topRated: User[] = [];

          if (selectedCategory === 'All') {
            // Fetch all providers (limit 10 for now)
            tutors = await TutorService.getFeaturedTutors(10);
            // Fetch top rated providers
            topRated = await TutorService.getTopRatedTutors(6);
          } else {
            // If category selected, just search
            const result = await TutorService.searchTutors({ subject: selectedCategory }, 20);
            tutors = result.tutors;
            topRated = []; // Don't show top rated section when filtering
          }

          setAllTutors(tutors);
          setTopRatedTutors(topRated);
        } catch (error: any) {
          console.error('Could not fetch providers:', error);
          if (error.code === 'failed-precondition') {
            console.error('Missing Firestore Index. Please check the console for the index creation link.');
          }
          setAllTutors([]);
          setTopRatedTutors([]);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [user, selectedCategory, userData?.role]);

  if (authLoading || !user) {
    return null;
  }

  // Client-side filtering for search query
  const filteredTutors = allTutors.filter(tutor => {
    if (!searchQuery) return true;
    const name = `${tutor.tutorProfile?.firstName} ${tutor.tutorProfile?.lastName}`.toLowerCase();
    const bio = (tutor.tutorProfile?.bio || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || bio.includes(query);
  });

  const ProviderCard = ({ tutor }: { tutor: User }) => {
    const isTutor = userData?.role === 'tutor';
    const CardWrapper = isTutor ? 'div' : Link;
    const wrapperProps = isTutor ? { className: 'block h-full' } : { href: `/tutor/view?id=${tutor.uid}`, className: 'block h-full' };

    return (
      // @ts-ignore
      <CardWrapper {...wrapperProps}>
        <Card className={`hover:shadow-lg transition-all ${isTutor ? 'cursor-default' : 'cursor-pointer'} h-full !border-none shadow-sm !bg-gradient-to-br ${isTutor ? '!from-[#771532] !to-[#450a1b]' : '!from-[#005461] !to-[#002025]'}`}>
          <CardContent className="pl-3 flex items-center gap-3 text-left">
            <div className="mt-6 w-16 h-16 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/20">
              {tutor.tutorProfile?.profilePicture ? (
                <img
                  src={tutor.tutorProfile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl text-white/80 font-semibold">
                  {tutor.tutorProfile?.firstName?.[0]}
                </span>
              )}
            </div>

            <div className="mt-6 flex-1 min-w-0 space-y-1">
              <h3 className="font-bold text-lg truncate text-white leading-tight">
                {tutor.tutorProfile?.firstName} {tutor.tutorProfile?.lastName}
              </h3>

              <div className="flex items-center gap-1.5 text-base text-gray-200 leading-tight">
                <span className="truncate max-w-[100px]">{tutor.tutorProfile?.city}</span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center text-yellow-400 font-medium">
                  ★ {tutor.tutorProfile?.averageRating ? tutor.tutorProfile.averageRating.toFixed(1) : 'New'}
                </span>
              </div>

              <p className="text-sm font-semibold text-white/90">
                Visit: ₹99
              </p>
            </div>
          </CardContent>
        </Card>
      </CardWrapper>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-0">
      {/* Dashboard Header */}
      <div className={`${userData?.role === 'tutor' ? 'bg-[#5A0E24]' : 'bg-[#005461]'} relative z-20 transition-colors duration-300`}>
        <div className="container mx-auto px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-white">
                Welcome, {userData?.studentProfile?.firstName || userData?.tutorProfile?.firstName || 'User'}
              </h1>

              {userData?.role !== 'tutor' && (
                <Link href="/student/location">
                  <div className="flex items-start gap-2 cursor-pointer group py-1 mt-1">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white flex items-center gap-1 text-sm group-hover:text-gray-200 transition-colors">
                        {userData?.studentProfile?.city || userData?.tutorProfile?.city || 'Select Location'}
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </h3>
                      <p className="text-xs text-gray-300 truncate">
                        {userData?.studentProfile?.address || userData?.tutorProfile?.address || userData?.tutorProfile?.area || 'No address set'}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Tutor Stats Tiles */}
            {userData?.role === 'tutor' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* New Requests Tile */}
                <Link href="/tutor/bookings?filter=pending">
                  <div className="relative overflow-hidden rounded-2xl p-4 group cursor-pointer h-full border border-white/40 shadow-lg bg-gradient-to-br from-white via-white to-gray-50 hover:shadow-xl transition-all duration-300">
                    {/* Shiny overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div className="relative z-10 flex flex-col items-center justify-center text-center h-full gap-2">
                      <div className="p-2 bg-primary/10 rounded-full mb-1 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span className="text-gray-600 text-sm font-medium leading-tight">New Requests</span>
                      <span className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{tutorStats.newRequests}</span>
                    </div>
                  </div>
                </Link>

                {/* Total Earnings Tile */}
                <div className="relative overflow-hidden rounded-2xl p-4 group cursor-pointer border border-white/40 shadow-lg bg-gradient-to-br from-white via-white to-gray-50 hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                  <div className="relative z-10 flex flex-col items-center justify-center text-center h-full gap-2">
                    <div className="p-2 bg-primary/10 rounded-full mb-1 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm font-medium leading-tight">Total Earnings</span>
                    <span className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">₹{tutorStats.totalEarnings}</span>
                  </div>
                </div>

                {/* Pending Jobs Tile */}
                <Link href="/tutor/bookings?filter=in_progress">
                  <div className="relative overflow-hidden rounded-2xl p-4 group cursor-pointer h-full border border-white/40 shadow-lg bg-gradient-to-br from-white via-white to-gray-50 hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div className="relative z-10 flex flex-col items-center justify-center text-center h-full gap-2">
                      <div className="p-2 bg-primary/10 rounded-full mb-1 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-gray-600 text-sm font-medium leading-tight">Pending Jobs</span>
                      <span className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{tutorStats.pendingJobs}</span>
                    </div>
                  </div>
                </Link>

                {/* Completed Jobs Tile */}
                <div className="relative overflow-hidden rounded-2xl p-4 group cursor-pointer border border-white/40 shadow-lg bg-gradient-to-br from-white via-white to-gray-50 hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                  <div className="relative z-10 flex flex-col items-center justify-center text-center h-full gap-2">
                    <div className="p-2 bg-primary/10 rounded-full mb-1 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm font-medium leading-tight">Completed Jobs</span>
                    <span className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{tutorStats.completedJobs}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Sticky Search & Categories (Sticks to top) */}
      {/* Sticky Search & Categories (Sticks to top) - Hidden for Tutors */}
      {userData?.role !== 'tutor' && (
        <div className={`sticky top-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 pb-2' : 'bg-[#005461] -mt-[1px] pb-2'}`}>
          <div className="container mx-auto px-4 pt-2">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder={placeholderText}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${isScrolled ? 'bg-gray-100 text-gray-900 placeholder:text-gray-500' : 'bg-white text-gray-900'}`}
              />
              <svg
                className={`absolute left-3 top-3.5 h-5 w-5 transition-colors ${isScrolled ? 'text-gray-500' : 'text-gray-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Service Categories Grid - Colored Background Wrapper */}
      {
        userData?.role !== 'tutor' && !searchQuery && selectedCategory === 'All' && (
          <div ref={servicesRef} className={`transition-colors duration-500 -mt-[1px] pb-10 rounded-b-[2.5rem] shadow-sm mb-6 relative z-10 ${isScrolled ? 'bg-white' : 'bg-[#005461]'}`}>
            <div className="container mx-auto px-4 pt-4">
              <h2 className={`font-bold text-lg mb-4 transition-colors duration-500 ${isScrolled ? 'text-gray-900' : 'text-white'}`}>Explore all services</h2>

              <div className="flex flex-col">
                {/* First 9 items - Always visible */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: 'Plumbing', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', color: 'bg-blue-100 text-blue-600' },
                    { name: 'Electrical', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'bg-yellow-100 text-yellow-600' },
                    { name: 'Carpentry', icon: 'M4 6h16M4 12h16M4 18h16', color: 'bg-orange-100 text-orange-600' },
                    { name: 'Painting', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', color: 'bg-purple-100 text-purple-600' },
                    { name: 'IT Services', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'bg-cyan-100 text-cyan-600' },
                    { name: 'AC Services', icon: 'M14 10a2 2 0 11-4 0 2 2 0 014 0zM12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 100-16 8 8 0 000 16z', color: 'bg-sky-100 text-sky-600' },
                    { name: 'Event Planner', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'bg-rose-100 text-rose-600' },
                    { name: 'Interior Designing', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'bg-pink-100 text-pink-600' },
                    { name: 'Kitchen Appliances', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H4m16 0h-1M5 14H4m16 0h-1M6 5h12a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z', color: 'bg-indigo-100 text-indigo-600' },
                  ].map((service) => {
                    const slug = service.name === 'Kitchen Appliances' ? 'appliances' :
                      service.name === 'AC Services' ? 'ac' :
                        service.name === 'IT Services' ? 'it' :
                          service.name === 'Interior Designing' ? 'interior' :
                            service.name === 'Event Planner' ? 'event' :
                              service.name.toLowerCase();
                    return (
                      <Link
                        key={service.name}
                        href={`/search?category=${slug}`}
                        className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow aspect-square"
                      >
                        <div className={`p-3 rounded-full mb-2 ${service.color}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.icon} />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{service.name}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Remaining items - Smooth expansion */}
                <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${showAllCategories ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${showAllCategories ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                    <div className="grid grid-cols-3 gap-3 pt-3">
                      {[
                        { name: 'Repairing', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'bg-stone-100 text-stone-600' },
                      ].map((service) => {
                        const slug = service.name === 'Kitchen Appliances' ? 'appliances' :
                          service.name === 'AC Services' ? 'ac' :
                            service.name === 'IT Services' ? 'it' :
                              service.name === 'Interior Designing' ? 'interior' :
                                service.name === 'Event Planner' ? 'event' :
                                  service.name.toLowerCase();
                        return (
                          <Link
                            key={service.name}
                            href={`/search?category=${slug}`}
                            className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow aspect-square"
                          >
                            <div className={`p-3 rounded-full mb-2 ${service.color}`}>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={service.icon} />
                              </svg>
                            </div>
                            <span className="text-xs font-medium text-gray-700 text-center leading-tight">{service.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className={`inline-flex items-center text-sm font-semibold transition-colors duration-300 ${isScrolled ? 'text-[#005461] hover:text-[#00434d]' : 'text-white/90 hover:text-white'}`}
                >
                  {showAllCategories ? 'Show Less' : 'View All Categories'}
                  <svg className={`w-4 h-4 ml-1 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${showAllCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      }

      <div className="pb-20">

        {loading ? (
          <div className="container mx-auto px-4 text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            {/* New Requests Section - Only for Tutors */}
            {userData?.role === 'tutor' && pendingBookings.length > 0 && (
              <section className="w-full bg-white py-8 border-b border-gray-100 mb-2 shadow-[0_0_20px_rgba(0,0,0,0.1)]">
                <div className="container mx-auto px-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight flex items-center gap-2">
                      New Requests <span className="text-[#5A0E24] text-sm bg-[#5A0E24]/10 px-2 py-1 rounded-full">{pendingBookings.length}</span>
                    </h2>
                    <Link href="/tutor/bookings?filter=pending">
                      <Button variant="ghost" size="sm" className="text-[#5A0E24]">View All</Button>
                    </Link>
                  </div>

                  <div className="grid grid-rows-1 grid-flow-col gap-4 overflow-x-auto no-scrollbar pb-4 auto-cols-[85%] md:auto-cols-[350px]">
                    {pendingBookings.map((booking) => (
                      <Link key={booking.id} href={`/tutor/booking-details?id=${booking.id}`} className="block h-full">
                        <Card className="hover:shadow-lg transition-all cursor-pointer h-full !border-none shadow-sm !bg-gradient-to-br !from-[#771532] !to-[#450a1b]">
                          <CardContent className="px-3 py-4 !pb-4 flex items-center gap-3 text-left">
                            <div className="w-16 h-16 mt-6 mb-2 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold border border-white/20">
                              {booking.studentName?.[0] || 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white truncate text-lg leading-tight mt-4">{booking.studentName || 'Customer'}</h3>
                              <p className="text-gray-200 text-sm truncate">{booking.subject || 'Service Request'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
                                  {booking.date ? format(booking.date.toDate(), 'MMM dd') : 'TBD'}
                                </span>
                                <span className="text-xs text-yellow-400 font-medium">
                                  New
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end mt-4">
                              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Top Rated Providers Section - Only show on 'All' view and if there are results */}
            {selectedCategory === 'All' && topRatedTutors.length > 0 && !searchQuery && (
              <section className="w-full bg-white py-8 border-b border-gray-100 mb-2 shadow-[0_0_20px_rgba(0,0,0,0.1)]">
                <div className="container mx-auto px-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight flex items-center gap-2">
                      Top Rated Providers <span className="text-yellow-500">★</span>
                    </h2>
                  </div>

                  <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto no-scrollbar pb-4 auto-cols-[85%] md:auto-cols-[350px]">
                    {topRatedTutors.map((tutor) => (
                      <div key={`top-${tutor.uid}`} className="h-full">
                        <ProviderCard tutor={tutor} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* All Providers Section */}
            <section id="all-providers" className="w-full bg-white py-8 border-b border-gray-100 mb-2 shadow-[0_0_20px_rgba(0,0,0,0.1)]">
              <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {selectedCategory === 'All' ? 'All Providers' : `${selectedCategory} Providers`}
                  </h2>
                  {selectedCategory === 'All' && (
                    <Link href="/search">
                      <Button variant="ghost" size="sm" className="text-primary">View All</Button>
                    </Link>
                  )}
                </div>

                {filteredTutors.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No service providers found.</p>
                  </div>
                ) : (
                  <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto no-scrollbar pb-4 auto-cols-[85%] md:auto-cols-[350px]">
                    {filteredTutors.map((tutor) => (
                      <div key={tutor.uid} className="h-full">
                        <ProviderCard tutor={tutor} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Unified Bottom Section */}
            <div className="w-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.1)]">
              {/* Thoughtful Curations Section */}
              <section className="w-full pt-12 pb-0 scroll-mt-20">
                <div className="container mx-auto px-4">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">Thoughtful curations</h2>
                    <p className="text-lg text-gray-500 font-normal">of our finest experiences</p>
                  </div>

                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
                    {curatedExperiences.map((item, index) => (
                      <div key={index} className="flex-shrink-0 w-[200px] md:w-[260px] aspect-[9/16] relative rounded-2xl overflow-hidden shadow-md group cursor-pointer hover:shadow-xl transition-shadow snap-center">
                        <video
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        >
                          <source src={item.video} type="video/mp4" />
                        </video>

                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                          <p className="text-white font-medium text-lg leading-tight drop-shadow-sm">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Advertisement Section */}
              <section className="w-full pt-0 pb-8 mt-12">
                <div className="container mx-auto px-4">
                  <div className="relative w-full rounded-2xl overflow-hidden shadow-md">
                    <img
                      src="/EASYGOTRIP_AD.png"
                      alt="EasyGoTrip Advertisement"
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute bottom-4 left-4">
                      <Button className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition-transform hover:scale-105">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Refer and Earn Section */}
            <section className="w-full bg-white pb-4 pt-4 mt-2">
              <div className="container mx-auto px-4">
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src="/refer_banner.jpg"
                    alt="Refer and Earn"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div >
  );
}
