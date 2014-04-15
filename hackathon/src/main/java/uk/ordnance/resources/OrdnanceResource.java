package uk.ordnance.resources;

import com.mongodb.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import uk.ordnance.OrdnanceConfiguration;
import com.codahale.metrics.annotation.Timed;
import uk.ordnance.core.GenericResponse;
import uk.ordnance.dao.OrdnanceDao;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Path("/ordnance")
@Produces(MediaType.APPLICATION_JSON)
public class OrdnanceResource {
	private static final Logger logger = LoggerFactory.getLogger(OrdnanceResource.class);

	private static final int DEFAULT_TOLERANCE = 10;

	private static final String POSTCODE_COLLECTION = "BLPU";

	private final OrdnanceConfiguration configuration;

	private final OrdnanceDao ordnanceDao;

	public OrdnanceResource(final OrdnanceConfiguration configuration) {
		this.configuration = configuration;
		this.ordnanceDao = new OrdnanceDao(configuration);
	}

	@Path("/test")
	@GET
	@Timed
	public GenericResponse fetchTestData(final @QueryParam("max") Integer max) {
		final List<DBObject> items = ordnanceDao.fetchData(POSTCODE_COLLECTION, max);
		return new GenericResponse(ordnanceDao.isNewConnection(), items);
	}

	@Path("/postcode/{postcode}")
	@GET
	@Timed
	public GenericResponse findPostcode(final @PathParam("postcode") String postcode, final @QueryParam("max") Integer max) {
		logger.info("Searching by postcode {}.", postcode);

		final BasicDBObject query = new BasicDBObject();
		query.put("POSTCODE_LOCATOR", postcode);

		final List<DBObject> items = ordnanceDao.fetchData(POSTCODE_COLLECTION, query, max);
		return new GenericResponse(ordnanceDao.isNewConnection(), items);
	}

	@Path("/location/uk/{northing}/{easting}")
	@GET
	@Timed
	public GenericResponse findLocation(final @PathParam("northing") Integer northing, final @PathParam("easting") Integer easting,
	                                    final @QueryParam("tolerance") Integer tolerance,
	                                    final @QueryParam("max") Integer max) {
		logger.info("Searching by northing {} and easting {}.", northing, easting);

		final int sanitisedTolerance = (tolerance != null && tolerance >= 0) ? tolerance : DEFAULT_TOLERANCE;

		final BasicDBObject query = new BasicDBObject();
		query.put("X_COORDINATE", new BasicDBObject("$gte", easting - sanitisedTolerance).append("$lte", easting + sanitisedTolerance));
		query.put("Y_COORDINATE", new BasicDBObject("$gte", northing - sanitisedTolerance).append("$lte", northing + sanitisedTolerance));

		final List<DBObject> items = ordnanceDao.fetchData(POSTCODE_COLLECTION, query, max);
		return new GenericResponse(ordnanceDao.isNewConnection(), items);
	}
}
