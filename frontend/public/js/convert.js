/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Convert lat/lon coordinates between different coordinate systems  (c) Chris Veness 2005-2014  */
/*   - www.movable-type.co.uk/scripts/coordtransform.js                                           */
/*   - www.movable-type.co.uk/scripts/latlong-convert-coords.html                                 */
/*                                                                                                */
/*  Usage: to eg convert WGS84 coordinate to OSGB coordinate:                                     */
/*   - var wgs84 = new LatLon(lat, lon, CoordTransform.datum.WGS84);                              */
/*   - var osgb = wgs84.convertDatum(CoordTransform.datum.OSGB36);                                */
/*                                                                                                */
/*  q.v. Ordnance Survey 'A guide to coordinate systems in Great Britain' Section 6               */
/*   - www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf           */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var CoordTransform = {};   // CoordTransform namespace, representing static class

// Ellipsoid parameters
CoordTransform.ellipsoid = {
	WGS84:        { a: 6378137,     b: 6356752.3142,   f: 1/298.257223563 },
	GRS80:        { a: 6378137,     b: 6356752.314140, f: 1/298.257222101 },
	Airy1830:     { a: 6377563.396, b: 6356256.909,    f: 1/299.3249646   },
	AiryModified: { a: 6377340.189, b: 6356034.448,    f: 1/299.32496     },
	Intl1924:     { a: 6378388.000, b: 6356911.946,    f: 1/297.0         },
	Bessel1841:   { a: 6377397.155, b: 6356078.963,    f: 1/299.152815351 }
};

// Datums; with associated ellipsoid and Helmert transform parameters to convert from WGS84 into
// given datum
CoordTransform.datum = {
	WGS84: {
		ellipsoid: CoordTransform.ellipsoid.WGS84,
		transform: { tx:    0.0,    ty:    0.0,     tz:    0.0,    // m
			rx:    0.0,    ry:    0.0,     rz:    0.0,    // sec
			s:    0.0 }                                  // ppm
	},
	OSGB36: { // www.ordnancesurvey.co.uk/docs/support/guide-coordinate-systems-great-britain.pdf
		ellipsoid: CoordTransform.ellipsoid.Airy1830,
		transform: { tx: -446.448,  ty:  125.157,   tz: -542.060,  // m
			rx:   -0.1502, ry:   -0.2470,  rz:   -0.8421, // sec
			s:   20.4894 }                               // ppm
	},
	ED50: { // og.decc.gov.uk/en/olgs/cms/pons_and_cop/pons/pon4/pon4.aspx
		ellipsoid: CoordTransform.ellipsoid.Intl1924,
		transform: { tx:   89.5,    ty:   93.8,     tz:  123.1,    // m
			rx:    0.0,    ry:    0.0,     rz:    0.156,  // sec
			s:   -1.2 }                                  // ppm
	},
	Irl1975: { // maps.osni.gov.uk/CMS_UserFiles/file/The_irish_grid.pdf
		ellipsoid: CoordTransform.ellipsoid.AiryModified,
		transform: { tx: -482.530,  ty:  130.596,   tz: -564.557,  // m
			rx:   -1.042,  ry:   -0.214,   rz:   -0.631,  // sec
			s:   -8.150 }                                // ppm
	},
	TokyoJapan: { // www.geocachingtoolbox.com?page=datumEllipsoidDetails
		ellipsoid: CoordTransform.ellipsoid.Bessel1841,
		transform: { tx:  148,      ty: -507,       tz: -685,      // m
			rx:    0,      ry:    0,       rz:    0,      // sec
			s:    0 }                                    // ppm
	}
};


/**
 * A LatLon (polar) point has latitude & longitude values and height, on a specified datum
 */
function LatLon(lat, lon, datum, height) {
	if (typeof height == 'undefined') height = 0;

	this.lat = lat;       // in degrees
	this.lon = lon;       // in degrees
	this.datum = datum;
	this.height = height; // height above ellipsoid in metres
}

