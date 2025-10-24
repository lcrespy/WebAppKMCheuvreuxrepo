import './App.css';

import React from 'react';
import Chat from './components/Chat';


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="LOGO_CHEUVREUX.png" alt="logo Cheuvreux" className="App-logo" aria-hidden="true"/>
		<h1 class="Title">Cheuvreux Azure OpenAI</h1>
      </header>
	  <Chat className="Chat"/>
    </div>
  );
}

export default App;
