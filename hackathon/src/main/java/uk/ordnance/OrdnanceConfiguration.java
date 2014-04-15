package uk.ordnance;

import io.dropwizard.Configuration;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.hibernate.validator.constraints.NotEmpty;

public class OrdnanceConfiguration extends Configuration {
	@NotEmpty
	private String host;

	private Integer port;

	@NotEmpty
	private String db;

	@NotEmpty
	private String username;

	@NotEmpty
	private String password;

	@JsonProperty
	public String getHost() {
		return host;
	}

	@JsonProperty
	public void setHost(final String host) {
		this.host = host;
	}

	@JsonProperty
	public Integer getPort() {
		return port;
	}

	@JsonProperty
	public void setPort(final Integer port) {
		this.port = port;
	}

	@JsonProperty
	public String getDb() {
		return db;
	}

	@JsonProperty
	public void setDb(final String db) {
		this.db = db;
	}

	@JsonProperty
	public String getUsername() {
		return username;
	}

	@JsonProperty
	public void setUsername(final String username) {
		this.username = username;
	}

	@JsonProperty
	public String getPassword() {
		return password;
	}

	@JsonProperty
	public void setPassword(final String password) {
		this.password = password;
	}
}
