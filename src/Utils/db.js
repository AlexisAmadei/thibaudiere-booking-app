import { collection, addDoc, getDocs } from "firebase/firestore";
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
            guests
        });
        console.log("Document written with ID: ", docRef.id);
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
    console.log('GET', res);
    return res;
}
