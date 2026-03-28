let map;
let directionsService;
let directionsRenderer;
let userMarker;
const markers = [];
const locations = [
    { name: "VIT Main Building", lat: 12.9716, lng: 79.1594 },
    { name: "Silver Jubilee Tower", lat: 12.971294486533557, lng: 79.16394467011594 },
    { name: "Technology Tower", lat: 12.9712, lng: 79.1551 },
    { name: "Men's Hostel Block A", lat: 12.9732, lng: 79.1618 },
    { name: "Women's Hostel Block  A & B", lat: 12.968273263924143, lng: 79.15846586095512 },
    { name: "VIT Lawn", lat: 12.9725, lng: 79.1604 },
    { name: "Foody", lat: 12.969532835054125, lng: 79.15834889561786,
      description: "Popular food court near Men's Hostel" },
    { name: "Kalpana Chawla Ground", lat: 12.968601432489303, lng: 79.15666276678166,
      description: "Recreational area and Park to hangout" },
    { name: "DC (Darling Canteen)", lat: 12.969706, lng: 79.154975,
      description: "Popular canteen near academic blocks" }
];

// Update the HTML sidebar to include new locations
const recentLocations = [
    "VIT Main Building",
    "Silver Jubilee Tower",
    "Technology Tower",
    "Men's Hostel Block A",
    "Women's Hostel Block A&B",
    "VIT Lawn",
    "Foody",
    "Kalpana Chawla Ground",
    "DC (Darling Canteen)"
];

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 12.9716, lng: 79.1594 },
        zoom: 16,
    });

    // Initialize Directions Service and Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Autocomplete search bar setup
    const autocomplete = new google.maps.places.Autocomplete(document.getElementById("search"));
    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            alert("No details available for this location.");
            return;
        }

        map.setCenter(place.geometry.location);
        map.setZoom(15);

        // Display the route from the user's current location to the searched place
        if (userMarker) {
            calculateAndDisplayRoute(place.geometry.location);
        }
    });

    // Add markers for each location
    locations.forEach((location, index) => {
        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.name,
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<h3>${location.name}</h3>${location.description ? `<p>${location.description}</p>` : ''}`,
        });

        marker.addListener("click", () => {
            map.setCenter(marker.getPosition());
            infoWindow.open(map, marker);
            if (userMarker) {
                calculateAndDisplayRoute(marker.getPosition());
            }
        });

        markers.push(marker);
    });

    // Geolocation to find user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: "Your Location",
                    icon: {
                        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    },
                });

                map.setCenter(userLocation);
            },
            () => alert("Geolocation service failed.")
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function focusLocation(index) {
    const destination = { lat: locations[index].lat, lng: locations[index].lng };

    if (userMarker && userMarker.getPosition()) {
        calculateAndDisplayRoute(destination);
    } else {
        map.setCenter(destination);
        map.setZoom(17);
    }
}

function calculateAndDisplayRoute(destination) {
    const request = {
        origin: userMarker.getPosition(),
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
        } else {
            alert("Could not display directions due to: " + status);
        }
    });
}

// Update the HTML to show new locations
document.addEventListener('DOMContentLoaded', function() {
    const recentsDiv = document.querySelector('.recents');
    let locationsHTML = '<h2>Recents:</h2>';
    recentLocations.forEach((location, index) => {
        locationsHTML += `<div class="location" onclick="focusLocation(${index})">${location}</div>`;
    });
    recentsDiv.innerHTML = locationsHTML;
});