/**
 * A cartesian point has x, y, z values (in metres)
 */
function Point(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
}


/**
 * Converts 'this' lat/lon coordinate to new coordinate system (to/from WGS84)
 */
LatLon.prototype.convertDatum = function(toDatum) {
	var oldLatLon = this;

	if (oldLatLon.datum == CoordTransform.datum.WGS84) {
		// converting from WGS84
		var transform = toDatum.transform;
	}
	if (toDatum == CoordTransform.datum.WGS84) {
		// converting to WGS84; use inverse transform (don't overwrite original!)
		var transform = {};
		for (var param in oldLatLon.datum.transform) {
			transform[param] = -oldLatLon.datum.transform[param];
		}
	}
	if (typeof transform == 'undefined') throw new Error('Can only convert to/from WGS84');

	// convert polar to cartesian
	var cartesian = oldLatLon.toCartesian();

	// apply transform
	cartesian = cartesian.helmertTransform(transform);

	// convert cartesian to polar
	var newLatLon = cartesian.toPolar(toDatum);

	return newLatLon;
}


/**
 * Converts 'this' point from polar (lat/lon) coordinates to cartesian coordinates
 */
LatLon.prototype.toCartesian = function() {
	var φ = this.lat.toRad(), λ = this.lon.toRad(), H = this.height;
	var a = this.datum.ellipsoid.a, b = this.datum.ellipsoid.b;

	var sinφ = Math.sin(φ);
	var cosφ = Math.cos(φ);
	var sinλ = Math.sin(λ);
	var cosλ = Math.cos(λ);

	var eSq = (a*a - b*b) / (a*a);
	var ν = a / Math.sqrt(1 - eSq*sinφ*sinφ);

	var x = (ν+H) * cosφ * cosλ;
	var y = (ν+H) * cosφ * sinλ;
	var z = ((1-eSq)*ν + H) * sinφ;

	var point = new Point(x, y, z);
	console.log('toCartesian', this);
	console.log('toCartesian', 'a', a, 'b', b, 'eSq', eSq, 'ν', ν);
	console.log('toCartesian', point);

	return point;
}

/**
 * Converts 'this' point from cartesian coordinates to polar (lat/lon) coordinates on specified datum
 */
Point.prototype.toPolar = function(datum) {
	var x = this.x, y = this.y, z = this.z;

	var a = datum.ellipsoid.a, b = datum.ellipsoid.b;

	var eSq = (a*a - b*b) / (a*a);
	var p = Math.sqrt(x*x + y*y);
	var phi = Math.atan2(z, p*(1-eSq)), phiP = 2*Math.PI;

	var precision = 4 / a;  // results accurate to around 4 metres
	while (Math.abs(phi-phiP) > precision) {
		ν = a / Math.sqrt(1 - eSq*Math.sin(phi)*Math.sin(phi));
		phiP = phi;
		phi = Math.atan2(z + eSq*ν*Math.sin(phi), p);
	}

	var lambda = Math.atan2(y, x);
	var H = p/Math.cos(phi) - ν;

	var point = new LatLon(phi.toDeg(), lambda.toDeg(), datum, H);
	console.log('toPolar', this);
	console.log('toPolar', 'a', a, 'b', b);
	console.log('toPolar', point);

	return point;
}

/**
 * Applies Helmert transform to 'this' point using transform parameters t
 */
