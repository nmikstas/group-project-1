/************************************** Analog Clock Class ***************************************/
//Options bit flags.
const SUBSECONDS       = 0x001; //Set = second hand moves every 1/6th of a second.
const HIDE_RING        = 0x002; //Set = hide outer clock ring.
const HIDE_CENTER      = 0x004; //Set = hide center circle.
const HIDE_SECONDS     = 0x008; //Set = hide second hand.
const HIDE_MINUTES     = 0x010; //Set = hide minute hand.
const HIDE_HOURS       = 0x020; //Set = hide hour hand.
const HIDE_MINUTE_TICK = 0x040; //Set = hide minute ticks.
const HIDE_MINOR_TICK  = 0x080; //Set = hide minor hour ticks.
const HIDE_MAJOR_TICK  = 0x100; //Set = hide major hour ticks.

//NOTE: If subseconds is active and AClock is being used to animate a clock, the timer interval
//for the animation shoud be 80 milliseconds to ensure a proper sweeping motion of the second
//hand.  If subseconds is disabled, 490 milliseconds should be used.
class AClock
{
    constructor
    (
        //canvas in the only required parameter in the constructor.  It is the reference to the
        //canvas that the clock will be drawn on.  options holds the bit flags shown above.
        canvas, options = 0x000,

        //These variables are the colors of the various clock components.
        secondColor     = "#ff0000", minuteColor    = "#000000", hourColor      = "#000000", 
        outerRingColor  = "#000000", centerColor    = "#000000",
        minuteTickColor = "#8f8f8f", minorTickColor = "#8f8f8f", majorTickColor = "#8f8f8f",

        //These variables control the thickness in pixels of the various clock components.
        secondWidth     = 2, minuteWidth    = 4, hourWidth      = 6,
        outerRingWidth  = 3, centerWidth    = 5,
        minuteTickWidth = 1, minorTickWidth = 2, majorTickWidth = 3,

        //These variables control the lengths and radiuses of the clock components.
        //radiusLen scales the entire clock and is the percentage of the canvas that is used
        //by the clock(based on the shortest axis of the canvas). secondLen, minuteLen and hourLen
        //control the hand lengths.  The values represent a percentage of the clock radius.
        //centerRad is the radius of the center circle in pixels. minuteTickLen, minorTickLen,
        //and majorTickLen are the lengths of the ticks on the outer clock ring. The length of
        //the ticks is 1 - the given value.  For example, if minuteTickLen is .90, then the total
        //length of the tick is 1 - .90 = .1. The minute ticks will be 10% of the clock radius.
        secondLen     = .90, minuteLen    = .75, hourLen      = .60,
        radiusLen     = .95, centerRad    = 2  ,
        minuteTickLen = .90, minorTickLen = .85, majorTickLen = .80
    )
    {
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.canvasWidth;
        this.canvasHeight;
        this.canvasMiddleX;
        this.canvasMiddleY;
        this.radius;

        //Optional arguments from above.
        this.options         = options;
        this.secondColor     = secondColor;
        this.minuteColor     = minuteColor;
        this.hourColor       = hourColor; 
        this.outerRingColor  = outerRingColor;
        this.centerColor     = centerColor;
        this.minuteTickColor = minuteTickColor;
        this.minorTickColor  = minorTickColor;
        this.majorTickColor  = majorTickColor;
        this.secondWidth     = secondWidth;
        this.minuteWidth     = minuteWidth;
        this.hourWidth       = hourWidth;
        this.outerRingWidth  = outerRingWidth;
        this.centerWidth     = centerWidth;
        this.minuteTickWidth = minuteTickWidth;
        this.minorTickWidth  = minorTickWidth;
        this.majorTickWidth  = majorTickWidth;
        this.secondLen       = secondLen;
        this.minuteLen       = minuteLen;
        this.hourLen         = hourLen;
        this.radiusLen       = radiusLen;
        this.centerRad       = centerRad;
        this.minuteTickLen   = minuteTickLen;
        this.minorTickLen    = minorTickLen;
        this.majorTickLen    = majorTickLen;

        //Convert radians to degrees (divide clock into 360 pieces).
        this.oneDegree = Math.PI / 180;

        //Calculate 6/1000th of a second.  Used for second hand positioning.
        this.secondConst = 6 / 1000;
    }

