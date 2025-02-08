'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useAuthState } from 'react-firebase-hooks/auth'
import { Brain } from 'lucide-react'
import Link from 'next/link'

// Initialize Firebase (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyCigSdsYNyXeis55JDfTn2qtqb-yZgVJnM",
  authDomain: "icecreamai.firebaseapp.com",
  projectId: "icecreamai",
  storageBucket: "icecreamai.appspot.com",
  messagingSenderId: "729351344357",
  appId: "1:729351344357:web:900a7a3894ff76f0db440c",
  measurementId: "G-7Z7ZSLLR9J"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export function SignUpGoogle() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [user] = useAuthState(auth)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard') // Redirect to dashboard after successful signup
    }
  }, [user, router])

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      // const provider = new GoogleAuthProvider()
      // await signInWithPopup(auth, provider)
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    (<div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="text-center mb-8">
          <div
            className="mx-auto mb-4 w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <Brain className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Join AI Learning Platform</h1>
          <p className="text-gray-600 mt-2">Sign up to start your AI learning journey</p>
        </div>
        <Link href = "/home" >
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full bg-white border border-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 mr-2"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4" />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853" />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05" />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335" />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          {loading ? 'Signing up...' : 'Sign up with Google'}
        </button>
        </Link>


        {error && (
          <p className="mt-4 text-red-500 text-center">{error}</p>
        )}

        <p className="mt-8 text-center text-sm text-gray-600">
          This is a Google sign-in Simulation. Your account will not be Taken.
        </p>
      </div>
    </div>)
  );
}