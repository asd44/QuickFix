'use client';

import { BackHeader } from "@/components/BackHeader";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white pb-20">
            <BackHeader title="About QuickFix" className="py-4 px-0" />

            <div className="px-4 space-y-6">
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#005461] to-[#002025] rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-4">
                        🛠️
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">QuickFix</h2>
                    <p className="text-gray-500">Connecting you with trusted local experts</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-sm font-bold text-[#005461] uppercase tracking-wider mb-3">Our Mission</h3>
                    <p className="text-gray-700 leading-relaxed">
                        QuickFix is dedicated to simplifying your daily life by connecting you with skilled professionals for all your home service needs. Whether it's a leaky tap, a flickering light, or a deep cleaning session, we bring the experts to your doorstep.
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 px-2">Why Choose Us?</h3>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#005461]/10 flex items-center justify-center text-[#005461] font-bold text-lg shrink-0">
                            1
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">Verified Professionals</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Every provider is thoroughly vetted for your safety and peace of mind.</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#005461]/10 flex items-center justify-center text-[#005461] font-bold text-lg shrink-0">
                            2
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">Transparent Pricing</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Upfront quotes and fixed visiting charges. No hidden surprises.</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#005461]/10 flex items-center justify-center text-[#005461] font-bold text-lg shrink-0">
                            3
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-1">Secure Payments</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">Pay securely through the app after the job is done to your satisfaction.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#f0f9fa] rounded-2xl p-6 border border-[#005461]/10">
                    <h3 className="text-sm font-bold text-[#005461] uppercase tracking-wider mb-3">Our Story</h3>
                    <p className="text-gray-700 leading-relaxed">
                        Founded in 2024, QuickFix started with a simple idea: finding reliable help shouldn't be a hassle. We've grown from a small neighborhood network to a city-wide platform, but our core value remains the same—trust.
                    </p>
                </div>
            </div>
        </div>
    );
}
