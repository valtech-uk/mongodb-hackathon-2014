$(function () {
	var map = L.map('map').setView([50.72, -3.53], 14);//14

	L.tileLayer('http://{s}.tiles.mapbox.com/v3/{user}.{map}/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
		maxZoom: 18,
		user: 'richtf',
		map: 'i03d1a5n'
	}).addTo(map);

	$('#search').submit(function(event) {
		var postcode = $('#postcode').val();
		postcodeSearch(map, postcode);
		event.preventDefault();
	});
});

function postcodeSearch(map, postcode) {
	$.get('http://www.ordhack.com:8080/ordnance/postcode/' + postcode.replace(' ', '%20'), function(data) {
		var firstMarker = null;
		var locations = data.content;
		for (var index in locations) {
			var location = locations[index];

			var coords = {
				lat: location.geometry.coordinates[1],
				lon: location.geometry.coordinates[0]
			};

			var addresses = (location.properties['LPI']) ? location.properties.LPI : [];
			var pao = addresses[0] ? addresses[0].PAO_TEXT : null;
			var sao = addresses[0] ? addresses[0].SAO_TEXT : null;
			var address = (pao && sao) ? pao + ', ' + sao : pao;
			address = (address) ? address : 'Unknown';

			var type = location.properties.POSTAL_ADDRESS;
			var typeDescription = type;
			if (type == 'S') {
				typeDescription = 'Single address';
			} else if (type == 'N') {
				typeDescription = 'Not a postal address';
			} else if (type == 'C') {
				typeDescription = 'Child address';
			} else if (type == 'M') {
				typeDescription = 'Parent address';
			}

			var marker = L.marker([coords.lat, coords.lon]).addTo(map);
			var popupHtml = '<div class="osinfo">' +
				'<span class="label">Address: </span>' + address +
				'<br/><span class="label">Occupancy: </span>' + typeDescription +
				'<br/><span class="label">Data added: </span>' + location.properties.ENTRY_DATE +
				'<br/><span class="label">Data updated: </span>' + location.properties.LAST_UPDATE_DATE +
				'</div>';
			marker.bindPopup(popupHtml);
			if (firstMarker == null) {
				firstMarker = marker;
			}
		}

		if (firstMarker != null) {
			map.setZoom(18);

			setTimeout(function() {
				firstMarker.openPopup();
			}, 500);
		}
	}, 'json');
}
