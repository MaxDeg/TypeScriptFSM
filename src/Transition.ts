
export interface TransitionConfig
{
	trigger: string;
	target: string|string[]|((...args: any[]) => string|string[]);
	condition?: (...args: any[]) => boolean;
	action?: (...args: any[]) => void;
}

export class Transition
{
	private _trigger: string;
	private _condition: (args: any[]) => boolean;  // never null
	private _action: (args: any[]) => void;  // never null
	private _target: (args: any[]) => string[][]; // multiple transition path
	
	public get trigger() { return this._trigger; }
	
	constructor(
		trigger: string, 
		target: string|string[]|((...args: any[]) => string|string[]),
		action?: (...args: any[]) => void,
		condition?: (...args: any[]) => boolean
		)
	{
		this._trigger = trigger;
		this._target = Transition.createTargetDelegate(target);
		
		this._action = action ? (args: any[]) => action.apply(this, args) : () => {};
		this._condition = condition ? (args: any[]) => condition.apply(this, args) : () => true;
	}
	
	public canExecute(args: any[]): boolean
	{
		return this._condition(args);
	}
	
	public execute(args: any[]): string[][]
	{
		if (!this.canExecute(args)) return;
		
		this._action(args);
		return this._target(args);
	}
	
	private static createTargetDelegate(target: string|string[]|((args: any[]) => string|string[]))
	{
		if (!target)
		{
			return () => [];
		}
		else if (typeof target === "string")
		{
			return () => [target.split(":")];
		}
		else if (target instanceof Array)
		{
			return () => target.map(t => t.split(":"));
		}
		else
		{
			return (args: any[]) => 
			{
				var result = (<(args: any[]) => string|string[]>target).apply(this, args);
				return typeof result === "string" ? [result.split(":")] : result.map(t => t.split(":"));
			};
		}
	}
}