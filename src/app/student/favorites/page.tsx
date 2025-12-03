'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import Link from 'next/link';

export default function FavoritesPage() {
    const { user, userData } = useAuth();

    if (!user || !userData?.studentProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in as a customer to access this page</p>
            </div>
        );
    }

    const favorites = userData.studentProfile.favorites || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
                <p className="text-muted-foreground">Service providers you've saved</p>
            </div>

            {favorites.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="text-6xl mb-4">⭐</div>
                        <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
                        <p className="text-muted-foreground mb-6">
                            Start adding service providers to your favorites to easily find them later
                        </p>
                        <Link href="/search">
                            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
                                Browse Service Providers
                            </button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                            <p>Favorites feature coming soon!</p>
                            <p className="text-sm mt-2">Your saved providers will appear here</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