    //This is the function that draws the moment as a clock.
    draw(thisMoment)
    {
        //Get canvas height and width.
        this.canvasWidth = this.canvas.clientWidth;
        this.canvasHeight = this.canvas.clientHeight;
                
        //Calculate the center of the canvas.
        this.canvasMiddleX = this.canvasWidth / 2;
        this.canvasMiddleY = this.canvasHeight / 2;

        //Calculate the drawing radius.
        this.radius = (this.canvasWidth > this.canvasHeight) ? 
                       this.canvasMiddleY : this.canvasMiddleX;
        this.radius *= this.radiusLen;

        //Clear the canvas.
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        //Get time string to draw.
        var timeString = moment(thisMoment).format("hh:mm:ss.SSS");
        
        //Convert string into integers.
        var timeArray = timeString.split(":");
        var hour = parseInt(timeArray[0]);
        var min = parseInt(timeArray[1]);
        timeArray = timeArray[2].split(".");
        var sec = parseInt(timeArray[0]);
        var mil = parseInt(timeArray[1]);

        //Convert 12 o'clock to 0.
        if(hour === 12) hour = 0;

        //Check if minute ticks are enabled.
        if(!(this.options & HIDE_MINUTE_TICK))
        {
            //Prepare to draw 60 minute ticks.
            thisTheta = 0;

            //Draw the minute ticks.
            for(let i = 0; i < 60; i++)
            {
                this.drawLineAngle(thisTheta, this.minuteTickColor, this.minuteTickWidth, 
                                   this.radius * this.minuteTickLen, this.radius);
                thisTheta += Math.PI / 30;
            }
        }

        //Check if minor hour ticks are enabled.
        if(!(this.options & HIDE_MINOR_TICK))
        {
            //Prepare to draw 12 hour ticks.
            thisTheta = 0;

            //Draw the minor hour ticks.
            for(let i = 0; i < 12; i++)
            {
                this.drawLineAngle(thisTheta, this.minorTickColor, this.minorTickWidth, 
                                   this.radius * this.minorTickLen, this.radius);
                thisTheta += Math.PI / 6;
            }
        }

        //Check if major hour ticks are enabled.
        if(!(this.options & HIDE_MAJOR_TICK))
        {
            //Prepare to draw 4 hour ticks at 3, 6, 9 and 12.
            thisTheta = 0;

            //Draw the major hour ticks.
            for(let i = 0; i < 4; i++)
            {
                this.drawLineAngle(thisTheta, this.majorTickColor, this.majorTickWidth,
                                   this.radius * this.majorTickLen, this.radius);
                thisTheta += Math.PI / 2;
            }
        }

        //Check if the outer ring is enabled.
        if(!(this.options & HIDE_RING))
        {
            //Draw the circle of the clock face.
            this.drawArc(0, 2 * Math.PI, this.radius, this.outerRingColor, this.outerRingWidth);
        }

        //Check if hour hand is enabled
        if(!(this.options & HIDE_HOURS))
        {
            //Calculate the current piece the hour hand is on.
            thisPiece = Math.round(hour * 30 + min / 2);

            //Calculate Current angle of the hour hand.  12 o'clock is at -PI/2.
            thisTheta = -Math.PI / 2  + this.oneDegree * thisPiece;

            //Draw the hour hand.
            this.drawLineAngle(thisTheta, this.hourColor, this.hourWidth,
                               0, this.radius * this.hourLen);
        }

        //Check if minute hand is enabled
        if(!(this.options & HIDE_MINUTES))
        {
            //Calculate the current piece the minute hand is on.
            thisPiece = Math.round(min * 6 + sec / 10);

            //Calculate Current angle of the minute hand.  12 o'clock is at -PI/2.
            thisTheta = -Math.PI / 2  + this.oneDegree * thisPiece;

            //Draw the minute hand.
            this.drawLineAngle(thisTheta, this.minuteColor, this.minuteWidth,
                               0, this.radius * this.minuteLen);
        }

        //Check if second hand is enabled.
        if(!(this.options & HIDE_SECONDS))
        {
            //Calculate the current piece the second hand is on.
            var thisPiece = sec * 6;

            //Check if subseconds are enabled.
            if(this.options & SUBSECONDS)
            {
                thisPiece += Math.round(mil * this.secondConst);
            }

            //Calculate Current angle of the second hand.  12 o'clock is at -PI/2.
            var thisTheta = -Math.PI / 2 + this.oneDegree * thisPiece;

            //Draw the second hand.
            this.drawLineAngle(thisTheta, this.secondColor, this.secondWidth,
                               0, this.radius * this.secondLen);
        }

        //Check if the center is enabled.
        if(!(this.options & HIDE_CENTER))
        {
            //Draw the inner circle the hands attach to.
            this.drawArc(0, 2 * Math.PI, this.centerRad, this.centerColor, this.centerWidth);
        }
    }

