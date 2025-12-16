'use client';

import { Button } from "@/components/Button";
import { useState } from "react";
import { BackHeader } from "@/components/BackHeader";

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // In a real app, this would send data to a backend
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            <BackHeader title="Contact Us" className="py-4 px-0" />

            <div className="px-4 space-y-6">
                <div className="text-center py-6">
                    <div className="w-16 h-16 bg-[#005461]/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-[#005461]">
                        🎧
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">We're here to help</h2>
                    <p className="text-gray-500">Get in touch with our support team</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">
                            📞
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Phone</h3>
                            <p className="text-gray-600">+91 98765 43210</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">
                            📧
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Email</h3>
                            <p className="text-gray-600">support@quickfix.com</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">
                            📍
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">Office</h3>
                            <p className="text-gray-600">Tech Park, Bangalore</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Send us a message</h3>

                    {submitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-green-600">
                                ✅
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                            <p className="text-gray-500 mb-6">Thank you for contacting us. We'll get back to you shortly.</p>
                            <Button variant="outline" className="w-full rounded-xl" onClick={() => setSubmitted(false)}>
                                Send another message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-semibold text-gray-700">Name</label>
                                    <input
                                        id="name"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-semibold text-gray-700">Subject</label>
                                <input
                                    id="subject"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                    placeholder="What is this regarding?"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-semibold text-gray-700">Message</label>
                                <textarea
                                    id="message"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#005461] focus:ring-2 focus:ring-[#005461]/20 outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                                    rows={5}
                                    placeholder="How can we help you?"
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 rounded-xl bg-[#005461] hover:bg-[#00434d] text-white font-semibold shadow-lg shadow-[#005461]/20 mt-2">
                                Send Message
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
