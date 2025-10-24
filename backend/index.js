const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();  // charge AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT etc.

const path = require('path');
const compression = require('compression');

const app = express();
app.use(express.json());
app.use(cors());  // autorise tout par défaut, vous pouvez restreindre aux origines nécessaires
app.use(compression());


app.use(express.static(path.join(__dirname, 'build')));




// Configuration depuis variables d'env
const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT; // ex: https://<nom>.openai.azure.com
const OPENAI_KEY = process.env.AZURE_OPENAI_KEY;           // votre clé API secrète
const DEPLOYMENT_NAME = process.env.AZURE_OPENAI_MODEL || 'gpt-35-turbo'; // nom du déploiement modèle
const AZURE_AI_SEARCH_KEY = process.env.AZURE_AI_SEARCH_KEY;
const AZURE_AI_SEARCH_ENDPOINT = process.env.AZURE_AI_SEARCH_ENDPOINT;

// Route principale de chat
app.post('/api/chat', async (req, res) => {
  const messages = req.body.messages || [];
  try {
    const url = `${OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`;
    const response = await axios.post(url, 
	  {messages: messages, 
	  max_tokens: 1000,
	  data_sources: [{
		  type: 'azure_search',
		  parameters: {
			  endpoint: AZURE_AI_SEARCH_ENDPOINT,
			  authentication: {
				  type: "api_key",
				  key: AZURE_AI_SEARCH_KEY
			  },
			  index_name: 'rag-test-id',
			  query_type: 'vectorSimpleHybrid',
			  embedding_dependency: {
				  type: 'deployment_name',
				  deployment_name: 'text-embedding-ada-002'
			  },
			  fields_mapping: {
				  content_field: 'chunk',
				  title_field: 'title',
				  url_field: "URL",
				  filepath_field: "metadata_storage_path",
				  vector_fields: ['text_vector']
			  },
			  strictness: 3,
			  in_scope: true,
			  top_n_documents: 3,
			  role_information: "tu est un assistant qui aide les notaires du cabinet de notaires Cheuvreux à trouver des documents juridiques"
			  
		  },
	  }],
	  azure_extension_options: {
		grounding_only: true
	  }},
      {headers: {'api-key': OPENAI_KEY, 'Content-Type': 'application/json' } }
    );
    // Extraire le contenu de la réponse de l'assistant
	console.log('Réponse Azure OpenAI :');
	console.log(JSON.stringify(response.data, null, 2));
    const assistantMessage = response.data.choices[0].message;
    res.json(assistantMessage);  // renvoie { role: 'assistant', content: '...'}
  } catch (err) {
    console.error("Erreur Azure OpenAI :", err.response?.data || err.message);
    res.status(500).json({ error: "Erreur lors de la requête à Azure OpenAI" });
  }
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur API démarré sur le port ${PORT}`);
});