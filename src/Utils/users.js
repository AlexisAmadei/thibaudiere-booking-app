import { db } from '../firebase/config';
import { collection, getDocs, addDoc, updateDoc, query, where } from 'firebase/firestore';

/**
 * Get all user documents from the users collection
 * @returns {Promise<Array>} Array of user documents
 */
export async function getAllUsers() {
    const res = [];
    const querySnapshot = await getDocs(collection(db, "users"));

    querySnapshot.forEach((doc) => {
        res.push(doc.data());
    });
    return res;
}

/**
 * Get user document from users collection
 * @param {string} uid - The user's UID
 * @returns {Promise<Object>} The user document
 */
export async function getUserDocument(uid) {
    const q = query(collection(db, "users"), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
    } else {
        console.error("No such document!");
    }
};

/**
 * Update user document in users collection
 * @param {string} uid - The user's UID
 * @param {Object} updatedData - The updated user data
 * @returns {Promise<void>}
 */
export async function updateUserDocument(uid, updatedData) {
    const q = query(collection(db, "users"), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), updatedData);
        console.info('User document updated');
    } else {
        console.error("No such document!");
    }
}

/**
 * Create user document on users collection on sign in if it doesn't exist
 * @param {string} uid - The user's UID
 * @param {string} email - The user's email
 * @returns {Promise<void>}
 */
export async function createUserDocument(uid, email) {
    const q = query(collection(db, "users"), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        await addDoc(collection(db, "users"), {
            uid,
            email
        });
        console.info('User document created');
    } else {
        console.info('User already exists');
    }
};

/**
 * Retrun if user is admin or not
 * @param {string} uid - The user's UID
 * @param {string} email - The user's email
 * @returns {Promise<boolean>} - True if user is admin, false otherwise
 */
export async function isAdmin(uid, email) {
    if (!uid || !email) {
        console.error('UID or email is missing');
        return false;
    }
    const q = query(collection(db, "users"), where('uid', '==', uid), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        // console.log(userDoc.admin);
        return userDoc.admin;
    } else {
        console.error("No such document!");
        return false;
    }
}
