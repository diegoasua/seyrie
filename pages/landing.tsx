import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import { auth } from '../firebase';


const LandingPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (error) {
            if (error instanceof Error) {
                alert(error.message);
            } else {
                throw error;
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <div className="p-5 bg-white shadow rounded w-80">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700">Email:</label>
                        <input type="email" id="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700">Password:</label>
                        <input type="password" id="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <button type="submit" className="w-full px-3 py-2 rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-500">Log In</button>
                </form>
            </div>
        </div>
    );
};

export default LandingPage;