Point.prototype.helmertTransform = function(t)   {
	var x1 = this.x, y1 = this.y, z1 = this.z;

	var tx = t.tx, ty = t.ty, tz = t.tz;
	var rx = (t.rx/3600).toRad();  // normalise seconds to radians
	var ry = (t.ry/3600).toRad();
	var rz = (t.rz/3600).toRad();
	var s1 = t.s/1e6 + 1;          // normalise ppm to (s+1)

	// apply transform
	var x2 = tx + x1*s1 - y1*rz + z1*ry;
	var y2 = ty + x1*rz + y1*s1 - z1*rx;
	var z2 = tz - x1*ry + y1*rx + z1*s1;

	var point = new Point(x2, y2, z2);
	console.log('helmertTransform', this);
	console.log('helmertTransform', 'tx',tx,'ty',ty,'tz',tz,'rx',rx,'ry',ry,'rz',rz,'s',s1);
	console.log('helmertTransform', point);

	return point;
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

// ---- extend Number object with methods for converting degrees/radians

/** Converts numeric degrees to radians */
if (typeof Number.prototype.toRad == 'undefined') {
	Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	}
}

/** Converts radians to numeric (signed) degrees */
if (typeof Number.prototype.toDeg == 'undefined') {
	Number.prototype.toDeg = function() {
		return this * 180 / Math.PI;
	}
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Ordnance Survey Grid Reference functions  (c) Chris Veness 2005-2014                          */
/*   - www.movable-type.co.uk/scripts/gridref.js                                                  */
/*   - www.movable-type.co.uk/scripts/latlon-gridref.html                                         */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * Creates a OsGridRef object
 *
 * @constructor
 * @param {Number} easting:  Easting in metres from OS false origin
 * @param {Number} northing: Northing in metres from OS false origin
 */
function OsGridRef(easting, northing) {
	this.easting = parseInt(easting, 10);
	this.northing = parseInt(northing, 10);
}


/**
 * Convert (OSGB36) latitude/longitude to Ordnance Survey grid reference easting/northing coordinate
 *
 * @param {LatLon} point: OSGB36 latitude/longitude
 * @return {OsGridRef} OS Grid Reference easting/northing
 */
OsGridRef.latLongToOsGrid = function(point) {
	var lat = point.lat.toRad();
	var lon = point.lon.toRad();

	var a = 6377563.396, b = 6356256.909;          // Airy 1830 major & minor semi-axes
	var F0 = 0.9996012717;                         // NatGrid scale factor on central meridian
	var lat0 = (49).toRad(), lon0 = (-2).toRad();  // NatGrid true origin is 49�N,2�W
	var N0 = -100000, E0 = 400000;                 // northing & easting of true origin, metres
	var e2 = 1 - (b*b)/(a*a);                      // eccentricity squared
	var n = (a-b)/(a+b), n2 = n*n, n3 = n*n*n;

	var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
	var nu = a*F0/Math.sqrt(1-e2*sinLat*sinLat);              // transverse radius of curvature
	var rho = a*F0*(1-e2)/Math.pow(1-e2*sinLat*sinLat, 1.5);  // meridional radius of curvature
	var eta2 = nu/rho-1;

	var Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * (lat-lat0);
	var Mb = (3*n + 3*n*n + (21/8)*n3) * Math.sin(lat-lat0) * Math.cos(lat+lat0);
	var Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*(lat-lat0)) * Math.cos(2*(lat+lat0));
	var Md = (35/24)*n3 * Math.sin(3*(lat-lat0)) * Math.cos(3*(lat+lat0));
	var M = b * F0 * (Ma - Mb + Mc - Md);              // meridional arc

	var cos3lat = cosLat*cosLat*cosLat;
	var cos5lat = cos3lat*cosLat*cosLat;
	var tan2lat = Math.tan(lat)*Math.tan(lat);
	var tan4lat = tan2lat*tan2lat;

	var I = M + N0;
	var II = (nu/2)*sinLat*cosLat;
	var III = (nu/24)*sinLat*cos3lat*(5-tan2lat+9*eta2);
	var IIIA = (nu/720)*sinLat*cos5lat*(61-58*tan2lat+tan4lat);
	var IV = nu*cosLat;
	var V = (nu/6)*cos3lat*(nu/rho-tan2lat);
	var VI = (nu/120) * cos5lat * (5 - 18*tan2lat + tan4lat + 14*eta2 - 58*tan2lat*eta2);

	var dLon = lon-lon0;
	var dLon2 = dLon*dLon, dLon3 = dLon2*dLon, dLon4 = dLon3*dLon, dLon5 = dLon4*dLon, dLon6 = dLon5*dLon;

	var N = I + II*dLon2 + III*dLon4 + IIIA*dLon6;
	var E = E0 + IV*dLon + V*dLon3 + VI*dLon5;

	return new OsGridRef(E, N);
}


