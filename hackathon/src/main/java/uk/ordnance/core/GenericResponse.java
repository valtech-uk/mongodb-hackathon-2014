package uk.ordnance.core;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

public class GenericResponse {
	private static final AtomicLong RESPONSE_COUNTER = new AtomicLong();

	private long responseId;

	private boolean newConnection;

	private Object content;

	private long size;

	public GenericResponse() {
		// Jackson deserialization
	}

	public GenericResponse(final boolean newConnection, final List<?> content) {
		this(newConnection, content, content.size());
	}

	public GenericResponse(final boolean newConnection, final Object content, final long size) {
		this.responseId = RESPONSE_COUNTER.incrementAndGet();
		this.newConnection = newConnection;
		this.content = content;
		this.size = size;
	}

	@JsonProperty
	public long getResponseId() {
		return responseId;
	}

	@JsonProperty
	public boolean isNewConnection() {
		return newConnection;
	}

	@JsonProperty
	public Object getContent() {
		return content;
	}

	@JsonProperty
	public long getSize() {
		return size;
	}
}
