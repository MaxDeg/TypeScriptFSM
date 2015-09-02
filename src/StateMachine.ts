import { StateConfig, State } from "State";

export interface StateMachineConfig
{
	initialState?: string;
	[key: string]: StateConfig;
}

export class StateMachine
{
	private _parent: State;
	private _currentState: State;
	private _states: { [key: string]: State };
	
	constructor(parent: State, options: StateMachineConfig)
	{
		this._parent = parent;
		this._states = {};
		
		for (var stateName in (options || {}))
		{
			if (stateName == "initialState") continue;
			
			this._states[stateName] = new State(this, stateName, options[stateName]);
		}
		
		this._currentState = this._states[options.initialState || ""];
	}
	
	public init(args?: any[])
	{
		if (this._currentState)
		{
			this._currentState.enter(args || []);
		}
	}
	
	public canTrigger(transition: string, ...args: any[]): boolean
	{
		return this._canTrigger(transition.split(":"), args);
	}
	
	public trigger(transition: string, ...args: any[]): void
	{
		return this._trigger(transition.split(":"), args);
	}
	
	public handleTransitions(transitions: string[][], args: any[])
	{		
		for (var transitionPath of transitions) // should be length == 1 if parent Machine
		{
			this.handleTransition(transitionPath, args);
		}
	}
	
	public handleTransition(transitionPath: string[], args: any[]): boolean
	{		
		var newState = this._states[transitionPath[0]];
		if (newState)
		{
			this._currentState = newState;
			this._currentState.enter(args);
			
			if (transitionPath.length > 1)
			{
				return this._currentState.handleTransition(transitionPath.slice(1), args);
			}
			
			return true;
		}
		else
		{
			return this._parent.handleTransition(transitionPath, args);
		}
	}
		
	private _canTrigger(transitionPath: string[], args: any[]): boolean
	{
		return this._currentState.getTransition(transitionPath, args) != null;
	}
	
	private _trigger(transitionPath: string[], args: any[]): void
	{
		var transition = this._currentState.getTransition(transitionPath, args);
		if (transition == null) return; // Transition not found
		
		var oldState = this._currentState;
		var exitArgs = this._currentState.exit(args);
				
		this.handleTransitions(transition.execute(args), exitArgs || args);
	}
}