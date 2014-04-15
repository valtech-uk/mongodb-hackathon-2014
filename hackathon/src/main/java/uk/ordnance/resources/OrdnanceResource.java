package uk.ordnance.resources;

import com.mongodb.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import uk.ordnance.OrdnanceConfiguration;
import com.codahale.metrics.annotation.Timed;
import uk.ordnance.core.GenericResponse;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Path("/ordnance")
@Produces(MediaType.APPLICATION_JSON)
public class OrdnanceResource {
	private static final Logger logger = LoggerFactory.getLogger(OrdnanceResource.class);

	private static final int DEFAULT_MAX = 10;

	private final OrdnanceConfiguration configuration;
	private final AtomicLong counter;

	private DB db;

	private boolean newConnection = true;

	public OrdnanceResource(final OrdnanceConfiguration configuration) {
		this.configuration = configuration;
		this.counter = new AtomicLong();
	}

	@Path("/test")
	@GET
	@Timed
	public GenericResponse fetchTestData(final @QueryParam("max") Integer max) {
		final List<DBObject> items = fetchData("BLPU", max);
		return new GenericResponse(counter.incrementAndGet(), newConnection, items);
	}

	@Path("/postcode/{postcode}")
	@GET
	@Timed
	public GenericResponse findPostcode(final @PathParam("postcode") String postcode, final @QueryParam("max") Integer max) {
		logger.info("Searching by postcode {}.", postcode);

		final BasicDBObject query = new BasicDBObject();
		query.put("POSTCODE_LOCATOR", postcode);

		final List<DBObject> items = fetchData("BLPU", query, max);
		return new GenericResponse(counter.incrementAndGet(), newConnection, items);
	}

	private List<DBObject> fetchData(final String collectionName) {
		return fetchData(collectionName, null, null);
	}

	private List<DBObject> fetchData(final String collectionName, final DBObject query){
		return fetchData(collectionName, query, null);
	}

	private List<DBObject> fetchData(final String collectionName, final Integer max){
		return fetchData(collectionName, null, max);
	}

	private List<DBObject> fetchData(final String collectionName, final DBObject query, final Integer max) {
		final DB db = fetchDb();

		final DBCollection collection = db.getCollection(collectionName);

		final DBCursor itemCursor;
		if (query == null) {
			itemCursor = collection.find();
		} else {
			itemCursor = collection.find(query);
		}

		final int itemMax = (max != null && max >= 0) ? max : DEFAULT_MAX;
		final List<DBObject> items = new ArrayList<DBObject>(itemMax);
		for (int index = 0; index < itemMax && itemCursor.hasNext(); index++) {
			items.add(itemCursor.next());
		}

		return items;
	}

	private synchronized DB fetchDb() {
		if (db != null && db.isAuthenticated()) {
			newConnection = false;
			return db;
		} else {
			newConnection = true;
			db = null;
		}

		try {
			final MongoClient mongo = new MongoClient(configuration.getHost(), configuration.getPort());
			final DB tempDb = mongo.getDB(configuration.getDb());
			final boolean authenticated = tempDb.authenticate(configuration.getUsername(), configuration.getPassword().toCharArray());

			if (authenticated) {
				db = tempDb;
			} else {
				throw new IllegalStateException("Authentication failed.");
			}

			return db;
		} catch (final Exception exception) {
			throw new IllegalStateException("Database connection failed.", exception);
		}
	}
}
