import Map from './component/Map'
import './App.css'
import logo from './assets/pic1.png'
import avatar from './assets/pic2.png'
import { FiAlignJustify } from "react-icons/fi";

function App() {
  return (
    <>
      <header className="top-bar">
        <button className='menu-btn' aria-label='เปิดเมนู'>
          <FiAlignJustify size={22} />
        </button>

        <img className="logo" src={logo} alt="Logo" />

        <button className='profile-btn' aria-label='โปรไฟล์'>
          <img src={avatar} alt="Profile" />
        </button>
      </header>
      {/* <Map /> */}
    </>
  )
}

export default App
