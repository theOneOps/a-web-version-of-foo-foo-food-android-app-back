import { config } from "dotenv";

config();
import { Mistral } from "@mistralai/mistralai";

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey: apiKey });

const agent_id = process.env.AGENT_ID

/**
 * 
 * **Explanation**
 *  
 * ***it's a mistral agent*** created to get **the nearest country** to an entree *(country)* from *an array full of others countries.*
 * 
 * The agent responded with a string in JSON formated like we told it to.
 * 
 * For example : with inputs like this given as parameters to the getChatResponse's function: ```"nancy", ['chicoutimi', 'montreal', 'paris', "poitiers", "tours"]```
 * 
 * the agent gives us : 
 *  ```json
{
  "ville": "tours",
  "description": "Tours est la ville la plus proche géographiquement de Nancy parmi les villes listées dans 'popularVilles'. Tours est à environ 400 kilomètres de Nancy, tandis que Poitiers est à environ 500 kilomètres, Paris est à environ 300 kilomètres, Montréal est à environ 5500 kilomètres et Chicoutimi est à environ 5700 kilomètres."
}
```

  All we need to do **next**, is to *filter the response to retrieve* the relevant information.

 @important By the way, we are using the Mistral Large 2 model. it's far the most successful one until now !
 * 
 */
async function getChatResponse(entree, testCountries) {
  try {
    const chatResponse = await client.agents.complete({
      agentId: agent_id, // propriété 'agentId' et non 'agent_id' comme dans leur documentation
      messages: [
        {
          "role": "user",
          "content": `entree: ${entree} ;popularVilles: ${String(testCountries)}`,
        },
      ],
    });
    const responseChat = JSON.parse(chatResponse.choices[0].message.content
      .replace(/```json/g, "")
    .replace(/```/g, "").trim()
      )
    console.log(responseChat)
    if (responseChat)
    {
      console.log(`la ville recherchee est ${responseChat.ville} \n`)
      console.log(`la raison de ce choix : ${responseChat['description']}`)
    }
    else
      console.log(responseChat)
  } catch (error) {
    console.error("Error:", error);
  }
}

getChatResponse("nancy", ['chicoutimi', 'montreal', 'paris', "poitiers", "tours"]);


