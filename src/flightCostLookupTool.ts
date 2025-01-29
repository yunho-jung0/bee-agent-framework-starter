import {
  ToolEmitter,
  Tool,
  ToolInput,
  ToolInputValidationError,
  JSONToolOutput,
} from "bee-agent-framework/tools/base";
import { z } from "zod";
import { Emitter } from "bee-agent-framework/emitter/emitter";
import axios from "axios";

export interface FlightCostLookupResponse {
  itineraries: Itinerary[];
  legs: Leg[];
  segments: Segment[];
}

export interface Itinerary {
  id: string;
  pricing_options: PricingOption[];
}

export interface PricingOption {
  id: string;
  price: Price;
}

export interface Price {
  amount: number;
  update_status: string;
}

export interface Leg {
  id: string;
  origin_place_id: string;
  destination_place_id: string;
  departure: string; // ISO 8601 formatted date-time string
  arrival: string; // ISO 8601 formatted date-time string
}

export interface Segment {
  id: string;
  mode: string;
}

export class FlightCostLookupResponseOutput extends JSONToolOutput<FlightCostLookupResponse> {
  invalidLookup(): boolean {
    return false;
  }
}

export class FlightCostLookupTool extends Tool<FlightCostLookupResponseOutput> {
  name = "FlightCostLookup";
  description =
    "This tool will look up the cost and other information about flights you might want to book based on your details. Don't assume the missing details and ask the user for the details if missing.";

  public readonly emitter: ToolEmitter<ToolInput<this>, FlightCostLookupResponseOutput> =
    Emitter.root.child({
      namespace: ["tool", "flightCostLookup"],
      creator: this,
    });

  inputSchema() {
    return z.object({
      departure_airport_code: z.string(),
      arrival_airport_code: z.string(),
      departure_date: z.string(),
      number_of_adults: z.number(),
      number_of_children: z.number(),
      number_of_infants: z.number(),
      cabin_class: z.number(),
    });
  }

  async getData(input: ToolInput<this>): Promise<FlightCostLookupResponse | null> {
    const currency = "USD";

    const apiURL =
      "https://backend-lm-agent-lm-agent.pubfed4-ocp-7e584e106e8632fde4ff5d99d5f27ba6-0000.us-south.containers.appdomain.cloud/cost/" +
      input.departure_airport_code +
      "/" +
      input.arrival_airport_code +
      "/" +
      input.departure_date +
      "/" +
      input.number_of_adults +
      "/" +
      input.number_of_children +
      "/" +
      input.number_of_infants +
      "/" +
      input.cabin_class +
      "/" +
      currency;

    try {
      const response = await axios.get<FlightCostLookupResponse>(apiURL);
      return response.data;
    } catch (error) {
      console.error("invalid");
      return null;
    }
  }

  static {
    this.register();
  }

  protected async _run(input: ToolInput<this>): Promise<FlightCostLookupResponseOutput> {
    const status = await this.getData(input);
    if (!status) {
      throw new ToolInputValidationError(`Invalid input schema.`);
    }
    return new FlightCostLookupResponseOutput(status);
  }
}
