import { collection, addDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
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
    const id = Date.now().toString().slice(Date.now().toString().length - 9);
    try {
        const docRef = await addDoc(collection(db, "booking"), {
            startDate,
            endDate,
            booker,
            guests,
            id: id
        });
        console.info("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

/**
 * Update bookin from the database
 * @param {string} id - The ID of the booking to update
 * @param {Object} updatedData - The updated booking data
 * @returns {Promise<void>}
 */
export async function updateBooking(id, updatedData) {
    const collectionRef = collection(db, "booking");
    // loop through all the documents in the collection to find booker.id
    const querySnapshot = await getDocs(collectionRef);
    querySnapshot.forEach(async (doc) => {
        if (doc.data().id === id) {
            await updateDoc(doc.ref, updatedData);
        }
    });
};


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
    const collectionRef = collection(db, "booking");
    const querySnapshot = await getDocs(collectionRef);
    querySnapshot.forEach(async (doc) => {
        if (doc.data().id === id) {
            await deleteDoc(doc.ref);
        }
    });
    console.info("Document deleted with ID: ", id);
}

/**
 * Get a booking from the database
 * @param {string} id - The ID of the booking to get
 * @returns {Promise<Object>} The booking object
 */
export async function getBooking(id) {
    const collectionRef = collection(db, "booking");
    const querySnapshot = await getDocs(collectionRef);
    let res = {};
    querySnapshot.forEach((doc) => {
        if (doc.data().id === id) {
            res = doc.data();
        }
    });
    return res;
}