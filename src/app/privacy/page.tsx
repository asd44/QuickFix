'use client';

import { BackHeader } from "@/components/BackHeader";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white pb-20">
            <BackHeader title="Privacy Policy" className="py-4 px-0" />

            <div className="px-4">
                <div className="bg-gray-50 rounded-3xl p-6 space-y-6 border border-gray-100">
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">1. Information We Collect</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            We collect information you provide directly to us, such as your name, phone number, address, and payment information when you register and book services.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">2. How We Use Your Information</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            We use your information to facilitate service bookings, process payments, communicate with you, and improve our services.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">3. Information Sharing</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            We share your necessary details (name, address, phone) with the service provider you book. We do not sell your personal data to third parties.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">4. Data Security</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            We implement appropriate technical measures to protect your personal information against unauthorized access or disclosure.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-gray-900">5. Location Data</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            We may collect your location data to help you find nearby providers and to verify service delivery locations.
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
