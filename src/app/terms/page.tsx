'use client';

import { BackHeader } from "@/components/BackHeader";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white pb-20">
            <BackHeader title="Terms & Conditions" className="py-4 px-0" />

            <div className="px-4">
                <div className="bg-gray-50 rounded-3xl p-6 space-y-6 border border-gray-100">
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">1. Introduction</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Welcome to QuickFix. By using our app and services, you agree to these Terms and Conditions. Please read them carefully.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">2. Service Bookings</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            When you book a service, you agree to pay the visiting charge to confirm the appointment. The final cost will be determined based on the work required and materials used.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">3. User Conduct</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Users must provide accurate information and treat service providers with respect. Any abusive behavior may result in account suspension.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">4. Cancellations</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Cancellations made less than 2 hours before the scheduled time may incur a cancellation fee. Visiting charges are non-refundable if the provider has already arrived.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">5. Liability</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            QuickFix connects users with independent providers. While we vet our providers, we are not liable for any direct damages caused during the service, though we will assist in dispute resolution.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-400 text-center">
                            Last updated: December 2024
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
