import Map from './component/Map'
import './App.css'
import { FiAlignJustify } from "react-icons/fi";
import React from 'react'
import Reports from './component/Reports.jsx'
import Header from './component/Header.jsx'


function App() {
  return (
    <>
        <Header />
        <Reports />
        <Map/>
        
    </>
  )
}

export default App
