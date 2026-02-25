import { useUser } from '@clerk/clerk-react'
import { Navigate, Route, Routes } from 'react-router'
import {Toaster} from "react-hot-toast"
import HomePage from './pages/HomePage'
import ProblemsPage from './pages/ProblemsPage'

function App() {

  // const {isSignedIn} = useUser()
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) return null // or a loading spinner

  return (

    <>
      <Routes>

        <Route path="/" element={<HomePage />} />
        <Route path="/problems" element={isSignedIn ? <ProblemsPage /> : <Navigate to="/" />} />
        
      </Routes>

      <Toaster />

    </>
  )
}


export default App;


