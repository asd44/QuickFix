'use client';

import { Capacitor } from '@capacitor/core';

const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1/projects/quickfix-v1/databases/(default)/documents';

// Get ID token from native Firebase or web Firebase
async function getIdToken(): Promise<string | null> {
    // Try native auth first (for Capacitor apps)
    if (Capacitor.isNativePlatform()) {
        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.getIdToken();
            if (result.token) {
                return result.token;
            }
        } catch (error) {
            console.error('[FirestoreREST] Failed to get native ID token:', error);
        }
    }

    // Fallback to web SDK auth (for web/admin login)
    try {
        const { auth } = await import('@/lib/firebase/config');
        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            console.log('[FirestoreREST] Got web SDK token');
            return token;
        }
    } catch (error) {
        console.error('[FirestoreREST] Failed to get web ID token:', error);
    }

    console.warn('[FirestoreREST] No auth token available');
    return null;
}


// Convert Firestore REST API response format to normal object
function convertFromFirestore(fields: any): any {
    if (!fields) return null;
    const result: any = {};
    for (const [key, value] of Object.entries(fields)) {
        const val = value as any;
        if (val.stringValue !== undefined) result[key] = val.stringValue;
        else if (val.integerValue !== undefined) result[key] = parseInt(val.integerValue);
        else if (val.doubleValue !== undefined) result[key] = val.doubleValue;
        else if (val.booleanValue !== undefined) result[key] = val.booleanValue;
        else if (val.nullValue !== undefined) result[key] = null;
        else if (val.timestampValue !== undefined) {
            // Return object with toMillis() for compatibility
            const date = new Date(val.timestampValue);
            result[key] = {
                toMillis: () => date.getTime(),
                toDate: () => date,
                seconds: Math.floor(date.getTime() / 1000),
                nanoseconds: (date.getTime() % 1000) * 1000000
            };
        }
        else if (val.mapValue !== undefined) result[key] = convertFromFirestore(val.mapValue.fields || {});
        else if (val.arrayValue !== undefined) {
            result[key] = (val.arrayValue.values || []).map((v: any) => {
                if (v.stringValue !== undefined) return v.stringValue;
                if (v.integerValue !== undefined) return parseInt(v.integerValue);
                if (v.booleanValue !== undefined) return v.booleanValue;
                if (v.mapValue !== undefined) return convertFromFirestore(v.mapValue.fields || {});
                return v;
            });
        }
        else result[key] = null;
    }
    return result;
}

// Convert JS value to Firestore format
function valueToFirestore(value: any): any {
    if (value === null || value === undefined) {
        return { nullValue: null };
    } else if (typeof value === 'string') {
        return { stringValue: value };
    } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return { integerValue: value.toString() };
        } else {
            return { doubleValue: value };
        }
    } else if (typeof value === 'boolean') {
        return { booleanValue: value };
    } else if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map(v => valueToFirestore(v))
            }
        };
    } else if (typeof value === 'object') {
        // Check for serverTimestamp marker
        if ((value as any)._serverTimestamp) {
            return { timestampValue: new Date().toISOString() };
        }
        // Check for increment marker
        if ((value as any)._increment !== undefined) {
            return { integerValue: (value as any)._increment.toString() };
        }
        // Regular object
        return { mapValue: { fields: convertToFirestore(value) } };
    }
    return { stringValue: String(value) };
}

// Convert JS object to Firestore format
function convertToFirestore(data: any): any {
    const fields: any = {};
    for (const [key, value] of Object.entries(data)) {
        fields[key] = valueToFirestore(value);
    }
    return fields;
}

// Query filter types
export interface QueryFilter {
    field: string;
    op: 'EQUAL' | 'NOT_EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'ARRAY_CONTAINS' | 'IN' | 'ARRAY_CONTAINS_ANY';
    value: any;
}

export interface QueryOptions {
    where?: QueryFilter[];
    orderBy?: { field: string; direction?: 'ASCENDING' | 'DESCENDING' }[];
    limit?: number;
    startAfter?: any;
}

