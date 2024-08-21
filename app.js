// Fetch and display AQI data for the entered city
async function getAQI() {
    const city = document.getElementById('cityInput').value;
    const apiKey = 'e030ebb85e3e33dcf439ece63a9619ff34494b79'; // Replace with your actual API key
    const url = `https://api.waqi.info/feed/${city}/?token=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && data.status === 'ok') {
            const aqi = data.data.aqi;
            const pollutants = data.data.iaqi;
            const lastUpdate = data.data.time.s;

            const temp = data.data.iaqi.t ? data.data.iaqi.t.v : 'N/A';
            const humidity = data.data.iaqi.h ? data.data.iaqi.h.v : 'N/A';
            const wind = data.data.iaqi.w ? `${data.data.iaqi.w.v} m/s` : 'N/A';

            const aqiElement = document.getElementById('aqi');
            aqiElement.textContent = aqi;
            aqiElement.className = getAQIColorClass(aqi);

            document.getElementById('temperature').textContent = `${temp}°C`;
            document.getElementById('humidity').textContent = `${humidity}%`;
            document.getElementById('wind').textContent = wind;

            let pollutantDetails = '';
            for (const [key, value] of Object.entries(pollutants)) {
                pollutantDetails += `${key.toUpperCase()}: ${value.v}, `;
            }
            document.getElementById('pollutants').textContent = pollutantDetails.slice(0, -2);

            document.getElementById('advice').textContent = getHealthAdvice(aqi);
            document.getElementById('lastUpdate').textContent = lastUpdate;

            addRecentSearch(city);
            drawAQIChart(aqi); // Draw the chart after getting the AQI data
        } else {
            document.getElementById('result').textContent = `Could not retrieve AQI for ${city}. Please try again.`;
            console.error('API response error:', data);
        }
    } catch (error) {
        document.getElementById('result').textContent = `Error: ${error.message}`;
        console.error('Fetch error:', error);
    }
}

// Determine the color class based on AQI value
function getAQIColorClass(aqi) {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy-sg';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very-unhealthy';
    return 'hazardous';
}

// Provide health advice based on AQI
function getHealthAdvice(aqi) {
    if (aqi <= 50) return 'Air quality is good. No precautions needed.';
    if (aqi <= 100) return 'Air quality is moderate. Sensitive individuals should consider limiting outdoor activities.';
    if (aqi <= 150) return 'Unhealthy for sensitive groups. Limit prolonged outdoor exertion.';
    if (aqi <= 200) return 'Unhealthy. Everyone should limit prolonged outdoor exertion.';
    if (aqi <= 300) return 'Very Unhealthy. Avoid outdoor activities.';
    return 'Hazardous. Stay indoors and keep windows closed.';
}

// Save the recent search to local storage and update the UI
function addRecentSearch(city) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    
    if (!recentSearches.includes(city)) {
        recentSearches.push(city);
        if (recentSearches.length > 5) {
            recentSearches.shift(); // Keep only the last 5 searches
        }
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }

    updateRecentSearchesUI(recentSearches);
}

// Update the UI with the recent searches from local storage
function updateRecentSearchesUI(recentSearches) {
    const recentSearchesList = document.getElementById('recentSearches');
    recentSearchesList.innerHTML = '';
    
    recentSearches.forEach(search => {
        const listItem = document.createElement('li');
        listItem.textContent = search;
        listItem.onclick = () => {
            document.getElementById('cityInput').value = search;
            getAQI(); // Fetch AQI when a recent search is clicked
        };
        recentSearchesList.appendChild(listItem);
    });
}

// Load recent searches from local storage when the page loads
function loadRecentSearches() {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    updateRecentSearchesUI(recentSearches);
}

// Draw the AQI chart using Chart.js
function drawAQIChart(aqi) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const historicalData = generateHistoricalData(aqi);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Historical AQI',
                data: historicalData,
                fill: false,
                borderColor: getAQIColor(aqi),
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 500
                }
            }
        }
    });
}

// Simulate historical data by creating an array of AQI values
function generateHistoricalData(currentAQI) {
    const historicalData = [];
    for (let i = 0; i < 7; i++) {
        historicalData.push(currentAQI + (Math.random() * 20 - 10)); // Random fluctuations
    }
    return historicalData;
}

// Get the color for AQI based on its value
function getAQIColor(aqi) {
    if (aqi <= 50) return '#009966';
    if (aqi <= 100) return '#ffde33';
    if (aqi <= 150) return '#ff9933';
    if (aqi <= 200) return '#cc0033';
    if (aqi <= 300) return '#660099';
    return '#7e0023';
}

// Initialize the map
function initMap() {
    const map = L.map('map').setView([20.5937, 78.9629], 5); // Centered on India

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    addAQIMarkers(map);
}

// Add AQI markers to the map
// Add AQI markers to the map
async function addAQIMarkers(map) {
    const cities = ['Pune', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai'];
    const apiKey = 'e030ebb85e3e33dcf439ece63a9619ff34494b79'; // Replace with your actual API key

    for (const city of cities) {
        const url = `https://api.waqi.info/feed/${city}/?token=${apiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'ok') {
                const aqi = data.data.aqi;
                const lat = data.data.city.geo[0];
                const lng = data.data.city.geo[1];

                L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup(`<b>${city}</b><br>AQI: ${aqi}`)
                    .openPopup();
            } else {
                console.error(`Failed to retrieve AQI for ${city}: ${data.status}`);
            }
        } catch (error) {
            console.error(`Error fetching AQI data for ${city}:`, error);
        }
    }
}

// Load recent searches and initialize the map when the page loads
window.onload = function() {
    loadRecentSearches();
    initMap();
};