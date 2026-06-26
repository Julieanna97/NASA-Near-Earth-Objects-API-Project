# OrbitWatch — NASA Near Earth Object Explorer

OrbitWatch is a redesigned NASA Near Earth Object dashboard built with HTML, CSS, and vanilla JavaScript. It uses NASA's Near Earth Object API to help users explore asteroid close approaches by date range or asteroid ID.

## Live Features

- Search Near Earth Objects by date range
- Lookup a specific asteroid by ID
- View asteroid size, velocity, miss distance, and hazard status
- Inspect detailed orbital and close approach data
- Dashboard summary cards for total objects, hazardous objects, closest approach, and fastest velocity
- Saves the latest search results in localStorage
- Optional NASA API key storage in the browser
- Fully responsive glassmorphism-inspired space UI

## Technologies Used

- HTML
- CSS
- JavaScript
- NASA NeoWs API
- localStorage

## Project Structure

```txt
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── img/
    └── asteroid.png
```

## How to Run Locally

Open the project with a local server, for example using the VS Code Live Server extension.

The app uses NASA's public `DEMO_KEY` by default. You can also enter your own NASA API key in the API settings panel inside the website.

## What I Improved

This version was redesigned from a basic school project into a more polished portfolio project. The update focuses on a stronger visual presentation, better user experience, reusable JavaScript functions, clearer error handling, saved search history, and a dashboard-style layout that is easier to present to hiring managers.
