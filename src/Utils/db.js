import { collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, updateDoc } from "firebase/firestore";
import { db } from '../firebase/config';

/**
 * Add a booking to the database
 * @param {string} startDate - The start date of the booking
 * @param {string} endDate - The end date of the booking
 * @param {string} booker - The name of the person who made the booking
 * @param {number} guests - The number of guests
 * @returns {Promise<void>}
 */
export async function addBooking(startDate, endDate, booker, guests) {
    try {
        const docRef = await addDoc(collection(db, "booking"), {
            startDate,
            endDate,
            booker,
            guests,
            id: docRef.id
        });
        console.info("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

/**
 * Get all bookings from the database and convert Firestore Timestamps to Date objects.
 * @returns {Promise<Array>} Array of bookings with startDate and endDate as Date objects.
 */
export async function getBookings() {
    const res = [];
    const querySnapshot = await getDocs(collection(db, "booking"));

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        res.push({
            ...data,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate()
        });
    });
    return res;
}

/**
 * Delete a booking from the database
 * @param {string} id - The ID of the booking to delete
 * @returns {Promise<void>}
 */
export async function deleteBooking(id) {
    try {
        await deleteDoc(doc(db, "booking", id));
        console.info("Document successfully deleted!");
    } catch (e) {
        console.error("Error removing document: ", e);
    }
}

/**
 * Delete all the bookings from the database
 * @returns {Promise<void>}
 */
export async function deleteAllBookings() {
    const querySnapshot = await getDocs(collection(db, "booking"));
    querySnapshot.forEach((doc) => {
        deleteBooking(doc.id);
    });
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

export async function syncBookingId() {
    const collectionRef = collection(db, "booking");
    const querySnapshot = await getDocs(collectionRef);
    querySnapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { id: doc.id });
    });
}