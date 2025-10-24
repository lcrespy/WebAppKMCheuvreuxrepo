import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Chat.css';

function Chat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);       // historique {role, content}
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Effet pour faire défiler la zone de chat vers le bas à chaque nouveau message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;  // n'envoie pas de message vide
    const userMessage = { role: 'user', content: input, sources: []};
    // Ajoute le message utilisateur à l'historique local
    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, { role: 'assistant', content: '...', sources: []}]); // réponse provisoire
    setInput('');
    setIsLoading(true);
	const filteredMessages = updatedMessages.map(msg => ({
	  role: msg.role,
	  content: msg.content
	}));
    try {
      // Appel à l'API backend (on envoie tous les messages précédents pour le contexte)
      const response = await axios.post('http://localhost:3001/api/chat', { messages: filteredMessages });
      console.log(response.data);
	  const assistantReply = { role: 'assistant', content: response.data.content, sources: response.data.context.citations };
      // Remplace le "..." par la vraie réponse
      setMessages(prev => [...prev.slice(0, -1), assistantReply]);
    } catch (err) {
      console.error(err);
      // Remplace le "..." par un message d'erreur

      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: "Erreur lors de la réponse." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-list scrollable">
        {messages.map((msg, index) => (
		  <div key={index} className={`message ${msg.role}`}>
			<p><strong>{msg.role === 'user' ? 'Moi' : 'Assistant'}:</strong></p><p>{msg.content}

			{/* Affichage des citations si présentes */}
			{msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
			  <div className="citations">
				<small>Sources :</small>
				<ul>
				  {msg.sources.map((citation, i) => (
					<li key={i}>
					  <a
						href={citation.url || citation.filepath}
						target="_blank"
						rel="noopener noreferrer"
						className="citation"
						title={citation.content || "Apercu non disponible"}
					  >
						{citation.title || citation.url || citation.filepath}
					  </a>
					</li>
				  ))}
				</ul>
			  </div>
			)}</p>
		  </div>
		))}
        {isLoading && <div className="message assistant">Assistant est en train d'écrire...</div>}
        {/* Ancre pour le scroll */}
        <div ref={chatEndRef} />
      </div>

      <div className="input-area">
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if(e.key === 'Enter') sendMessage(); }}
          placeholder="Entrez votre message..." 
		  className="copilot-input"
        />
        <button onClick={sendMessage} disabled={isLoading} className="copilot-send">➤</button>
      </div>
    </div>
  );
}

export default Chat;