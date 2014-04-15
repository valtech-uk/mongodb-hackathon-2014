package uk.ordnance.dao;

import com.mongodb.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import uk.ordnance.OrdnanceConfiguration;

import java.util.ArrayList;
import java.util.List;

public class OrdnanceDao {
	private static final Logger logger = LoggerFactory.getLogger(OrdnanceDao.class);

	private static final int DEFAULT_MAX = 25;

	private final OrdnanceConfiguration configuration;

	private DB db;

	private boolean newConnection = true;

	public OrdnanceDao(final OrdnanceConfiguration configuration) {
		this.configuration = configuration;
	}

	public boolean isNewConnection() {
		return newConnection;
	}

	public List<DBObject> fetchData(final String collectionName) {
		return fetchData(collectionName, null, null);
	}

	public List<DBObject> fetchData(final String collectionName, final DBObject query){
		return fetchData(collectionName, query, null);
	}

	public List<DBObject> fetchData(final String collectionName, final Integer max){
		return fetchData(collectionName, null, max);
	}

	public List<DBObject> fetchData(final String collectionName, final DBObject query, final Integer max) {
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
