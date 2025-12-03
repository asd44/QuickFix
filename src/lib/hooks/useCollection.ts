'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, Query, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useCollection<T = DocumentData>(
    collectionName: string,
    ...constraints: QueryConstraint[]
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setLoading(true);

        let q: Query;
        if (constraints.length > 0) {
            q = query(collection(db, collectionName), ...constraints);
        } else {
            q = query(collection(db, collectionName));
        }

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const documents = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                })) as T[];
                setData(documents);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err as Error);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [collectionName, JSON.stringify(constraints)]);

    return { data, loading, error };
}
