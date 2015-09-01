import { StateMachineConfig, StateMachine } from "StateMachine";
import { StateConfig } from "State";

export interface FiniteStateMachineConfig
{
	initialState: string;
	[key: string]: StateConfig;
}

export class FinitStateMachine extends StateMachine
{
	constructor(options: FiniteStateMachineConfig)
	{
		super(null, options);
		
		this.init();
	}
}