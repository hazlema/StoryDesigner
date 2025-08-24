/** Concrete iScene class with defaults */
import type { iEvent } from '$lib/classes/iEvent';

export interface iScene {
	key: string;
	text: string;
	events: iEvent[];
	connections: string[];
}

export class iScenes implements iScene {
	key: string;
	text: string;
	events: iEvent[];
	connections: string[];

	/**
	 * Create a Scene.
	 * - key: unique identifier for the scene
	 * - text: scene narrative text
	 * - events: optional array of events
	 * - connections: optional array of connection keys
	 */
	constructor(key: string, text: string, events: iEvent[] = [], connections: string[] = []) {
		this.key = key;
		this.text = text;
		this.events = events;
		this.connections = connections;
	}

	/** Add an event to the scene */
	addEvent(event: iEvent): iScenes {
		this.events.push(event);
		return this;
	}

	/** Remove an event from the scene */
	removeEvent(eventKey: string): void {
		this.events = this.events.filter(e => e.key !== eventKey);
	}

	/** Add a connection to the scene */
	addConnection(connectionKey: string): iScenes {
		if (!this.connections.includes(connectionKey)) {
			this.connections.push(connectionKey);
		}
		return this;
	}

	/** Remove a connection from the scene */
	removeConnection(connectionKey: string): void {
		this.connections = this.connections.filter(c => c !== connectionKey);
	}

	/** Update scene text */
	setText(text: string): iScenes {
		this.text = text;
		return this;
	}
}
