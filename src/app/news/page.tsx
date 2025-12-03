'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { AdminService } from '@/lib/services/admin.service';
import { News } from '@/lib/types/database';

export default function NewsPage() {
    const [news, setNews] = useState<(News & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = AdminService.listenToNews((updatedNews) => {
            setNews(updatedNews);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">News & Updates</h1>

            <div className="space-y-6">
                {news.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No news articles available
                    </div>
                ) : (
                    news.map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            {item.breaking && (
                                                <Badge variant="destructive" className="animate-pulse">
                                                    Breaking
                                                </Badge>
                                            )}
                                            <CardTitle className="text-lg">{item.title}</CardTitle>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {item.publishedAt?.toDate().toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{item.content}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