    //Draw lines in polar coordinates.  Used for drawing clock hands and ticks.
    drawLineAngle(angle, color, width, rStart, rEnd)
    {
        this.ctx.beginPath();
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.moveTo(this.canvasMiddleX + rStart * Math.cos(angle), 
                        this.canvasMiddleY + rStart * Math.sin(angle));
        this.ctx.lineTo(this.canvasMiddleX + rEnd   * Math.cos(angle),
                        this.canvasMiddleY + rEnd   * Math.sin(angle));
        this.ctx.stroke();
    }

    //Draw arcs in polar coordinates.
    drawArc(startAngle, endAngle, radius, color, width)
    {
        this.ctx.beginPath();
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.arc(this.canvasMiddleX, this.canvasMiddleY, radius, startAngle, endAngle);
        this.ctx.stroke();
    }
}










/******************************************* Top Level *******************************************/
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

var debug = true; //Print console stuff if debugging.
var idNum = 0;    //Used to create unique IDs for weather station objects.

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
    database.ref('stations').push
    ({
        stationObj: JSON.stringify(response),
        dateAdded: firebase.database.ServerValue.TIMESTAMP
    });
    
    //Clear the input text box.
    $("#weather-input").val("");
}

/******************************** Add Station to Webpage Function ********************************/
//Event listener that gets called whenever a child is added stations.
var stationRef = firebase.database().ref("stations");
stationRef.on("child_added", function(snapshot)
{
    var childKey = snapshot.key; //Store the child's key.
    var sv = snapshot.val();     //Store the child's data.

    //----------------------- Variable Extraction ------------------------
    var  stationObj = JSON.parse(sv.stationObj);  //Extract station object data.

    //Extract desired variables from the station data set.
    var name = stationObj.weatherObj.name;
    var lat = stationObj.weatherObj.coord.lat;
    var lon = stationObj.weatherObj.coord.lon;
    var timeZone = stationObj.weatherObj.timezone;
    var isZip = stationObj.isZip;
    var zipString = stationObj.zipString;
    var city = stationObj.city;
    var country =stationObj.country;








    
    if(debug) console.log(stationObj);

    //------------------- Create Weather Station Card --------------------
    var card = $("<div>");
    card.addClass("card card-default");

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
        var ref = firebase.database().ref("stations/" + childKey);
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
        database.ref('links').push
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

    //------------------------- Clock Stuff -------------------------
    //Add a clock div.
    var clockDiv = $("<div>");
    clockDiv.addClass("border clock-div station-div mr-1");
    clockDiv.append("Local Time");
    cardBody.append(clockDiv);
    
    var clockID = "clock-canvas" + idNum;
    var clockCan = document.createElement("canvas");
    clockCan.id = clockID;
    clockCan.width = 151;
    clockCan.height = 151;
    
    var dTime = $("<div>");
    clockDiv.append(dTime);
    clockDiv.append(clockCan);
    cardBody.append(clockDiv);

    //Create the clock object.
    var clock = new AClock(document.getElementById(clockID));

    //Get current UTC time.
    var now = new Date();
    var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

    //Convert back to local time.
    var localTime = utcTime +(timeZone * 1000);
    clock.draw(moment(localTime));
    dTime.text(moment(localTime).format("hh:mm:ss A"));










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
    }, 200);

    //This function updates the weather info every 10 minutes and 10 seconds. The open
    //weather map API only updates its database every 10 minutes.
    setInterval(function()
    {










    }, 610000);

    //Always update idNum so everything can have a unique ID.
    idNum++;
});

/****************************** Add Quick Link to Webpage Function *******************************/
//Event listener that gets called whenever a child is added stations.
var linksRef = firebase.database().ref("links");
linksRef.on("child_added", function(snapshot)
{
    var childKey = snapshot.key; //Store the child's key.
    var sv = snapshot.val();     //Store the child's data.

    //Create quick link div.
    var linkDiv = $("<div>");
    linkDiv.addClass("link-div m-1");
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
    $("#links").append(linkDiv);

    //Remove entry from the webpage and database.
    remButton.on("click", function()
    {
        //Remove value from the webpage.
        linkDiv.remove();

        //Remove value from the database.
        var ref = firebase.database().ref("links/" + childKey);
        ref.remove();    
    });

    //Add weather station back into the main div.
    linkDiv.on("click", function()
    {
        queryWeather(sv.isZip, sv.zipString, sv.city, sv.country);
    });
});