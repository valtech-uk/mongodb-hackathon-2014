$(function () {
	var map = L.map('map').setView([50.72, -3.53], 14);

	L.tileLayer('http://{s}.tiles.mapbox.com/v3/{user}.{map}/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
		maxZoom: 18,
		user: 'richtf',
		map: 'i03d1a5n'
	}).addTo(map);

	$('#search').submit(function(event) {
		var postcode = $('#postcode').val();
		postcodeSearch(postcode);
		event.preventDefault();
	});
});

function postcodeSearch(postcode) {
	$.get('http://www.ordhack.com:8080/ordnance/postcode/' + postcode.replace(' ', '%20'), function(data) {
		//$( ".result" ).html( data );
		alert('Load was performed: ' + data);
	}, 'json');
}
