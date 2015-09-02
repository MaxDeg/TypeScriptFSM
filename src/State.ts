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
	private _onEnter: (transitionName: string, args: any[]) => void; // never null || Could return a transition to execute (!!!promise!!!)
	private _onExit: (args: any[]) => any[]; // never null
	private _transitions: Transition[];
	private _regions: { [key: string]: StateMachine }
	
	public get name() { return this._name; }
	
	constructor(
		parent: StateMachine,
		name: string,
		options: StateConfig)
	{
		this._parent = parent;
		this._name = name;
		
		this._onEnter = options.onEnter ? 
							(transitionName: string, args: any[]) => options.onEnter.apply(this, [transitionName].concat(args)) : 
							(transitionName: string, args: any[]) => {};
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
	
	public addRegion(targetPath: string[], name: string, options: StateMachineConfig)
	{
		if (targetPath.length == 0)
		{
			this._regions[name] = new StateMachine(this, options);
		}
		else
		{
			this._regions[targetPath[0]]._addRegion(targetPath.slice(1), name, options);
		}
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
	
	public enter(transitionPath: string[], args: any[])
	{
		this._onEnter((transitionPath || []).join(":"), args);
		
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
	
	public handleTransitions(transitionPath: string[], targetsPath: string[][], args: any[])
	{		
		for (var targetPath of targetsPath) // should be length == 1 if parent Machine
		{
			this.handleTransition(transitionPath, targetPath, args);
		}
	}
	
	public handleTransition(transitionPath: string[], targetPath: string[], args: any[]): boolean
	{		
		if (targetPath.length == 1)
		{
			return this._parent.handleTransition(transitionPath, targetPath.slice(1), args);
		}
		else
		{
			// look in regions
			var region = this._regions[targetPath[0]];
			if (region)
			{
				return region.handleTransition(transitionPath, targetPath.slice(1), args);
			}
			
			return false;
		}
	}
}