// Firestore REST API operations
export const FirestoreREST = {
    // Get a document
    async getDoc<T>(collection: string, docId: string): Promise<T | null> {
        const token = await getIdToken();
        if (!token) {
            console.error('[FirestoreREST] No token available');
            return null;
        }

        try {
            const response = await fetch(`${FIRESTORE_BASE_URL}/${collection}/${docId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 404) return null;
            if (!response.ok) {
                console.error('[FirestoreREST] GET failed:', response.status);
                return null;
            }

            const data = await response.json();
            return { id: docId, ...convertFromFirestore(data.fields) } as T;
        } catch (error) {
            console.error('[FirestoreREST] GET error:', error);
            return null;
        }
    },

    // Set a document (create or overwrite)
    async setDoc(collection: string, docId: string, data: any, merge: boolean = false): Promise<boolean> {
        const token = await getIdToken();
        if (!token) {
            console.error('[FirestoreREST] No token available');
            return false;
        }

        try {
            let url = `${FIRESTORE_BASE_URL}/${collection}/${docId}`;
            if (merge) {
                const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
                url += `?${fieldPaths}`;
            }

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fields: convertToFirestore(data) }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('[FirestoreREST] SET failed:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('[FirestoreREST] SET error:', error);
            return false;
        }
    },

    // Add a document with auto-generated ID
    async addDoc<T>(collection: string, data: any): Promise<string | null> {
        const token = await getIdToken();
        if (!token) {
            console.error('[FirestoreREST] No token available');
            return null;
        }

        try {
            const response = await fetch(`${FIRESTORE_BASE_URL}/${collection}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fields: convertToFirestore(data) }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('[FirestoreREST] ADD failed:', error);
                return null;
            }

            const result = await response.json();
            // Extract document ID from name (format: projects/.../documents/collection/docId)
            const docId = result.name?.split('/').pop() || null;
            return docId;
        } catch (error) {
            console.error('[FirestoreREST] ADD error:', error);
            return null;
        }
    },

    // Update specific fields (merge)
    async updateDoc(collection: string, docId: string, data: any): Promise<boolean> {
        const token = await getIdToken();
        if (!token) return false;

        try {
            // Flatten nested field paths for updateMask
            const flattenPaths = (obj: any, prefix = ''): string[] => {
                const paths: string[] = [];
                for (const key of Object.keys(obj)) {
                    const path = prefix ? `${prefix}.${key}` : key;
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) &&
                        !(obj[key] as any)._serverTimestamp && !(obj[key] as any)._increment) {
                        paths.push(...flattenPaths(obj[key], path));
                    } else {
                        paths.push(path);
                    }
                }
                return paths;
            };

            const fieldPaths = flattenPaths(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
            const response = await fetch(`${FIRESTORE_BASE_URL}/${collection}/${docId}?${fieldPaths}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fields: convertToFirestore(data) }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('[FirestoreREST] UPDATE failed:', error);
            }
            return response.ok;
        } catch (error) {
            console.error('[FirestoreREST] UPDATE error:', error);
            return false;
        }
    },

    // Query documents with complex filters
    async query<T>(collection: string, options: QueryOptions = {}): Promise<T[]> {
        const token = await getIdToken();
        if (!token) return [];

        try {
            const structuredQuery: any = {
                from: [{ collectionId: collection }],
            };

            // Build where clause
            if (options.where && options.where.length > 0) {
                if (options.where.length === 1) {
                    const w = options.where[0];
                    structuredQuery.where = {
                        fieldFilter: {
                            field: { fieldPath: w.field },
                            op: w.op,
                            value: valueToFirestore(w.value),
                        }
                    };
                } else {
                    structuredQuery.where = {
                        compositeFilter: {
                            op: 'AND',
                            filters: options.where.map(w => ({
                                fieldFilter: {
                                    field: { fieldPath: w.field },
                                    op: w.op,
                                    value: valueToFirestore(w.value),
                                }
                            }))
                        }
                    };
                }
            }

            // Build orderBy clause
            if (options.orderBy && options.orderBy.length > 0) {
                structuredQuery.orderBy = options.orderBy.map(o => ({
                    field: { fieldPath: o.field },
                    direction: o.direction || 'ASCENDING'
                }));
            }

            // Add limit
            if (options.limit) {
                structuredQuery.limit = options.limit;
            }

            const response = await fetch(`${FIRESTORE_BASE_URL}:runQuery`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ structuredQuery }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('[FirestoreREST] QUERY failed:', error);
                return [];
            }

            const results = await response.json();
            return results
                .filter((r: any) => r.document)
                .map((r: any) => ({
                    id: r.document.name.split('/').pop(),
                    ...convertFromFirestore(r.document.fields)
                })) as T[];
        } catch (error) {
            console.error('[FirestoreREST] QUERY error:', error);
            return [];
        }
    },

    // Get all documents in a collection (no filters)
    async getDocs<T>(collection: string, limitCount?: number): Promise<T[]> {
        return this.query<T>(collection, { limit: limitCount });
    },

    // Delete a document
    async deleteDoc(collection: string, docId: string): Promise<boolean> {
        const token = await getIdToken();
        if (!token) return false;

        try {
            const response = await fetch(`${FIRESTORE_BASE_URL}/${collection}/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return response.ok;
        } catch (error) {
            console.error('[FirestoreREST] DELETE error:', error);
            return false;
        }
    },

    // Server timestamp marker
    serverTimestamp() {
        return { _serverTimestamp: true };
    },

    // Increment marker (for use with updateDoc - requires special handling)
    increment(n: number = 1) {
        return { _increment: n };
    }
};

// Native auth helper
export const NativeAuth = {
    async getCurrentUser() {
        if (!Capacitor.isNativePlatform()) return null;

        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.getCurrentUser();
            return result.user || null;
        } catch (error) {
            console.error('[NativeAuth] getCurrentUser error:', error);
            return null;
        }
    },

    async signOut() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            await FirebaseAuthentication.signOut();
        } catch (error) {
            console.error('[NativeAuth] signOut error:', error);
        }
    },

    async getIdToken(): Promise<string | null> {
        return getIdToken();
    }
};
