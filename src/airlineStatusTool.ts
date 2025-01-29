import {
  ToolEmitter,
  Tool,
  ToolInput,
  ToolInputValidationError,
  JSONToolOutput,
} from "bee-agent-framework/tools/base";
import { z } from "zod";
import { Emitter } from "bee-agent-framework/emitter/emitter";
import axios from 'axios'

export interface AirlineResponse {
  ident: string;
  ident_icao: string;
  ident_iata: string;
  actual_runway_off: string;
  actual_runway_on: string;
  fa_flight_id: string;
  operator: string;
  operator_icao: string;
  operator_iata: string;
  flight_number: string;
  registration: string;
  atc_ident: string;
  inbound_fa_flight_id: string;
  codeshares: string[];
  codeshares_iata: string[];
  blocked: boolean;
  diverted: boolean;
  cancelled: boolean;
  position_only: boolean;
  origin: AirportDetails;
  destination: AirportDetails;
  departure_delay: number;
  arrival_delay: number;
  filed_ete: number;
  progress_percent: number;
  status: "Scheduled" | "Departed" | "Arrived" | "Delayed" | "Cancelled";
  aircraft_type: string;
  route_distance: number;
  filed_airspeed: number;
  filed_altitude: number;
  route: string;
  baggage_claim: string;
  seats_cabin_business: number;
  seats_cabin_coach: number;
  seats_cabin_first: number;
  gate_origin: string;
  gate_destination: string;
  terminal_origin: string;
  terminal_destination: string;
  type: "Commercial" | "General_Aviation" | "Cargo";
  scheduled_out: string;
  estimated_out: string;
  actual_out: string;
  scheduled_off: string;
  estimated_off: string;
  actual_off: string;
  scheduled_on: string;
  estimated_on: string;
  actual_on: string;
  scheduled_in: string;
  estimated_in: string;
  actual_in: string;
  foresight_predictions_available: boolean;
}

export interface AirportDetails {
  code: string;
  code_icao: string;
  code_iata: string;
  code_lid: string;
  timezone: string;
  name: string;
  city: string;
  airport_info_url: string;
}

export class AirlineResponseOutput extends JSONToolOutput<AirlineResponse> {
  isNotFound(): boolean {
    return false;
  }
}

export class AirlineStatusTool extends Tool<AirlineResponseOutput> {
  name = "AirlineStatus";
  description =
    "If you provide the flight identificaiton, this tool will return the fligh status and destination info";

  public readonly emitter: ToolEmitter<ToolInput<this>, AirlineResponseOutput> = Emitter.root.child(
    {
      namespace: ["tool", "airlineStatus"],
      creator: this,
    },
  );

  inputSchema() {
    return z.object({
      ident: z.string(),
    });
  }

  async getData(ident: string): Promise<AirlineResponse | null> {
    const apiURL = "https://backend-lm-agent-lm-agent.pubfed4-ocp-7e584e106e8632fde4ff5d99d5f27ba6-0000.us-south.containers.appdomain.cloud/flights/" + ident;

    try {
      const response = await axios.get<AirlineResponse>(apiURL)
      return response.data
    } catch (error) {
      console.error("invalid")
      return null
    }
  }

  static {
    this.register();
  }

  protected async _run(input: ToolInput<this>): Promise<AirlineResponseOutput> {
    const status = await this.getData(input.ident)
    if (!status) {
      throw new ToolInputValidationError(`(${input.ident}) does not exist!`);
    }
    return new AirlineResponseOutput(status);
  }
}
