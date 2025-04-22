import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {  Accueil } from './container';

import './App.css';


const App = () => {



  return (
    <div className="App">
      <BrowserRouter>
     
        <Routes>
          {/* ... Vos autres routes ... */}
          <Route path="*" element={<><Accueil /></>} />
        
        

        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
