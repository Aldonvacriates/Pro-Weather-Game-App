// --- Common Elements & API Key ---
const apiKey = "52da096ed7ec999aaed4554e8d24fd0f"; // Keep your API key secret!

// --- Navigation ---
const navLinks = document.querySelectorAll(".nav-links a");
const contentSections = document.querySelectorAll(".content-section");

function setActiveSection(sectionIdToShow) {
    contentSections.forEach(section => {
        section.classList.remove("active-section");
    });
    document.getElementById(sectionIdToShow).classList.add("active-section");

    navLinks.forEach(link => {
        link.classList.remove('active-nav-link');
        if (link.dataset.section === sectionIdToShow.replace('-section', '')) {
            link.classList.add('active-nav-link');
        }
    });

    if (sectionIdToShow === "game-section" && !weatherGameActive) {
        startTempGuessGame();
    }
}

navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetSectionId = e.target.dataset.section + "-section";
        setActiveSection(targetSectionId);
    });
});

// --- Weather App ---
const weatherForm = document.querySelector(".weatherForm");
const cityInputWeather = document.getElementById("cityInputWeather");
const weatherCard = document.querySelector(".weather-card"); // Specific class for weather card

weatherForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInputWeather.value;

  if (city) {
    try {
      weatherCard.innerHTML = "<p>Loading...</p>";
      weatherCard.style.display = "flex";
      weatherCard.style.justifyContent = "center";
      weatherCard.style.alignItems = "center";

      const weatherData = await getWeatherData(city);
      displayWeatherInfo(weatherData);
    } catch (error) {
      console.error(error);
      displayError(error.message || "Could not fetch weather data.");
    }
  } else {
    displayError("Please enter a city name.");
  }
});

async function getWeatherData(city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    if (response.status === 404) throw new Error("City not found. Please check the spelling.");
    if (response.status === 401) throw new Error("Invalid API Key. Please check your key.");
    throw new Error(`API Error: ${response.statusText} (Code: ${response.status})`);
  }
  return await response.json();
}

function displayWeatherInfo(data) {
  const {
    name: city,
    main: { temp, humidity, feels_like, temp_min, temp_max, pressure },
    weather: [{ description, icon: weatherIconCode }],
    wind: { speed: windSpeed, deg: windDeg },
    sys: { sunrise, sunset, country },
    visibility,
    clouds: { all: cloudiness },
    timezone
  } = data;

  weatherCard.textContent = "";
  weatherCard.style.display = "flex"; // Keep flex for main-info and details-grid alignment
  weatherCard.style.flexDirection = "column";


  const mainInfoDiv = document.createElement("div");
  mainInfoDiv.classList.add("main-info");

  const cityDisplay = document.createElement("h1");
  cityDisplay.textContent = `${city}, ${country}`;
  cityDisplay.classList.add("cityDisplay");

  const weatherImg = document.createElement("img");
  weatherImg.src = `https://openweathermap.org/img/wn/${weatherIconCode}@4x.png`;
  weatherImg.alt = description;
  weatherImg.classList.add("weatherEmoji");
  
  const tempDisplay = document.createElement("p");
  tempDisplay.textContent = `${temp.toFixed(1)}°C`;
  tempDisplay.classList.add("tempDisplay");

  const descDisplay = document.createElement("p");
  descDisplay.textContent = description;
  descDisplay.classList.add("descDisplay");

  mainInfoDiv.appendChild(cityDisplay);
  mainInfoDiv.appendChild(weatherImg);
  mainInfoDiv.appendChild(tempDisplay);
  mainInfoDiv.appendChild(descDisplay);

  const detailsDiv = document.createElement("div");
  detailsDiv.classList.add("details-grid");

  detailsDiv.appendChild(createDetailItem("Feels Like", `${feels_like.toFixed(1)}°C`));
  detailsDiv.appendChild(createDetailItem("Humidity", `${humidity}%`));
  detailsDiv.appendChild(createDetailItem("Wind", `${(windSpeed * 3.6).toFixed(1)} km/h ${getWindDirection(windDeg)}`));
  detailsDiv.appendChild(createDetailItem("Min/Max Temp", `${temp_min.toFixed(1)}°C / ${temp_max.toFixed(1)}°C`));
  detailsDiv.appendChild(createDetailItem("Sunrise", formatTime(sunrise, timezone)));
  detailsDiv.appendChild(createDetailItem("Sunset", formatTime(sunset, timezone)));
  detailsDiv.appendChild(createDetailItem("Pressure", `${pressure} hPa`));
  detailsDiv.appendChild(createDetailItem("Visibility", `${(visibility / 1000).toFixed(1)} km`));
  detailsDiv.appendChild(createDetailItem("Cloudiness", `${cloudiness}%`));
  detailsDiv.appendChild(createDetailItem("Temp (F)", `${((temp * 9/5) + 32).toFixed(1)}°F`));

  weatherCard.appendChild(mainInfoDiv);
  weatherCard.appendChild(detailsDiv);
}