/**
 * Convert Ordnance Survey grid reference easting/northing coordinate to (OSGB36) latitude/longitude
 *
 * @param {OsGridRef} easting/northing to be converted to latitude/longitude
 * @return {LatLon} latitude/longitude (in OSGB36) of supplied grid reference
 */
OsGridRef.osGridToLatLong = function(gridref) {
	var E = gridref.easting;
	var N = gridref.northing;

	var a = 6377563.396, b = 6356256.909;              // Airy 1830 major & minor semi-axes
	var F0 = 0.9996012717;                             // NatGrid scale factor on central meridian
	var lat0 = 49*Math.PI/180, lon0 = -2*Math.PI/180;  // NatGrid true origin
	var N0 = -100000, E0 = 400000;                     // northing & easting of true origin, metres
	var e2 = 1 - (b*b)/(a*a);                          // eccentricity squared
	var n = (a-b)/(a+b), n2 = n*n, n3 = n*n*n;

	var lat=lat0, M=0;
	do {
		lat = (N-N0-M)/(a*F0) + lat;

		var Ma = (1 + n + (5/4)*n2 + (5/4)*n3) * (lat-lat0);
		var Mb = (3*n + 3*n*n + (21/8)*n3) * Math.sin(lat-lat0) * Math.cos(lat+lat0);
		var Mc = ((15/8)*n2 + (15/8)*n3) * Math.sin(2*(lat-lat0)) * Math.cos(2*(lat+lat0));
		var Md = (35/24)*n3 * Math.sin(3*(lat-lat0)) * Math.cos(3*(lat+lat0));
		M = b * F0 * (Ma - Mb + Mc - Md);                // meridional arc

	} while (N-N0-M >= 0.00001);  // ie until < 0.01mm

	var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
	var nu = a*F0/Math.sqrt(1-e2*sinLat*sinLat);              // transverse radius of curvature
	var rho = a*F0*(1-e2)/Math.pow(1-e2*sinLat*sinLat, 1.5);  // meridional radius of curvature
	var eta2 = nu/rho-1;

	var tanLat = Math.tan(lat);
	var tan2lat = tanLat*tanLat, tan4lat = tan2lat*tan2lat, tan6lat = tan4lat*tan2lat;
	var secLat = 1/cosLat;
	var nu3 = nu*nu*nu, nu5 = nu3*nu*nu, nu7 = nu5*nu*nu;
	var VII = tanLat/(2*rho*nu);
	var VIII = tanLat/(24*rho*nu3)*(5+3*tan2lat+eta2-9*tan2lat*eta2);
	var IX = tanLat/(720*rho*nu5)*(61+90*tan2lat+45*tan4lat);
	var X = secLat/nu;
	var XI = secLat/(6*nu3)*(nu/rho+2*tan2lat);
	var XII = secLat/(120*nu5)*(5+28*tan2lat+24*tan4lat);
	var XIIA = secLat/(5040*nu7)*(61+662*tan2lat+1320*tan4lat+720*tan6lat);

	var dE = (E-E0), dE2 = dE*dE, dE3 = dE2*dE, dE4 = dE2*dE2, dE5 = dE3*dE2, dE6 = dE4*dE2, dE7 = dE5*dE2;
	lat = lat - VII*dE2 + VIII*dE4 - IX*dE6;
	var lon = lon0 + X*dE - XI*dE3 + XII*dE5 - XIIA*dE7;

	return new LatLon(lat.toDeg(), lon.toDeg());
}


