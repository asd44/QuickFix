'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useDocument<T = DocumentData>(
    collectionName: string,
    documentId: string | null
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!documentId) {
            setData(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const docRef = doc(db, collectionName, documentId);

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setData({ id: snapshot.id, ...snapshot.data() } as T);
                } else {
                    setData(null);
                }
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err as Error);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [collectionName, documentId]);

    return { data, loading, error };
}
