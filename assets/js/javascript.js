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
                if(debug)console.log("Creating ne user: " + uid);
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
        $(".header-user").text("Logged In User: " + userEmail);

        // User is signed in.
        if(debug)console.log("Signed in");
        if(debug)console.log("User's email: " + userEmail);
        
        //Remove modal to allow access to the site.
        modal.style.display = "none";
        runPage();
    }

    else
    {
        // User is signed out.
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
    //Capture search button click.
    $(document).ready(function()
    {
        $("#weather-search").on("click", validateInput);
    });

    /************************************ Validate Input Function ************************************/
    //Make sure user input is valid.
    function validateInput()
    {
        event.preventDefault();

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
        linkBtn.text("Quick Link");
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
        clockDiv.append("Local Time<br>");
        cardBody.append(clockDiv);
    
        var clockID = "clock-canvas" + idNum;
        var clockCan = document.createElement("canvas");
        clockCan.id = clockID;
        clockCan.width = 151;
        clockCan.height = 151;
    
        var dTime = $("<div>");
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
        dTime.text(moment(localTime).format("hh:mm:ss A"));

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
        vaneSpeed.html("Wind Speed: " + windSpeed + " m/s<br>");
        vaneSpeed.attr("id", "vane-speed" + idNum);
        vaneDiv.append(vaneSpeed);

        var vaneDir = $("<div>");
        vaneDir.html("Wind Dir: " + windDeg + " Degrees");
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













        //------------------------- Timing Intervals -------------------------
        //Animate the clock and current time underneath it.
        setInterval(function()
        {
            //Get current UTC time.
            var now = new Date();
            var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

            //Convert back to local time.
            var localTime = utcTime +(timeZone * 1000);
            clock.draw(moment(localTime));
            dTime.text(moment(localTime).format("hh:mm:ss A"));

            //Here we check if the weather info needs to be updated.  The database only updates
            //once every 10 minutes so we will check every 10 minutes and 10 seconds.
            if(moment().diff(localTS) > 10 * 60 * 1000 + 10000)
            {
                if(debug)console.log("Updating " + name);

                //Make sure we don't constantly update by changing the time stamp.
                localTS = moment();

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
                    },

                    //Update the weather data.
                    success: function(response)
                    {
                        if(debug) console.log(response);

                        //----------------Do All Updates Here-----------------
                        //Update the wind.
                        windSpeed = response.wind.speed;
                        windDeg   = Math.round(response.wind.deg);
                        vaneSpeed.html("Wind Speed: " + windSpeed + " m/s<br>");
                        vaneDir.html("Wind Dir: " + windDeg + " Degrees");
                        vane.draw(windDeg);


                    











                    }
                });
            }
        }, 200);

        //Always update idNum so everything can have a unique ID.
        idNum++;
    });

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
        remTooltip.text("Remove From Quick Links");

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
