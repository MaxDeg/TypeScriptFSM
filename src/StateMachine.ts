import { StateConfig, State } from "State";
import { Transition } from "Transition";

export interface StateMachineConfig
{
	initialState?: string;
	[key: string]: StateConfig;
}

export class StateMachine
{
	private _parent: State;
	private _initialState: string;
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
		
		this._initialState = options.initialState;
		this._currentState = null;
	}
	
	/// -------------------------------------------
	/// Public methods
	/// -------------------------------------------
	public addRegion(target: string, name: string, options: StateMachineConfig)
	{
		this._addRegion(target.split(":"), name, options)
	}
	
	public isInState(stateName: string)
	{
		var statePath = stateName.split(":");

		return this._currentState.name == statePath[0];
	}
	
	public canTrigger(transition: string, ...args: any[]): boolean
	{
		return this._hasTransition(transition.split(":"), args);
	}
	
	public trigger(transition: string, ...args: any[]): void
	{
		this._trigger(transition.split(":"), args);
	}
	
	/// -------------------------------------------
	/// Internal methods
	/// -------------------------------------------
	public _init(args?: any[])
	{
		if (this._initialState)
		{
			this._currentState = this._states[this._initialState];
			this._currentState.enter(null, args || []);
		}
	}
	
	public _addRegion(targetPath: string[], name: string, options: StateMachineConfig)
	{
		this._states[targetPath[0]]._addRegion(targetPath.slice(1), name, options);
	}
	
	public _hasTransition(transitionPath: string[], args: any[]) : boolean
	{
		return this._currentState != null && this._currentState._hasTransition(transitionPath, args);
	}
		
	public _handleTransition(transitionPath: string[], targetPath: string[], args: any[]): boolean
	{		
		var newState = this._states[targetPath[0]];
		if (newState)
		{
			var exitArgs = this._currentState ? this._currentState.exit(args) : null;
			
			this._currentState = newState;
			this._currentState.enter(transitionPath, exitArgs || args);
			
			if (targetPath.length > 1)
			{
				return this._currentState._handleTransition(transitionPath, targetPath.slice(1), args);
			}
			
			return true;
		}
		
		return this._parent != null && this._parent._handleTransition(transitionPath, targetPath, args);
	}
		
	public _trigger(transitionPath: string[], args: any[]): Transition[]
	{
		for (var transition of this._currentState._trigger(transitionPath, args))
		{			
			for (var targetPath of transition.execute(args)) 
			{
				this._currentState._handleTransition(transitionPath, targetPath, args);
			}
		}
		
		return [];
	}
}