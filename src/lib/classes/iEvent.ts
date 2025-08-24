export interface iEvent {
	key: string;
	event: 'autostart' | 'after';
	source: string;  // Event Key
	media: string;
	attributes: Record<string, any>;
}

/** Concrete iEvent class with defaults */
export class iEvents implements iEvent {
	key: string;
	event: 'autostart' | 'after';
	source: string;
	media: string;
	attributes: Record<string, any>;

	/**
	 * Create an Event.
	 * - key: unique identifier for the event
	 * - event: event type ('autostart' or 'after')
	 * - source: source event key
	 * - media: media reference
	 * - attributes: optional event attributes
	 */
	constructor(key: string, event: 'autostart' | 'after', source: string, media: string, attributes: Record<string, any> = {}) {
		this.key = key;
		this.event = event;
		this.source = source;
		this.media = media;
		this.attributes = attributes;
	}

	/** Set event attributes */
	setAttributes(attributes: Record<string, any>): iEvents {
		this.attributes = attributes;
		return this;
	}

	/** Add a single attribute */
	setAttribute(key: string, value: any): iEvents {
		this.attributes[key] = value;
		return this;
	}

	/** Get an attribute value */
	getAttribute(key: string): any {
		return this.attributes[key];
	}

	/** Remove an attribute */
	removeAttribute(key: string): iEvents {
		delete this.attributes[key];
		return this;
	}
}
