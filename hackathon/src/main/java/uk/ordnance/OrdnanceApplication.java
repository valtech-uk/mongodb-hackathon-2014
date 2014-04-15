package uk.ordnance;

import io.dropwizard.Application;
import io.dropwizard.setup.Bootstrap;
import io.dropwizard.setup.Environment;
import uk.ordnance.health.MongoHealthCheck;
import uk.ordnance.resources.OrdnanceResource;

public class OrdnanceApplication extends Application<OrdnanceConfiguration> {
	public static void main(final String[] args) throws Exception {
		new OrdnanceApplication().run(args);
	}

	@Override
	public String getName() {
		return "ordnance";
	}

	@Override
	public void initialize(final Bootstrap<OrdnanceConfiguration> bootstrap) {
		// nothing to do yet
	}

	@Override
	public void run(final OrdnanceConfiguration configuration, final Environment environment) {
		final MongoHealthCheck healthCheck = new MongoHealthCheck(configuration);
		environment.healthChecks().register("mongo", healthCheck);

		final OrdnanceResource resource = new OrdnanceResource(configuration);
		environment.jersey().register(resource);
	}
}