function createDetailItem(label, value) {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("detail-item");
    const labelP = document.createElement("p");
    labelP.textContent = label;
    labelP.classList.add("detail-label");
    const valueP = document.createElement("p");
    valueP.textContent = value;
    valueP.classList.add("detail-value");
    itemDiv.appendChild(labelP);
    itemDiv.appendChild(valueP);
    return itemDiv;
}

function formatTime(unixTimestamp, timezoneOffsetSeconds) {
    const date = new Date((unixTimestamp + timezoneOffsetSeconds) * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((degrees % 360) / 22.5) % 16; // Ensure degrees is within 0-359
    return directions[index];
}

function displayError(message) {
  weatherCard.textContent = "";
  weatherCard.style.display = "flex";
  weatherCard.style.flexDirection = "column";
  weatherCard.style.justifyContent = "center";
  weatherCard.style.alignItems = "center";
  const errorDisplay = document.createElement("p");
  errorDisplay.textContent = message;
  errorDisplay.classList.add("errorDisplay");
  weatherCard.appendChild(errorDisplay);
}

// --- Guess the Temperature Game ---
const tempGuessInput = document.getElementById("tempGuessInput");
const tempGuessButton = document.getElementById("tempGuessButton");
const gameFeedback = document.getElementById("gameFeedback");
const gameAttemptsLeftDisplay = document.getElementById("gameAttemptsLeft");
const newTempGameButton = document.getElementById("newTempGameButton");

const clueWeatherDesc = document.getElementById("clueWeatherDesc");
const clueWeatherIcon = document.getElementById("clueWeatherIcon");
const clueHumidity = document.getElementById("clueHumidity");
const clueWind = document.getElementById("clueWind");
const clueCountry = document.getElementById("clueCountry");
const gameAnswerArea = document.getElementById("gameAnswerArea");
const answerCityName = document.getElementById("answerCityName");
const answerActualTemp = document.getElementById("answerActualTemp");

const gameCities = ["London", "Paris", "New York", "Tokyo", "Berlin", "Moscow", "Sydney", "Cairo", "Rio de Janeiro", "Beijing", "Rome", "Madrid", "Toronto", "Dubai", "Singapore", "Mumbai", "Mexico City", "Buenos Aires", "Lagos", "Istanbul"];
let gameTargetCityData;
let gameTargetTemp;
let gameAttempts;
const gameMaxAttempts = 5;
let weatherGameActive = false;

async function startTempGuessGame() {
    weatherGameActive = true;
    gameAttempts = gameMaxAttempts;
    
    tempGuessInput.disabled = true; // Disable input while fetching
    tempGuessButton.disabled = true;
    newTempGameButton.style.display = "none";
    gameAnswerArea.style.display = "none";
    gameFeedback.textContent = "Picking a secret city...";
    gameFeedback.className = "game-feedback-message info";
    clueWeatherIcon.style.display = "none"; // Hide icon initially


    try {
        const randomCityName = gameCities[Math.floor(Math.random() * gameCities.length)];
        gameTargetCityData = await getWeatherData(randomCityName);
        gameTargetTemp = parseFloat(gameTargetCityData.main.temp.toFixed(1)); // Store with one decimal

        clueWeatherDesc.textContent = gameTargetCityData.weather[0].description;
        if (gameTargetCityData.weather[0].icon) {
            clueWeatherIcon.src = `https://openweathermap.org/img/wn/${gameTargetCityData.weather[0].icon}@2x.png`;
            clueWeatherIcon.alt = gameTargetCityData.weather[0].description;
            clueWeatherIcon.style.display = "inline-block";
        }
        clueHumidity.textContent = gameTargetCityData.main.humidity;
        clueWind.textContent = (gameTargetCityData.wind.speed * 3.6).toFixed(1);
        clueCountry.textContent = gameTargetCityData.sys.country || "N/A";

        gameFeedback.textContent = "I've picked a city. Guess its temperature (°C)!";
        tempGuessInput.disabled = false;
        tempGuessButton.disabled = false;
        tempGuessInput.value = "";
        tempGuessInput.focus();

    } catch (error) {
        console.error("Game Error:", error);
        gameFeedback.textContent = "Oops! Couldn't set up the game. Try again later.";
        gameFeedback.className = "game-feedback-message lose"; // Use 'lose' style for error
        weatherGameActive = false; // Allow trying to start again if error
        newTempGameButton.style.display = "inline-block"; // Show play again
    }
    updateGameAttemptsDisplay();
}

function handleTempGuess() {
    if (!weatherGameActive) return;

    const userGuess = parseFloat(tempGuessInput.value);

    if (isNaN(userGuess)) {
        gameFeedback.textContent = "Please enter a valid number for temperature.";
        gameFeedback.className = "game-feedback-message info";
        tempGuessInput.value = "";
        return;
    }

    gameAttempts--;
    updateGameAttemptsDisplay();

    const diff = Math.abs(userGuess - gameTargetTemp);

    if (userGuess === gameTargetTemp) {
        gameFeedback.textContent = `Spot on! The temperature is ${gameTargetTemp}°C.`;
        gameFeedback.className = "game-feedback-message win";
        endTempGuessGame(true);
    } else if (diff <= 1) {
        gameFeedback.textContent = `Very close! (${userGuess > gameTargetTemp ? 'Slightly high' : 'Slightly low'})`;
        gameFeedback.className = `game-feedback-message ${userGuess > gameTargetTemp ? 'warm' : 'cold'}`;
    } else if (diff <= 3) {
        gameFeedback.textContent = `Getting warmer... or colder! (${userGuess > gameTargetTemp ? 'A bit high' : 'A bit low'})`;
         gameFeedback.className = `game-feedback-message ${userGuess > gameTargetTemp ? 'warm' : 'cold'}`;
    } else {
        gameFeedback.textContent = `Not quite. (${userGuess > gameTargetTemp ? 'Too high' : 'Too low'})`;
         gameFeedback.className = `game-feedback-message ${userGuess > gameTargetTemp ? 'warm' : 'cold'}`;
    }

    if (gameAttempts === 0 && userGuess !== gameTargetTemp) {
        gameFeedback.textContent = `Out of attempts! The temperature was ${gameTargetTemp}°C.`;
        gameFeedback.className = "game-feedback-message lose";
        endTempGuessGame(false);
    }
    
    tempGuessInput.value = "";
    tempGuessInput.focus();
}

function endTempGuessGame(won) {
    weatherGameActive = false;
    tempGuessInput.disabled = true;
    tempGuessButton.disabled = true;
    newTempGameButton.style.display = "inline-block";

    answerCityName.textContent = gameTargetCityData.name;
    answerActualTemp.textContent = gameTargetTemp.toFixed(1);
    gameAnswerArea.style.display = "block";

    if (won) {
        // Already handled by win condition in handleTempGuess
    } else {
        // Feedback already set if lost by attempts
    }
}

function updateGameAttemptsDisplay() {
    gameAttemptsLeftDisplay.textContent = `Attempts left: ${gameAttempts}`;
}

tempGuessButton.addEventListener("click", handleTempGuess);
tempGuessInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        handleTempGuess();
    }
});
newTempGameButton.addEventListener("click", startTempGuessGame);


// --- Initial Setup ---
document.addEventListener("DOMContentLoaded", () => {
    setActiveSection("weather-section"); // Show weather section by default
});