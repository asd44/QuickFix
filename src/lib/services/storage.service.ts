import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

export class StorageService {
    // Get Firebase Storage bucket
    private static get storageBucket(): string {
        return process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '';
    }

    // Upload file using REST API with native auth token
    private static async uploadWithNativeAuth(
        path: string,
        file: File,
        idToken: string
    ): Promise<string> {
        const bucket = this.storageBucket;
        const encodedPath = encodeURIComponent(path);
        const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodedPath}`;

        console.log('[StorageService] Uploading via REST API to:', path);

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[StorageService] Upload failed:', response.status, errorText);
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('[StorageService] Upload successful:', result.name);

        // Construct download URL
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
        return downloadUrl;
    }

    // Get native auth ID token
    private static async getNativeIdToken(): Promise<string | null> {
        if (!Capacitor.isNativePlatform()) {
            return null;
        }

        try {
            const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
            const result = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
            return result.token || null;
        } catch (error) {
            console.error('[StorageService] Failed to get native ID token:', error);
            return null;
        }
    }

    // Ensure web SDK auth is ready (with timeout)
    private static async waitForWebAuth(timeout = 1000): Promise<boolean> {
        if (auth.currentUser) {
            return true;
        }

        return new Promise<boolean>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    unsubscribe();
                    resolve(true);
                }
            });

            setTimeout(() => {
                unsubscribe();
                resolve(!!auth.currentUser);
            }, timeout);
        });
    }

    // Upload file - tries web SDK first, falls back to REST API with native token
    private static async uploadFile(path: string, file: File): Promise<string> {
        // First, try to wait for web SDK auth briefly
        const hasWebAuth = await this.waitForWebAuth(500);

        if (hasWebAuth) {
            // Use web SDK for upload
            console.log('[StorageService] Using web SDK for upload');
            const storageRef = ref(storage, path);
            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        }

        // No web auth, try native auth REST API approach
        if (Capacitor.isNativePlatform()) {
            const idToken = await this.getNativeIdToken();
            if (idToken) {
                return await this.uploadWithNativeAuth(path, file, idToken);
            }
        }

        // Last resort - try web SDK anyway (might work if rules allow)
        console.log('[StorageService] Attempting web SDK upload without auth...');
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }

    // Upload profile picture
    static async uploadProfilePicture(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}.${ext}`;
        const path = `profile-pictures/${userId}/${filename}`;
        return await this.uploadFile(path, file);
    }

    // Upload verification document
    static async uploadVerificationDocument(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}.${ext}`;
        const path = `verification-docs/${userId}/${filename}`;
        return await this.uploadFile(path, file);
    }

    // Upload intro video
    static async uploadIntroVideo(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const filename = `intro-${Date.now()}.${ext}`;
        const path = `intro-videos/${userId}/${filename}`;
        return await this.uploadFile(path, file);
    }

    // Delete file by URL
    static async deleteFile(fileUrl: string): Promise<void> {
        const hasWebAuth = await this.waitForWebAuth(500);
        if (hasWebAuth) {
            const fileRef = ref(storage, fileUrl);
            await deleteObject(fileRef);
        } else {
            // For delete with native auth, we'd need to implement REST API delete
            console.warn('[StorageService] Delete without web auth not implemented');
        }
    }
}
