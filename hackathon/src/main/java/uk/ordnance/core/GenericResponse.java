package uk.ordnance.core;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GenericResponse {
	private long id;

	private boolean newConnection;

	private Object content;

	public GenericResponse() {
		// Jackson deserialization
	}

	public GenericResponse(final long id, final boolean newConnection, final Object content) {
		this.id = id;
		this.newConnection = newConnection;
		this.content = content;
	}

	@JsonProperty
	public long getId() {
		return id;
	}

	@JsonProperty
	public boolean isNewConnection() {
		return newConnection;
	}

	@JsonProperty
	public Object getContent() {
		return content;
	}
}
