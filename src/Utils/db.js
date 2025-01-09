import { collection, addDoc } from "firebase/firestore";
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
