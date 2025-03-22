import { db } from "../firebase";
import { collection, getDocs, updateDoc } from "firebase/firestore";

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
 * One time function to sync booking id with document id
 * @returns {Promise<void>}
 */
export async function syncBookingId() {
    const collectionRef = collection(db, "booking");
    const querySnapshot = await getDocs(collectionRef);
    querySnapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, { id: doc.id });
    });
}