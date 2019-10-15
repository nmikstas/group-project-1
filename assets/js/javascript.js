/********************************************* Top Level *********************************************/
//Open weather map configuration.
var APIKey = "&appid=d5f51a9178707bac39e924f49cc67915";
var baseURL = "https://api.openweathermap.org/data/2.5/weather?";

//Firebase configuration.
var firebaseConfig =
{
    apiKey: "AIzaSyDzEej-PpR8GeVWcA6pWz5aOaz2QBb1tzQ",
    authDomain: "weather-test-d0c9a.firebaseapp.com",
    databaseURL: "https://weather-test-d0c9a.firebaseio.com",
    projectId: "weather-test-d0c9a",
    storageBucket: "weather-test-d0c9a.appspot.com",
    messagingSenderId: "292824822880",
    appId: "1:292824822880:web:1756fff4058576353b7f05"
};
  
firebase.initializeApp(firebaseConfig); // Initialize Firebase
var database = firebase.database();     // Create a variable to reference the database.
var uid;      //User ID.
var userEmal; //Current user's email address.

//Reference to login modal.
var modal = document.getElementById("myModal");

var debug = true; //Print console stuff if debugging.
var idNum = 0;    //Used to create unique IDs for weather station objects.

//Temperature constants.
const C = 0;
const F = 1;

/*********************************** Firebase Authentication Stuff ***********************************/
//Capture login button clicks.
$(document).ready(function()
{
    $("#login").on("click", doLogin);
    $("#signup").on("click", doSignup);
    $("#logout").on("click", doLogout);
});

//Log user out.
function doLogout(event)
{
    firebase.auth().signOut().then(function()
    {
        if(debug)console.log("Signed out");
    })
    .catch(function(error)
    {
        if(debug)console.log("Error Signing out");
    });

    //This is a hack! Prevents a bug where multiple searches are returned after logging in.
    location.reload();
}

//Log user in.
function doLogin(event)
{
    event.preventDefault();

    firebase.auth().signInWithEmailAndPassword($("#email-input").val(), 
                   $("#password-input").val()).catch(function(error)
    {
        if(debug)console.log(error.code);
        if(debug)console.log(error.message);

        //Indicate to user any problems that might exist.
        $("#password-error").html(error.message);
    });
}

//Sign up new user.
function doSignup(event)
{
    event.preventDefault();

    firebase.auth().createUserWithEmailAndPassword($("#email-input").val(), 
                   $("#password-input").val()).catch(function(error)
    {
        if(debug)console.log(error.code);
        if(debug)console.log(error.message);

        //Indicate to user any problems that might exist.
        $("#password-error").html(error.message);
    });
}

//Update things based on user's status.
firebase.auth().onAuthStateChanged(function(user)
{
    if (user)
    {
        //Get user ID.
        uid = user.uid;

        //Check if user already exists or if this is a new user.
        var userRef = firebase.database().ref("users");

        userRef.once("value").then(function(snapshot)
        {
            if (!snapshot.hasChild(uid))
            {
                if(debug)console.log("Creating new user: " + uid);
                userRef.child(uid).set
                ({
                    stations: "stations",
                    links: "links"
                });
            }
            else
            {
                if(debug)console.log("User already exists: " + uid);
            }
        });
       
        //Get user email to display on the webpage.
        var userEmail = user.email
        $(".navbar-text").text("Logged In User: " + userEmail);

        //User is signed in.
        if(debug)console.log("Signed in");
        if(debug)console.log("User's email: " + userEmail);
        
        //Remove modal to allow access to the site.
        modal.style.display = "none";
        runPage();
    }

    else
    {
        //User is signed out.
        modal.style.display = "block";
        $("#email-input").val("");
        $("#password-input").val("");
        $("#weather").empty();
        $("#links").empty();
        $(".header-user").text("Logged In User: None");
    }
});

