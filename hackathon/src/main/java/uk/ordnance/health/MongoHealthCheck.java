package uk.ordnance.health;

import com.codahale.metrics.health.HealthCheck;
import com.mongodb.DB;
import com.mongodb.MongoClient;
import uk.ordnance.OrdnanceConfiguration;

public class MongoHealthCheck extends HealthCheck {
	private final OrdnanceConfiguration configuration;

	public MongoHealthCheck(final OrdnanceConfiguration configuration) {
		this.configuration = configuration;
	}

	@Override
	protected Result check() throws Exception {
		try {
			final MongoClient mongo = new MongoClient(configuration.getHost(), configuration.getPort());
			final DB db = mongo.getDB(configuration.getDb());
			final boolean authenticated = db.authenticate(configuration.getUsername(), configuration.getPassword().toCharArray());

			if (authenticated) {
				return Result.healthy();
			} else {
				return Result.unhealthy("Authentication failed");
			}
		} catch (final Exception exception) {
			return Result.unhealthy("Connection failed: " + exception);
		}
	}
}
