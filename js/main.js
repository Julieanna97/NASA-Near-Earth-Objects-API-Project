document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '1LcqqdnWmI8uZ06a3MzienPx1mHRzJ1ndicRaeX8';

    // Load data from localStorage when the page loads
    loadStoredData();

    // Event listener for the date-based form submission
    document.getElementById('date-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (isDateRangeValid(startDate, endDate)) {
            const apiUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${apiKey}`;
            await fetchAsteroidList(apiUrl);
            clearError();
        } else {
            displayError('The date range must be within 7 days.');
        }
    });

    // Event listener for the ID-based form submission
    document.getElementById('id-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const asteroidId = document.getElementById('asteroid-id').value;
        if (asteroidId) {
            const apiUrl = `https://api.nasa.gov/neo/rest/v1/neo/${asteroidId}?api_key=${apiKey}`;
            await lookupAsteroidById(apiUrl);
            clearError();
        } else {
            displayError('Please enter a valid asteroid ID.');
        }
    });

    // Event listener for clearing history from localStorage
    document.getElementById('clear-history').addEventListener('click', () => {
        localStorage.removeItem('asteroidHistory');
        document.getElementById('neo-container').innerHTML = '';
        document.getElementById('asteroid-details').innerHTML = '';
    });

    // Event listener for handling the back button to return to the list of asteroids
    document.addEventListener('click', (event) => {
        if (event.target.matches('.back-button')) {
            goBackToList();
        }
    });
});

// Load stored data from localStorage
function loadStoredData() {
    const storedData = JSON.parse(localStorage.getItem('asteroidHistory'));
    if (storedData) {
        displayAsteroidData(storedData);
    }
}

// Check if the start and end dates are within 7 days
function isDateRangeValid(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMs = end - start;
    const diffInDays = diffInMs / (1000 * 3600 * 24);
    return diffInDays >= 0 && diffInDays <= 7;
}

// Fetch the list of asteroids within the specified date range
async function fetchAsteroidList(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const asteroids = Object.values(data.near_earth_objects).flat();
        localStorage.setItem('asteroidHistory', JSON.stringify(asteroids));
        displayAsteroidData(asteroids);
    } catch (error) {
        displayError(`Failed to fetch data: ${error.message}`);
    }
}

// Lookup a specific asteroid by its ID
async function lookupAsteroidById(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayAsteroidDetails(data);
    } catch (error) {
        displayError(`Failed to fetch data: ${error.message}`);
    }
}

// Function to display the asteroid data on the webpage
function displayAsteroidData(asteroids) {
    const neoContainer = document.getElementById('neo-container');
    const detailsContainer = document.getElementById('asteroid-details');

    // Hide the details container when displaying the list
    detailsContainer.innerHTML = '';
    detailsContainer.style.display = 'none';

    // Show the asteroid list
    neoContainer.style.display = 'block';
    neoContainer.innerHTML = '';

    asteroids.forEach(neo => {
        const neoCard = document.createElement('div');
        neoCard.classList.add('neo-card');

        const neoName = document.createElement('h2');
        neoName.textContent = neo.name;

        const neoId = document.createElement('p');
        neoId.textContent = `Asteroid ID: ${neo.id}`;

        const neoDetails = document.createElement('p');
        neoDetails.textContent = `Diameter (meters): ${neo.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} - ${neo.estimated_diameter.meters.estimated_diameter_max.toFixed(2)}`;

        const neoHazardous = document.createElement('p');
        neoHazardous.textContent = `Potentially Hazardous: ${neo.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}`;

        const detailsLink = document.createElement('a');
        detailsLink.href = `#`;
        detailsLink.classList.add('details-link');
        detailsLink.dataset.id = neo.id;
        detailsLink.textContent = "View Details";

        neoCard.appendChild(neoName);
        neoCard.appendChild(neoId);
        neoCard.appendChild(neoDetails);
        neoCard.appendChild(neoHazardous);
        neoCard.appendChild(detailsLink);

        neoContainer.appendChild(neoCard);
    });

    // Add event listeners to the details links
    document.querySelectorAll('.details-link').forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            const asteroidId = event.target.dataset.id;
            await fetchAsteroidDetails(asteroidId);
        });
    });
}

// Fetch the details of a specific asteroid
async function fetchAsteroidDetails(asteroidId) {
    const apiKey = '1LcqqdnWmI8uZ06a3MzienPx1mHRzJ1ndicRaeX8';
    const apiUrl = `https://api.nasa.gov/neo/rest/v1/neo/${asteroidId}?api_key=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayAsteroidDetails(data);
    } catch (error) {
        displayError(`Failed to fetch data: ${error.message}`);
    }
}

// Function to display detailed information about the asteroid
function displayAsteroidDetails(neo) {
    const neoContainer = document.getElementById('neo-container');
    const detailsContainer = document.getElementById('asteroid-details');

    // Hide the asteroid list and show the details container
    neoContainer.style.display = 'none';
    detailsContainer.style.display = 'block';

    const details = `
        <h2>${neo.name}</h2>
        <p>ID: ${neo.id}</p>
        <p>Absolute Magnitude: ${neo.absolute_magnitude_h}</p>
        <p>Estimated Diameter (meters): ${neo.estimated_diameter.meters.estimated_diameter_min.toFixed(2)} - ${neo.estimated_diameter.meters.estimated_diameter_max.toFixed(2)}</p>
        <p>Potentially Hazardous: ${neo.is_potentially_hazardous_asteroid ? 'Yes' : 'No'}</p>
        <p>First Observed: ${neo.orbital_data.first_observation_date}</p>
        <p>Last Observed: ${neo.orbital_data.last_observation_date}</p>
        <p>Orbital Period (days): ${neo.orbital_data.orbital_period}</p>
        <p>Close Approach Data:</p>
        <ul>
            ${neo.close_approach_data.map(approach => `
                <li>
                    Date: ${approach.close_approach_date}
                    - Miss Distance (km): ${parseFloat(approach.miss_distance.kilometers).toFixed(2)}
                    - Velocity (km/h): ${parseFloat(approach.relative_velocity.kilometers_per_hour).toFixed(2)}
                </li>`).join('')}
        </ul>
        <button class="back-button">Back to List</button>
    `;

    detailsContainer.innerHTML = details;
}

// Display error message
function displayError(message) {
    const errorElement = document.getElementById('error-container');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Clear the error message
function clearError() {
    const errorElement = document.getElementById('error-container'); // Correct the element ID here
    if (errorElement) {
        errorElement.style.display = 'none';
    } else {
        console.warn('Error element not found.');
    }
}

// Go back to the list of asteroids
function goBackToList() {
    document.getElementById('neo-container').style.display = 'block';
    document.getElementById('asteroid-details').style.display = 'none';
}