/**************************************** Main Page Functions ****************************************/
function runPage()
{    
    $(document).ready(function()
    {
        $("#weather-search").on("click", validateInput);
    });

    /************************************ Validate Input Function ************************************/
    //Make sure user input is valid.
    function validateInput()
    {
        event.preventDefault();

        console.log("Validating");

        var isValid = true;
        var isZip = false;
        var zipString = "";
        var zip;
        var country;
        var city; 
    
        //Assume the user input is valid.
        $("#weather-input").removeClass("is-invalid");

        //First thing to do is validate the user input.
        var input = $("#weather-input").val().trim();

        //Check for empty input.
        if(input === "") isValid = false;

        //Split array on commas.
        var inputArray = input.split(",");

        //Can only have 2 arguments max.
        if(inputArray.length > 2) isValid = false;

        //Check for valid ZIP code.
        if(inputArray.length === 1)
        {
            zip = parseInt(inputArray[0]);

            //Check if a valid number has been entered.
            if(isNaN(zip))
            {
                isValid = false;
            }

            //Check if zip code is in the proper range(00501 to 99950).
            if(isValid && zip > 500 && zip < 99951)
            {
                isZip = true;
                city = "N/A";
                country = "N/A";
            
                //Zero pad the ZIP code, if necessary.
                if(zip < 1000)
                {
                    zipString = "00" + zip;
                }
                else if(zip < 10000)
                {
                    zipString = "0" + zip;
                }
                else
                {
                    zipString += zip;
                }

                if(debug) console.log("Zip code: " + zipString);
            }
            else
            {
                isValid = false;
            }
        }
        //Get the country and city values.
        else if(isValid)
        {
            city = inputArray[0].trim();
            country = inputArray[1].trim();
            zipString = "N/A";
            if(debug) console.log("Country: " + country + ", City: " + city);
        }
    
        //Exit if the user input was invalid.
        if(!isValid)
        {
            $("#weather-input").addClass("is-invalid");
            return;
        }

        //Get weather data from server.
        queryWeather(isZip, zipString, city, country);
    }

    /************************************ Query Weather Function *************************************/
    function queryWeather(isZip, zipString, city, country)
    {
        //Build the query URL string.
        var queryString = isZip ? "zip=" + zipString + ",us" :
                "q=" + city + "," + country;
        var queryURL = baseURL + queryString + APIKey;
    
        //Query the weather API database.
        $.ajax
        ({
            url: queryURL,
            method: "GET",

            //Something went wrong.
            error: function(errorThrown)
            {
                if(debug) console.log(errorThrown);

                addStation
                ({
                    errorObj: errorThrown,
                    weatherObj: null,
                    isValid: false,
                    isZip: isZip,
                    zipString: zipString,
                    city: city,
                    country: country
                });
            },

            //Send the response.
            success: function(response)
            {
                if(debug) console.log(response);

                addStation
                ({
                    errorObj: null,
                    weatherObj: response,
                    isValid: true,
                    isZip: isZip,
                    zipString: zipString,
                    city: city,
                    country: country
                });
            }
        });
    }

    /******************************* Add Station to Firebase Function ********************************/
    //Adds valid weather station data to Firebase.
    function addStation(response)
    {
        //Check if valid data came back from the weather API.
        if(!response.isValid)
        {
            $("#weather-input").addClass("is-invalid");
            return;
        }
    
        //Push the validated data to Firebase.
        database.ref("users/" + uid + "/stations").push
        ({
            stationObj: JSON.stringify(response),
            dateAdded:  firebase.database.ServerValue.TIMESTAMP,
            localTS:    JSON.stringify(moment())
        });
    
        //Clear the input text box.
        $("#weather-input").val("");
    }

    /************************** Add and Remove Station to Webpage Function ***************************/
    //Event listeners that gets called whenever a station is added or removed.
    var stationRef = firebase.database().ref("users/" + uid + "/stations");
    //Remove weather station from the webpage and stop its refresh timer.
    stationRef.on("child_removed", function(snapshot)
    {
        var childKey = snapshot.key; //Store the child's key.

        //Remove the element with the ID the same as the key.
        if(debug)console.log("Removing Weather Station ID: " + childKey);

        if(document.getElementById(childKey) !== null)
        {
            document.getElementById(childKey).remove();
        }
    });

    stationRef.on("child_added", function(snapshot)
    {
        var childKey = snapshot.key; //Store the child's key.
        var sv = snapshot.val();     //Store the child's data.

        //----------------------- Variable Extraction ------------------------
        var  stationObj = JSON.parse(sv.stationObj);  //Extract station object data.
        if(debug) console.log(stationObj);

        //Extract desired variables from the station data set.
        var localTS   = JSON.parse(sv.localTS);
        var name      = stationObj.weatherObj.name;
        var lat       = stationObj.weatherObj.coord.lat;
        var lon       = stationObj.weatherObj.coord.lon;
        var timeZone  = stationObj.weatherObj.timezone;
        var isZip     = stationObj.isZip;
        var zipString = stationObj.zipString;
        var city      = stationObj.city;
        var country   = stationObj.country;
        var windSpeed = stationObj.weatherObj.wind.speed;
        var windDeg   = Math.round(stationObj.weatherObj.wind.deg);
        var temp      = stationObj.weatherObj.main.temp;
        var tempType  = F;
        var clouds    = stationObj.weatherObj.clouds.all;
        var humidity  = stationObj.weatherObj.main.humidity;
        var pressure  = stationObj.weatherObj.main.pressure;
        var cntryCode = stationObj.weatherObj.sys.country;
        var cityID    = stationObj.weatherObj.id;
        var vis       = stationObj.weatherObj.visibility;
        var curDesc   = stationObj.weatherObj.weather[0].description;
        var curIcon   = stationObj.weatherObj.weather[0].icon;

        //------------------- Create Weather Station Card --------------------
        var card = $("<div>");
        card.addClass("card card-default");
        card.attr("id", childKey);

        var cardHeader = $("<div>");
        cardHeader.addClass("card-header");
        cardHeader.html("<h3>" + name + "</h3>");
        card.append(cardHeader);

        var cardBody = $("<div>");
        cardBody.addClass("card-body");
        card.append(cardBody);
    
        //Add card to webpage.
        $("#weather").prepend(card);

        //-------------------------- Delete button ---------------------------
        var cardDelBtn = $("<button>");
        cardDelBtn.addClass("btn btn-secondary header-btn mx-1");
        cardDelBtn.text("X");
        cardDelBtn.attr("id", "del-btn" + idNum);
        cardHeader.append(cardDelBtn);

        //Remove entry from the webpage and database.
        cardDelBtn.on("click", function()
        {
            //Remove value from the webpage.
            card.remove();

            //Remove value from the database.
            var ref = firebase.database().ref("users/" + uid + "/stations/" + childKey);
            ref.remove();    
        });

        //------------------------ Quick Link Button -------------------------
        var linkBtn = $("<button>");
        linkBtn.addClass("btn btn-secondary header-btn mx-1");
        linkBtn.text("Add To Favorites");
        linkBtn.attr("id", "link-btn" + idNum);
        cardHeader.append(linkBtn);

        //Add quick link item to Firebase.
        linkBtn.on("click", function()
        {
            //Push query data to Firebase.
            database.ref("users/" + uid + "/links").push
            ({
                isZip: isZip,
                zipString: zipString,
                city: city,
                country: country,
                name: name,
                dateAdded: firebase.database.ServerValue.TIMESTAMP
            });        
        });

        //------------------------- Google Map Stuff -------------------------
        //Add a Google map div.
        var gMap = $("<div>");
        gMap.addClass("border gmap-div station-div mr-1");
        gMap.attr("id", "gmap" + idNum);
        cardBody.append(gMap);

        //Add the map.
        map = new google.maps.Map(document.getElementById("gmap" + idNum),
        {
            center: {lat: lat, lng: lon},
            zoom: 8
        });

        //Add a marker to the map.
        new google.maps.Marker
        ({
            position: {lat: lat, lng: lon},
            map: map,
            title: name
        });

        //--------------------------- Clock Stuff ----------------------------
        //Add a clock div.
        var clockDiv = $("<div>");
        clockDiv.addClass("border clock-div station-div mr-1");
        clockDiv.append("<p>Local Time:</p>");
        cardBody.append(clockDiv);
    
        var clockID = "clock-canvas" + idNum;
        var clockCan = document.createElement("canvas");
        clockCan.id = clockID;
        clockCan.width  = 151;
        clockCan.height = 151;
    
        var dTime = $("<div>");
        dTime.attr("id", "clk-div" + idNum);
        clockDiv.append(dTime);
        clockDiv.append(clockCan);
 
        //Create the clock object.
        var clock = new AClock(document.getElementById(clockID));

        //Get current UTC time.
        var now = new Date();
        var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

        //Convert back to local time.
        var localTime = utcTime +(timeZone * 1000);
        clock.draw(moment(localTime));
        dTime.html("<p>" + moment(localTime).format("hh:mm:ss A") + "</p>");

        //------------------------ Time Of Day Stuff -------------------------
        //Add a time of day div.
        var todDiv = $("<div>");
        todDiv.addClass("border station-div tod-div mr-1");
        todDiv.attr("id", "tod-div" + idNum);
        cardBody.append(todDiv);
        todDiv.append("<p>Time of Day:</p>");
        var ttlDiv = $("<div>");
        ttlDiv.attr("id", "ttl-div" + idNum);
        todDiv.append(ttlDiv);

        setTOD(todDiv.attr("id"), ttlDiv.attr("id"), localTime);

        //Do this to align things.
        var todID  = "tod-canvas" + idNum;
        var todCan = document.createElement("canvas");
        todCan.id  = todID;
        todCan.width  = 151;
        todCan.height = 151;
        todDiv.append(todCan);

        //------------------------- Wind Vane Stuff --------------------------
        //Need to check if wind direction and speed are defined.
        var isWindDefined = true;
        if(windDeg === undefined)
        {
            isWindDefined = false;
            windDeg = 0;
        }

        //Add a wind vane div.
        var vaneDiv = $("<div>");
        vaneDiv.addClass("border vane-div station-div mr-1");
        cardBody.append(vaneDiv);

        var vaneSpeed = $("<div>");
        vaneSpeed.attr("id", "vane-speed" + idNum);
        vaneSpeed.html("<p>Wind Speed: " + windSpeed + " m/s</p>");
        vaneSpeed.attr("id", "vane-speed" + idNum);
        vaneDiv.append(vaneSpeed);

        var vaneDir = $("<div>");
        vaneDir.attr("id", "vane-dir" + idNum);
        vaneDir.html("<p>Wind Dir: " + windDeg + " Degrees</p>");
        vaneDir.attr("id", "vane-dir" + idNum);
        vaneDiv.append(vaneDir);

        var vaneID  = "vane-canvas" + idNum;
        var vaneCan = document.createElement("canvas");
        vaneCan.id  = vaneID;
        vaneCan.width  = 151;
        vaneCan.height = 151;
        vaneDiv.append(vaneCan);

        //Create the wind vane object.
        var vane = new AWind(document.getElementById(vaneID));
        vane.draw(windDeg);

        //----------------------- Cloud Coverage Stuff -----------------------
        //Add a cloud coverage div.
        var cloudDiv = $("<div>");
        cloudDiv.addClass("border cloud-div station-div mr-1");
        cloudDiv.attr("id", "cloud-div" + idNum);
        cardBody.append(cloudDiv);
        var cltDiv = $("<div>");
        cltDiv.attr("id", "clt-Div" + idNum);
        cloudDiv.append(cltDiv);
        var cldDiv = $("<div>");
        cldDiv.attr("id", "cld-Div" + idNum);
        cloudDiv.append(cldDiv);

        setClouds(clouds, cloudDiv.attr("id"), cldDiv.attr("id"), cltDiv.attr("id"));

        //Do this to align things.
        var cloudID  = "cloud-canvas" + idNum;
        var cloudCan = document.createElement("canvas");
        cloudCan.id  = cloudID;
        cloudCan.width  = 151;
        cloudCan.height = 151;
        cloudDiv.append(cloudCan);

        //------------------------ Temperature Stuff -------------------------
        //Add a temperature div.
        var tempDiv = $("<div>");
        tempDiv.addClass("border temp-div station-div mr-1");
        tempDiv.attr("id", "temp-div" + idNum);
        cardBody.append(tempDiv);

        var tempF = $("<div>");
        tempF.html("<p>Fahrenheit: " + tempCalc(temp, F).toFixed(1) + "&#8457</p>");
        tempF.attr("id", "temp-f" + idNum);
        tempDiv.append(tempF);

        var tempC = $("<div>");
        tempC.html("<p>Celsius: " + tempCalc(temp, C).toFixed(1) + "&#8451</p>");
        tempC.attr("id", "temp-c" + idNum);
        tempDiv.append(tempC);

        var tempID  = "temp-canvas" + idNum;
        var tempCan = document.createElement("canvas");
        tempCan.id  = tempID;
        tempCan.width  = 151;
        tempCan.height = 151;
        tempDiv.append(tempCan);

        //Create the temperature dial object.
        var thisTemp = new ATemp(document.getElementById(tempID));
        thisTemp.draw(temp, tempType);

        //-------------------------- Humidity Stuff --------------------------
        //Add a humidity div.
        var humidityDiv = $("<div>");
        humidityDiv.addClass("border humidity-div station-div mr-1");
        cardBody.append(humidityDiv);
        humidityDiv.append("<p>Humidity:</p>");
        var humDiv = $("<div>");
        humDiv.attr("id", "hum-div" + idNum);
        humidityDiv.append(humDiv);
        setHumidity(humDiv.attr("id"), humidity);

        var humidityID  = "humidity-canvas" + idNum;
        var humidityCan = document.createElement("canvas");
        humidityCan.id  = humidityID;
        humidityCan.width  = 151;
        humidityCan.height = 151;
        humidityDiv.append(humidityCan);

        //-------------------------- Pressure Stuff --------------------------
        //Add a Pressure div.
        var pressureDiv = $("<div>");
        pressureDiv.addClass("border pressure-div station-div mr-1");
        cardBody.append(pressureDiv);
        pressureDiv.append("<p>Pressure:</p>");
        presDiv = $("<div>");
        presDiv.attr("id", "pres-div" + idNum);
        pressureDiv.append(presDiv);
        setPressure(presDiv.attr("id"), pressure);

        var pressureID  = "pressure-canvas" + idNum;
        var pressureCan = document.createElement("canvas");
        pressureCan.id  = pressureID;
        pressureCan.width  = 151;
        pressureCan.height = 151;
        pressureDiv.append(pressureCan);

        //--------------------- Current Conditions Stuff ---------------------
        //Add a Current Conditions div.
        var currentDiv = $("<div>");
        currentDiv.addClass("border current-div station-div mr-1");
        currentDiv.attr("id", "current-div" + idNum);
        cardBody.append(currentDiv);
        currentDiv.append("<p>Current Conditions:</p>");
        curDiv = $("<div>");
        curDiv.attr("id", "cur-div" + idNum);
        curDiv.html("<p>" + curDesc + "</p>");
        currentDiv.append(curDiv);
        currentDiv.css('background-image',
            "url('https://openweathermap.org/img/wn/" + curIcon + "@2x.png')");

        var currentID  = "current-canvas" + idNum;
        var currentCan = document.createElement("canvas");
        currentCan.id  = currentID;
        currentCan.width  = 151;
        currentCan.height = 151;
        currentDiv.append(currentCan);

        //------------------------- Visibility Stuff -------------------------
        //Add a Visibility div.
        var visibilityDiv = $("<div>");
        visibilityDiv.addClass("border visibility-div station-div mr-1");
        cardBody.append(visibilityDiv);
        visibilityDiv.append("<p>Visibility:</p>");
        visDiv = $("<div>");
        visDiv.attr("id", "vis-Div" + idNum);
        visDiv.html("<p>" + (vis * 0.000621).toFixed(2) + " miles</p>");
        visibilityDiv.append(visDiv);

        var visID  = "visibility-canvas" + idNum;
        var visCan = document.createElement("canvas");
        visCan.id  = visID;
        visCan.width  = 151;
        visCan.height = 151;
        visibilityDiv.append(visCan);

        //----------------------- Technical Info Stuff -----------------------
        //Add a Technical Info div.
        var infoDiv = $("<div>");
        infoDiv.addClass("border info-div station-div mr-1");
        cardBody.append(infoDiv);
        infoDiv.append("<p>Location</p>");
        infoDiv.append("<p>Information</p>");
        infoDiv.append("<b>Country Code: " + cntryCode + "</b><br>");
        infoDiv.append("<b>City ID: " + cityID + "</b><br>");
        infoDiv.append("<b>Latitude: " + lat + "</b><br>");
        infoDiv.append("<b>Longitude: " + lon + "</b><br>");
        infoDiv.append("<b>Timezone Offset: " + timeZone + "</b><br>");

        var infoID  = "temp-canvas" + idNum;
        var infoCan = document.createElement("canvas");
        infoCan.id  = infoID;
        infoCan.width  = 151;
        infoCan.height = 31;
        infoDiv.append(infoCan);
        
        //------------------------ Next Refresh Stuff ------------------------
        //Add a Next Refresh div.
        var refreshDiv = $("<div>");
        refreshDiv.addClass("border refresh-div station-div mr-1");
        cardBody.append(refreshDiv);
        refreshDiv.append("<p>Time Until</p>");
        refreshDiv.append("<p>Next Refresh</p>");

        //Do this to align things.
        var refreshID  = "refresh-canvas" + idNum;
        var refreshCan = document.createElement("canvas");
        refreshCan.classList.add ("refresh-can");
        refreshCan.id  = refreshID;
        refreshCan.width  = 151;
        refreshCan.height = 151;
        refreshDiv.append(refreshCan);

        var timer = new ATimer(refreshCan, refreshCan.width, 610, CLOCK_STYLE_1, "#666666", null);
        timer.startTimer();

        //Always update idNum so everything can have a unique ID.
        idNum++;

        //Create a refresh object.
        refresh = new Refresh
        (
            isZip, zipString, city, country, baseURL,       //Misc. stuff.
            APIKey, timer, localTS, name,
            clock, dTime.attr("id"), timeZone,              //Analog clock.
            setTOD, todDiv.attr("id"), ttlDiv.attr("id"),   //Time of day.
            vane, vaneSpeed.attr("id"), vaneDir.attr("id"), //Wind vane. 
            setClouds, clouds, cloudDiv.attr("id"),         //Cloud cover.
            cldDiv.attr("id"), cltDiv.attr("id"),    
            thisTemp, tempF.attr("id"), tempC.attr("id"),   //Temperature.
            tempType, tempDiv.attr("id"), temp,
            setHumidity, humDiv.attr("id"),                 //Humidity.
            setPressure, presDiv.attr("id"),                //Pressure.
            currentDiv.attr("id"), curDiv.attr("id"),       //Current conditions.
            visDiv.attr("id")                               //Visibility.
        );
        refresh.startRefresh();
    });

    /***************************************** Refresh Class *****************************************/
    class Refresh
    {
        constructor
        (
            isZip, zipString, city, country,    //Other stuff.
            baseURL, APIKey, timer, localTS,
            name,
            clockObject, dTimeDiv, timeZone,    //Analog clock.
            todFunction, todDiv, ttlDiv,        //Time of day.
            vaneObject, vaneSpeed, vaneDir,     //Wind vane.
            cloudFunction, clouds, cloudDiv,    //Cloud cover.
            cldDiv, cltDiv,
            tempObject, tempF, tempC, tempType, //Temperature.
            tempDiv, currentTemp,
            humFunction, humDiv,                //Humidity.
            presFunction, presDiv,              //Pressure.
            currentDiv, curDiv,                 //Current conditions.
            visDiv                              //Visibility.
        )
        {
            this.intervalID;
            this.REFRESH_TIME = 1000;
            this.isRunning    = false;
            this.C            = 0;
            this.F            = 1;

            this.isZip     = isZip;
            this.zipString = zipString;
            this.city      = city;
            this.country   = country; 
            this.baseURL   = baseURL;
            this.APIKey    = APIKey
            this.timer     = timer;
            this.localTS   = localTS;
            this.name      = name;

            this.clockObject = clockObject;
            this.dTimeDiv    = dTimeDiv;
            this.timeZone    = timeZone;

            this.todFunction = todFunction;
            this.todDiv      = todDiv;
            this.ttlDiv      = ttlDiv;

            this.vaneObject  = vaneObject;
            this.vaneSpeed   = vaneSpeed;
            this.vaneDir     = vaneDir;

            this.cloudFunction = cloudFunction;
            this.clouds        = clouds;
            this.cloudDiv      = cloudDiv;
            this.cldDiv        = cldDiv; 
            this.cltDiv        = cltDiv;

            this.tempObject  = tempObject;
            this.tempF       = tempF;
            this.tempC       = tempC;
            this.tempType    = tempType;
            this.tempDiv     = tempDiv;
            this.currentTemp = currentTemp;

            this.humFunction = humFunction;
            this.humDiv      = humDiv;

            this.presFunction = presFunction;
            this.presDiv      = presDiv;

            this.currentDiv = currentDiv;
            this.curDiv     = curDiv;

            this.visDiv = visDiv;

            this.initListener();            
        }

        //Initialize a click listener for toggling between C and F.
        initListener()
        {
            
            var self = this;

            var tDiv = document.getElementById(this.tempDiv);
           
            //Create listener for the temperature canvas to toggle between C and F.
            tDiv.addEventListener("click", function()
            {
                self.tempType === self.F ? self.tempType = self.C : self.tempType = self.F;
                self.tempObject.draw(self.currentTemp, self.tempType);
                
            });
        }

        //Setup the refresh interval.
        startRefresh()
        {
            this.isRunning = true;
            clearInterval(this.intervalID);

            //This is necessary to use setInterval in the class scope.
            var self = this;
            this.intervalID = setInterval(function() {self.doRefresh();}, this.REFRESH_TIME);
        }

        //Stop the refresh interval.
        stopRefresh()
        {
            clearInterval(this.intervalID);
        }

        //Convert Kelvin to Celsius or Fahrenheit
        tempCalc(temperature, convType)
        {
            return convType === this.C ? temperature - 273.15 : temperature * 9/5 - 459.67;
        } 

        //This function handles all the details of the refresh.
        doRefresh()
        {
            //Get current UTC time.
            var now = new Date();
            var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

            //Convert back to local time.
            var localTime = utcTime +(this.timeZone * 1000);
            this.clockObject.draw(moment(localTime));

            //Check if element exists. if not, shut down the timer and exit.
            if(!document.getElementById(this.dTimeDiv))
            {
                clearInterval(this.intervalID);
                return;
            }

            document.getElementById(this.dTimeDiv).innerHTML = 
                "<p>" + moment(localTime).format("hh:mm:ss A") + "</p>";

            //Update the time of day.
            this.todFunction(this.todDiv, this.ttlDiv, localTime);

            //Here we check if the weather info needs to be updated.  The database only updates
            //once every 10 minutes so we will check every 10 minutes and 10 seconds.
            if(moment().diff(this.localTS) > 10 * 60 * 1000 + 10000)
            {
                if(debug)console.log("Updating " + this.name);

                //Reset the refresh timer.
                this.timer.resetTimer();
                this.timer.startTimer();

                //Make sure we don't constantly update by changing the time stamp.
                this.localTS = moment();

                //Build the query URL string.
                var queryString = this.isZip ? "zip=" + this.zipString + ",us" :
                "q=" + this.city + "," + this.country;
                var queryURL = this.baseURL + queryString + this.APIKey;

                var self = this;

                //Query the weather API database.
                $.ajax
                ({
                    url: queryURL,
                    method: "GET",

                    //Something went wrong.
                    error: function(errorThrown)
                    {
                        if(debug) console.log(errorThrown);
                    },

                    //Update the weather data.
                    success: function(response)
                    {
                        if(debug) console.log(response);

                        //Update the wind.
                        var windSpeed = response.wind.speed;
                        var windDeg   = Math.round(response.wind.deg);
                        document.getElementById(self.vaneSpeed).innerHTML =
                            "<p>Wind Speed: " + windSpeed + " m/s</p>";
                        document.getElementById(self.vaneDir).innerHTML =
                            "<p>Wind Dir: " + windDeg + " Degrees<p>";
                        self.vaneObject.draw(windDeg);

                        //Update cloud cover.
                        var clouds = response.clouds.all;
                        self.cloudFunction(clouds, self.cloudDiv, self.cldDiv, self.cltDiv);

                        //Update the temperature.
                        var temp = response.main.temp;
                        self.currentTemp = temp;
                        document.getElementById(self.tempF).innerHTML = "<p>Fahrenheit: " + 
                            self.tempCalc(temp, self.F).toFixed(1) + "&#8457</p>";
                        document.getElementById(self.tempC).innerHTML = "<p>Celsius: " + 
                            self.tempCalc(temp, self.C).toFixed(1) + "&#8451</p>";
                        self.tempObject.draw(temp, self.tempType);

                        //Update the humidity.
                        var humidity = response.main.humidity;
                        self.humFunction(self.humDiv, humidity);

                        //Update the pressure.
                        var pressure = response.main.pressure;
                        self.presFunction(self.presDiv, pressure);
 
                        //Update the visibility.
                        var vis = response.visibility;
                        document.getElementById(self.visDiv).innerHTML = 
                            "<p>" + (vis * 0.000621).toFixed(2) + " miles</p>";

                        //Update the current conditions.
                        var curDesc = response.weather[0].description;
                        var curIcon = response.weather[0].icon;
                        document.getElementById(self.curDiv).innerHTML = "<p>" + curDesc + "</p>";
                        document.getElementById(self.currentDiv).style.background =
                            "url('https://openweathermap.org/img/wn/" + curIcon + "@2x.png')";
                        document.getElementById(self.currentDiv).style.backgroundSize = 
                            "100% 100%";
                        document.getElementById(self.currentDiv).style.backgroundColor =
                            "rgb(226, 202, 241)";
                    }
                });
            }
        }
    }

    /*************************************** Support Functions ***************************************/
    //Convert Kelvin to Celsius or Fahrenheit
    function tempCalc(temperature, convType)
    {
        return convType === C ? temperature - 273.15 : temperature * 9/5 - 459.67;
    }

    //Set the humidity text.
    function setHumidity(humDiv, humidity)
    {
        document.getElementById(humDiv).innerHTML ="<p>" + humidity + "%</p>";
    }

    //Set pressure text.
    function setPressure(presDiv, pressure)
    {
        document.getElementById(presDiv).innerHTML = "<p>" + pressure + "hPa</p>";
    }

    //Set the time of day image and text.
    function setTOD(todDiv, ttlDiv, localTime)
    {
        var todDiv1 = document.getElementById(todDiv);
        var ttlDiv1 = document.getElementById(ttlDiv);
        var todTime = moment(localTime).format("H");

        if(todTime <= 2)
        {
            todDiv1.style.background = "url('assets/images/night.png')"; 
            todDiv1.style.backgroundSize = "100% 100%";
            ttlDiv1.innerHTML = "<p>Night</p>";
        }
        else if(todTime <= 6)
        {
            todDiv1.style.background = "url('assets/images/earlyMorning.png')";
            todDiv1.style.backgroundSize = "100% 100%";
            ttlDiv1.innerHTML = "<p>Early Morning</p>";
        }
        else if(todTime <= 10)
        {
            todDiv1.style.background = "url('assets/images/morning.png')";
            todDiv1.style.backgroundSize = "100% 100%";
            ttlDiv1.innerHTML = "<p>Morning</p>";
        }
        else if(todTime <= 14)
        {
            todDiv1.style.background = "url('assets/images/midday.png')";
            todDiv1.style.backgroundSize = "100% 100%";
            ttlDiv1.innerHTML = "<p>Midday</p>";
        }
        else if(todTime <= 18)
        {
            todDiv1.style.background = "url('assets/images/afternoon.png')";
            todDiv1.style.backgroundSize = "100% 100%";
            ttlDiv1.innerHTML = "<p>Afternoon</p>";
        }
        else if(todTime <= 22)
        {
            todDiv1.style.background = "url('assets/images/evening.png')";
            todDiv1.style.backgroundSize = "100% 100%";
            ttlDiv1.innerHTML = "<p>Evening</p>";
        }
        else
        {
            todDiv1.style.background = "url('assets/images/night.png')";
            todDiv1.style.backgroundSize = "100% 100%";
            ttlDiv1.innerHTML = "<p>Night</p>";
        }
    }

    //Set the cloud cover image and text.
    function setClouds(clouds, cloudDiv, cldDiv, cltDiv)
    {
        var cloudDiv1 = document.getElementById(cloudDiv);
        var cldDiv1   = document.getElementById(cldDiv);
        var cltDiv1   = document.getElementById(cltDiv);

        cltDiv1.innerHTML = "<p>Cloud Coverage: " + clouds + "%</p>";
        
        if(clouds <= 25)
        {
            cloudDiv1.style.background = "url('assets/images/clearSky.jpg')";
            cloudDiv1.style.backgroundSize = "100% 100%";
            cldDiv1.innerHTML = "<p>Clear Skies</p>";
        }
        else if(clouds <= 50)
        {
            cloudDiv1.style.background = "url('assets/images/lightClouds.jpg')";
            cloudDiv1.style.backgroundSize = "100% 100%";
            cldDiv1.innerHTML = "<p>Light Clouds</p>";
        }
        else if(clouds <= 75)
        {
            cloudDiv1.style.background = "url('assets/images/heavyClouds.jpg')";
            cloudDiv1.style.backgroundSize = "100% 100%";
            cldDiv1.innerHTML = "<p>Mostly Cloudy</p>";
        }
        else
        {
            cloudDiv1.style.background = "url('assets/images/overcast.jpg')";
            cloudDiv1.style.backgroundSize = "100% 100%";
            cldDiv1.innerHTML = "<p>Overcast</p>";
        }
    }

    /************************ Add and Remove Quick Link to Webpage Function **************************/
    //Event listener that gets called whenever a quick link is added.
    var linksRef = firebase.database().ref("users/" + uid + "/links");
    linksRef.on("child_added", function(snapshot)
    {
        var childKey = snapshot.key; //Store the child's key.
        var sv = snapshot.val();     //Store the child's data.

        //Create quick link div.
        var linkDiv = $("<div>");
        linkDiv.addClass("link-div m-1");
        linkDiv.attr("id", childKey);
        linkDiv.html("<h3>" + sv.name + "</h3>");

        //Create an overlay div.
        var overlay = $("<div>");
        overlay.addClass("overlay");

        //Create remove div.
        var remDiv = $("<div>");
        remDiv.addClass("overlay-add");

        //Create the remove button and append to the remove div.
        var remButton = $("<input>");
        remButton.addClass("btn btn-secondary");
        remButton.attr("value", "X");
        remButton.attr("type", "button");
        remDiv.append(remButton);

        //Add remove div to the overlay.
        overlay.append(remDiv);

        //Create the remove button tooltip.
        var remTooltip = $("<div>");
        remTooltip.addClass("tooltiptext");
        remTooltip.text("Remove From Favorites");

        //Add remove tooltip to the remove div.
        remDiv.append(remTooltip);

        //Add the overlay to the linkDiv.
        linkDiv.append(overlay);

        //Add everything to the webpage.
        $("#links").prepend(linkDiv);

        //Remove entry from database.
        remButton.on("click", function()
        {
            //Remove value from the database.
            var ref = firebase.database().ref("users/" + uid + "/links/" + childKey);
            ref.remove();

            //Remove
            linkDiv.remove();
        });

        //Add weather station back into the main div.
        linkDiv.on("click", function()
        {
            queryWeather(sv.isZip, sv.zipString, sv.city, sv.country);
        });
    });

    //Remove entry from any other open webpages.
    linksRef.on("child_removed", function(snapshot)
    {
        var childKey = snapshot.key; //Store the child's key.
        if(debug)console.log("Removing Quick Link ID: " + childKey);

        if(document.getElementById(childKey) !== null)
        {
            document.getElementById(childKey).remove();
        }
    });
}
