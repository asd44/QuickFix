'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { TutorService } from '@/lib/services/tutor.service';
import { User } from '@/lib/types/database';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [featuredTutors, setFeaturedTutors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch featured providers, handle errors gracefully if Firestore rules aren't set up yet
    TutorService.getFeaturedTutors(6)
      .then((tutors) => {
        setFeaturedTutors(tutors);
        setLoading(false);
      })
      .catch((error) => {
        console.warn('Could not fetch featured providers:', error);
        setFeaturedTutors([]); // Show empty state
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Get Home Services at Your Doorstep
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Trusted service providers for all your home repair and maintenance needs
          </p>
          {!user && (
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg">Book a Service</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline">Become a Provider</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🔍', title: 'Search & Browse', desc: 'Find service providers by category, location, and ratings' },
            { icon: '💬', title: 'Connect & Chat', desc: 'Message providers directly to discuss your requirements' },
            { icon: '✅', title: 'Get It Done', desc: 'Book the service and get your work completed professionally' },
          ].map((step, i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Service Providers */}
      <section className="py-16 px-4 container mx-auto bg-muted/30">
        <h2 className="text-3xl font-bold text-center mb-12">Top-Rated Service Providers</h2>
        {loading ? (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : featuredTutors.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No featured service providers available. Check back soon!
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {featuredTutors.map((tutor) => (
              <Link key={tutor.uid} href={`/tutor/${tutor.uid}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>
                          {tutor.tutorProfile?.firstName} {tutor.tutorProfile?.lastName}
                        </CardTitle>
                        {tutor.tutorProfile?.verified && (
                          <Badge variant="default" className="mt-1">✓ Verified</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground line-clamp-2">
                        {tutor.tutorProfile?.bio || 'Expert service provider'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tutor.tutorProfile?.subjects.slice(0, 2).map((subject, i) => (
                          <Badge key={i} variant="outline">{subject}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-semibold">
                            {tutor.tutorProfile?.averageRating.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          Visit: ₹99
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/search">
            <Button variant="outline">View All Providers</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
