import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { createUserDocument } from "./db";

const auth = getAuth();

export const createUser = async (email, password) => {
    createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
        const user = userCredential.user;
        // console.log(user)
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage)
    });
}

export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const createDB = await createUserDocument(user.uid, user.email);
        return user;
    } catch (error) {
        if (error.code === 'auth/invalid-email') {
            return 'Invalid email address';
        }
    }
};

export const logout = async () => {
    auth.signOut().then(() => {
        console.info('User signed out');
    }).catch((error) => {
        console.error(error);
    });
};