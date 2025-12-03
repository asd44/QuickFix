'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { Badge } from '@/components/Badge';

export default function TutorProfileSettings() {
    const { user, userData } = useAuth();

    if (!user || userData?.role !== 'tutor') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in as a service provider to access this page</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Visiting Charges</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Fixed Visiting Charge Display */}
                        <div className="text-center py-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20">
                            <div className="mb-2">
                                <Badge className="mb-4">Standard Rate</Badge>
                            </div>
                            <div className="text-6xl font-bold text-primary mb-2">
                                ₹99
                            </div>
                            <p className="text-lg font-semibold text-muted-foreground">
                                Visiting Charges
                            </p>
                        </div>

                        {/* Important Notice */}
                        <div className="p-6 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">ℹ️</div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                        Important Information
                                    </h3>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                        This is the <strong>visiting charge only</strong>. Customers will pay ₹99 for the initial inspection visit. After inspecting the work on-site, you can provide the actual service charges based on the required work. Final charges will be quoted and agreed upon directly with the customer.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What's Included */}
                        <div className="border border-border rounded-lg p-4">
                            <h4 className="font-semibold mb-3">What's included in visiting charges:</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>On-site inspection of the issue</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Professional assessment and diagnosis</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Detailed quotation for required work</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Expert recommendations and solutions</span>
                                </li>
                            </ul>
                        </div>

                        {/* Pricing Note */}
                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 text-sm">💡 Pricing Best Practices</h4>
                            <p className="text-sm text-muted-foreground">
                                Always provide transparent pricing after inspection. Discuss all charges with the customer before starting work. This builds trust and ensures customer satisfaction.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
