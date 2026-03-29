'use client';

import { useState, useEffect } from 'react';
import { FirestoreREST } from '@/lib/firebase/nativeFirestore';

interface UseDocumentOptions {
    pausePolling?: boolean; // When true, polling is paused
}

export function useDocument<T = Record<string, any>>(
    collectionName: string,
    documentId: string | null,
    options: UseDocumentOptions = {}
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { pausePolling = false } = options;

    useEffect(() => {
        if (!documentId) {
            setData(null);
            setLoading(false);
            return;
        }

        let isMounted = true;

        const fetchDocument = async () => {
            setLoading(true);
            try {
                const doc = await FirestoreREST.getDoc<T>(collectionName, documentId);
                if (isMounted) {
                    setData(doc ? { id: documentId, ...doc } as T : null);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err as Error);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        // Initial fetch (always do this)
        fetchDocument();

        // Poll for updates only if not paused
        let interval: NodeJS.Timeout | undefined;
        if (!pausePolling) {
            interval = setInterval(fetchDocument, 5000);
        }

        return () => {
            isMounted = false;
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [collectionName, documentId, pausePolling]);

    return { data, loading, error };
}
