import React from 'react'
import { FiAlignJustify } from "react-icons/fi";
import logo from '../assets/Pic1.png'
import avatar from '../assets/Pic2.png'

function Header({ onMenuClick }) {
  return (
    <div style={{padding:0,margin:0,boxSizing:'border-box'}}>
      <header className="top-bar">
              <button 
                className='menu-btn' 
                aria-label='เปิดเมนู'
                onClick={onMenuClick}
              >
                <FiAlignJustify size={22}/>
              </button>
      
              <img className="logo" src={logo} alt="Logo" />
      
              <button className='profile-btn' aria-label='โปรไฟล์'>
                <img src={avatar} alt="Profile" />
              </button>
        </header>
    </div>
  )
}

export default Header
