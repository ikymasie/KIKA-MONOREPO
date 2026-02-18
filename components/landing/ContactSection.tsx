'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation';

export default function ContactSection() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const { ref: headerRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
    const { ref: formRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.08 });
    const { ref: infoRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.08 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // TODO: Implement actual form submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        setSubmitStatus('success');
        setIsSubmitting(false);
        setFormData({ name: '', email: '', subject: '', message: '' });

        setTimeout(() => setSubmitStatus('idle'), 5000);
    };

    const contactInfo = [
        {
            icon: Mail,
            title: 'Email',
            value: 'info@kikaplatform.bw',
            link: 'mailto:info@kikaplatform.bw'
        },
        {
            icon: Phone,
            title: 'Phone',
            value: '+267 123 4567',
            link: 'tel:+2671234567'
        },
        {
            icon: MapPin,
            title: 'Office',
            value: 'Gaborone, Botswana',
            link: null
        }
    ];

    return (
        <section
            id="contact"
            className="py-24 bg-gradient-to-b from-primary-50 to-white"
        >
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    data-animate
                    className="text-center mb-16 animate-reveal-up"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Get in Touch
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Form — slides in from left */}
                    <div
                        ref={formRef}
                        data-animate
                        className="animate-slide-in-left"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject
                                </label>
                                <input
                                    id="subject"
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="How can we help?"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    required
                                    rows={6}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                                    placeholder="Tell us more about your inquiry..."
                                />
                            </div>

                            {submitStatus === 'success' && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 animate-scale-in">
                                    Thank you! Your message has been sent successfully.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-4 rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Sending...' : (
                                    <>
                                        <Send size={20} />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Contact Information — slides in from right */}
                    <div
                        ref={infoRef}
                        data-animate
                        className="animate-slide-in-right delay-200"
                    >
                        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-8 text-white h-full">
                            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                            <p className="text-white/90 mb-8">
                                Reach out to us through any of these channels. We&apos;re here to help!
                            </p>

                            <div className="space-y-6 mb-8">
                                {contactInfo.map((info) => (
                                    <div key={info.title} className="flex items-start gap-4">
                                        <div className="p-3 bg-white/10 rounded-lg">
                                            <info.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="font-medium mb-1">{info.title}</div>
                                            {info.link ? (
                                                <a
                                                    href={info.link}
                                                    className="text-white/80 hover:text-white transition-colors"
                                                >
                                                    {info.value}
                                                </a>
                                            ) : (
                                                <div className="text-white/80">{info.value}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-white/20 pt-8">
                                <h4 className="font-medium mb-4">Office Hours</h4>
                                <div className="space-y-2 text-white/80">
                                    <div>Monday - Friday: 8:00 AM - 5:00 PM</div>
                                    <div>Saturday: 9:00 AM - 1:00 PM</div>
                                    <div>Sunday: Closed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
