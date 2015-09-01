import { TransitionConfig, Transition } from "Transition";
import { StateMachineConfig, StateMachine } from "StateMachine";

export interface StateConfig
{
	onEnter?: (...args: any[]) => void;
	onExit?: (...args: any[]) => any[];
	transitions?: TransitionConfig[];
	regions?: { [key: string]: StateMachineConfig };
}

export class State
{
	private _parent: StateMachine;
	private _name: string;
	private _onEnter: (args: any[]) => void; // never null || Could return a transition to execute (!!!promise!!!)
	private _onExit: (args: any[]) => any[]; // never null
	private _transitions: Transition[];
	private _regions: { [key: string]: StateMachine }
	
	constructor(
		parent: StateMachine,
		name: string,
		options: StateConfig)
	{
		this._parent = parent;
		this._name = name;
		
		this._onEnter = options.onEnter ? (args: any[]) => options.onEnter.apply(this, args) : (args: any[]) => {};
		this._onExit = options.onExit ? (args: any[]) => options.onExit.apply(this, args) : (args: any[]) => args;
		
		this._transitions = new Array();
		for (var transition of (options.transitions || []))
		{
			this._transitions.push(
				new Transition(
					transition.trigger, transition.target,
					transition.action, transition.condition));
		}
		
		this._regions = {};
		for (var regionName in (options.regions || {}))
		{
			this._regions[regionName] = new StateMachine(this, options.regions[regionName]);
		}
	}
	
	public addRegion(name: string, options: StateMachineConfig)
	{
		this._regions[name] = new StateMachine(this, options);
	}
	
	public getTransition(transitionPath: string[], args: any[]) : Transition
	{
		if (transitionPath.length == 1)
		{
			for (var transition of this._transitions.filter(t => t.trigger == transitionPath[0]))
			{
				if (transition.canExecute(args))
				{
					return transition;
				}
			}
			
			return null;
		}
		else
		{
			return null;
		}
	}
	
	public enter(args: any[])
	{
		this._onEnter(args);
		
		// enter in regions
		for (var region in this._regions)
		{
			this._regions[region].init(args);
		}
	}
	
	public exit(args: any[]): any[]
	{
		return this._onExit(args);
	}
	
	public handleTransitions(transitionsPath: string[][], args: any[])
	{
		var parentTransitions: string[][] = new Array();
		var regionTransitions: { [key: string]: string[][] } = {};
		
		for (var transitionPath of transitionsPath) // should be length == 1 if parent Machine
		{
			this.handleTransition(transitionPath, args);
		}
	}
	
	public handleTransition(transitionPath: string[], args: any[]): boolean
	{		
		if (transitionPath.length == 1)
		{
			return this._parent.handleTransition(transitionPath, args);
		}
		else
		{
			// look in regions
			var region = this._regions[transitionPath[0]];
			if (region)
			{
				return region.handleTransition(transitionPath, args);
			}
			
			return false;
		}
	}
}