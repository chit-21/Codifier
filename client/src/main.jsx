import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from './popup.jsx'
import './index.css'
import './popup.css' // Import the new CSS file

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)
