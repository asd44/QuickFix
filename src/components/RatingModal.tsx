'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    tutorName: string;
}

export function RatingModal({ isOpen, onClose, onSubmit, tutorName }: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        onSubmit(rating, comment);
        setRating(0);
        setComment('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Rate Service Provider</CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                        How was your experience with {tutorName}?
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="text-4xl transition-transform hover:scale-110"
                            >
                                <span className={
                                    star <= (hoveredRating || rating)
                                        ? 'text-yellow-500'
                                        : 'text-gray-300'
                                }>
                                    ★
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Comment (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full p-3 rounded-md border border-input bg-background min-h-[100px]"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1"
                            disabled={rating === 0}
                        >
                            Submit Rating
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