/**
 * Converts standard grid reference ('SU387148') to fully numeric ref ([438700,114800]);
 *   returned co-ordinates are in metres, centred on supplied grid square;
 *
 * @param {String} gridref: Standard format OS grid reference
 * @returns {OsGridRef}     Numeric version of grid reference in metres from false origin
 */
OsGridRef.parse = function(gridref) {
	gridref = gridref.trim();
	// get numeric values of letter references, mapping A->0, B->1, C->2, etc:
	var l1 = gridref.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
	var l2 = gridref.toUpperCase().charCodeAt(1) - 'A'.charCodeAt(0);
	// shuffle down letters after 'I' since 'I' is not used in grid:
	if (l1 > 7) l1--;
	if (l2 > 7) l2--;

	// convert grid letters into 100km-square indexes from false origin (grid square SV):
	var e = ((l1-2)%5)*5 + (l2%5);
	var n = (19-Math.floor(l1/5)*5) - Math.floor(l2/5);
	if (e<0 || e>6 || n<0 || n>12) return new OsGridRef(NaN, NaN);

	// skip grid letters to get numeric part of ref, stripping any spaces:
	gridref = gridref.slice(2).replace(/ /g,'');

	// append numeric part of references to grid index:
	e += gridref.slice(0, gridref.length/2);
	n += gridref.slice(gridref.length/2);

	// normalise to 1m grid, rounding up to centre of grid square:
	switch (gridref.length) {
		case 0: e += '50000'; n += '50000'; break;
		case 2: e += '5000'; n += '5000'; break;
		case 4: e += '500'; n += '500'; break;
		case 6: e += '50'; n += '50'; break;
		case 8: e += '5'; n += '5'; break;
		case 10: break; // 10-digit refs are already 1m
		default: return new OsGridRef(NaN, NaN);
	}

	return new OsGridRef(e, n);
}


/**
 * Converts this numeric grid reference to standard OS grid reference
 *
 * @param {Number} [digits=6] Precision of returned grid reference (6 digits = metres)
 * @return {String)           This grid reference in standard format
 */
OsGridRef.prototype.toString = function(digits) {
	digits = (typeof digits == 'undefined') ? 10 : digits;
	e = this.easting, n = this.northing;
	if (e==NaN || n==NaN) return '??';

	// get the 100km-grid indices
	var e100k = Math.floor(e/100000), n100k = Math.floor(n/100000);

	if (e100k<0 || e100k>6 || n100k<0 || n100k>12) return '';

	// translate those into numeric equivalents of the grid letters
	var l1 = (19-n100k) - (19-n100k)%5 + Math.floor((e100k+10)/5);
	var l2 = (19-n100k)*5%25 + e100k%5;

	// compensate for skipped 'I' and build grid letter-pairs
	if (l1 > 7) l1++;
	if (l2 > 7) l2++;
	var letPair = String.fromCharCode(l1+'A'.charCodeAt(0), l2+'A'.charCodeAt(0));

	// strip 100km-grid indices from easting & northing, and reduce precision
	e = Math.floor((e%100000)/Math.pow(10,5-digits/2));
	n = Math.floor((n%100000)/Math.pow(10,5-digits/2));

	var gridRef = letPair + ' ' + e.padLz(digits/2) + ' ' + n.padLz(digits/2);

	return gridRef;
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof String.prototype.trim == 'undefined') {
	String.prototype.trim = function() {
		return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	}
}

/** Pads a number with sufficient leading zeros to make it w chars wide */
if (typeof String.prototype.padLz == 'undefined') {
	Number.prototype.padLz = function(w) {
		var n = this.toString();
		var l = n.length;
		for (var i=0; i<w-l; i++) n = '0' + n;
		return n;
	}
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
