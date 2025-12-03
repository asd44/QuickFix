import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

export class StorageService {
    // Upload profile picture
    static async uploadProfilePicture(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}.${ext}`;
        const storageRef = ref(storage, `profile-pictures/${userId}/${filename}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    }

    // Upload verification document
    static async uploadVerificationDocument(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}.${ext}`;
        const storageRef = ref(storage, `verification-docs/${userId}/${filename}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    }

    // Upload intro video
    static async uploadIntroVideo(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const filename = `intro-${Date.now()}.${ext}`;
        const storageRef = ref(storage, `intro-videos/${userId}/${filename}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    }

    // Delete file by URL
    static async deleteFile(fileUrl: string): Promise<void> {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
    }
}
