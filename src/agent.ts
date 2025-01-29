import "dotenv/config.js";
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { FrameworkError } from "bee-agent-framework/errors";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";
import { OpenMeteoTool } from "bee-agent-framework/tools/weather/openMeteo";
import { getChatLLM } from "./helpers/llm.js";
import { getPrompt } from "./helpers/prompt.js";
import { WikipediaTool } from "bee-agent-framework/tools/search/wikipedia";
import { AirlineStatusTool } from "./airlineStatusTool.js";
import { FlightCostLookupTool } from "./flightCostLookupTool.js";

const llm = getChatLLM();
const agent = new BeeAgent({
  llm,
  memory: new TokenMemory({ llm }),
  tools: [new OpenMeteoTool(), new WikipediaTool(), new AirlineStatusTool(), new FlightCostLookupTool()],
});

try {
  const status_prompt = getPrompt(
    `Give me the information about flight AA777 and what is the weather at the arrival?`,
  );
  const cost_prompt_incomplete = getPrompt(
    `I want to book a flight next monday to Washington DC.`,
  );
  const cost_prompt = getPrompt(
    `I want to buy a flight next monday to Washington DC from DFW. Just for myself, economy class.`,
  );

  const prompt = status_prompt

  console.info(`User 👤 : ${prompt}`);

  const response = await agent
    .run(
      { prompt },
      {
        execution: {
          maxIterations: 8,
          maxRetriesPerStep: 3,
          totalMaxRetries: 10,
        },
      },
    )
    .observe((emitter) => {
      emitter.on("update", (data) => {
        console.info(`Agent 🤖 (${data.update.key}) : ${data.update.value}`);
      });
    });
  console.info(`Agent 🤖 : ${response.result.text}`);
} catch (error) {
  console.error(FrameworkError.ensure(error).dump());
}
