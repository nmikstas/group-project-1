/************************************** Analog Clock Class ***************************************/
//NOTE: If subseconds is active and AClock is being used to animate a clock, the timer interval
//for the animation shoud be 80 milliseconds to ensure a proper sweeping motion of the second
//hand.  If subseconds is disabled, 490 milliseconds should be used.
class AClock
{
    //Options bit flags.
    static get SUBSECONDS()      {return 0x001} //Set = second hand moves every 1/6th of a second.
    static get HIDE_RING()       {return 0x002} //Set = hide outer clock ring.
    static get HIDE_CENTER()     {return 0x004} //Set = hide center circle.
    static get HIDE_SECONDS()    {return 0x008} //Set = hide second hand.
    static get HIDE_MINUTES()    {return 0x010} //Set = hide minute hand.
    static get HIDE_HOURS()      {return 0x020} //Set = hide hour hand.
    static get HIDE_MINUTE_TICK(){return 0x040} //Set = hide minute ticks.
    static get HIDE_MINOR_TICK() {return 0x080} //Set = hide minor hour ticks.
    static get HIDE_MAJOR_TICK() {return 0x100} //Set = hide major hour ticks.

    constructor
    (
        //canvas in the only required parameter in the constructor.  It is the reference to the
        //canvas that the clock will be drawn on.  options holds the bit flags shown above.
        canvas, options = 0x000,

        //These variables are the colors of the various clock components.
        secondColor     = "#ff0000", minuteColor    = "#000000", hourColor      = "#000000", 
        outerRingColor  = "#000000", centerColor    = "#000000",
        minuteTickColor = "#8f8f8f", minorTickColor = "#8f8f8f", majorTickColor = "#8f8f8f",

        //These variables control the line widths of the wind vane components. and are percentages
        //of the drawing radius.
        secondWidth     = .03, minuteWidth    = .05, hourWidth      = .07,
        outerRingWidth  = .04, centerWidth    = .03,
        minuteTickWidth = .01, minorTickWidth = .02, majorTickWidth = .04,

        //These variables control the lengths and radiuses of the clock components.
        //radiusLen scales the entire clock and is the percentage of the canvas that is used
        //by the clock(based on the shortest axis of the canvas). secondLen, minuteLen and hourLen
        //control the hand lengths.  The values represent a percentage of the clock radius.
        //centerRad is the radius of the center circle in pixels. minuteTickLen, minorTickLen,
        //and majorTickLen are the lengths of the ticks on the outer clock ring. The length of
        //the ticks is 1 - the given value.  For example, if minuteTickLen is .90, then the total
        //length of the tick is 1 - .90 = .1. The minute ticks will be 10% of the clock radius.
        secondLen     = .90, minuteLen    = .75, hourLen      = .60,
        radiusLen     = .95,
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
        
        var thisTheta;

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
        if(!(this.options & AClock.HIDE_MINUTE_TICK))
        {
            //Prepare to draw 60 minute ticks.
            thisTheta = 0;

            //Draw the minute ticks.
            for(let i = 0; i < 60; i++)
            {
                this.drawLineAngle(thisTheta, this.minuteTickColor, 
                    this.radius * this.minuteTickWidth, this.radius * this.minuteTickLen,
                    this.radius);
                thisTheta += Math.PI / 30;
            }
        }

        //Check if minor hour ticks are enabled.
        if(!(this.options & AClock.HIDE_MINOR_TICK))
        {
            //Prepare to draw 12 hour ticks.
            thisTheta = 0;

            //Draw the minor hour ticks.
            for(let i = 0; i < 12; i++)
            {
                this.drawLineAngle(thisTheta, this.minorTickColor,
                    this.radius * this.minorTickWidth, this.radius * this.minorTickLen,
                    this.radius);
                thisTheta += Math.PI / 6;
            }
        }

        //Check if major hour ticks are enabled.
        if(!(this.options & AClock.HIDE_MAJOR_TICK))
        {
            //Prepare to draw 4 hour ticks at 3, 6, 9 and 12.
            thisTheta = 0;

            //Draw the major hour ticks.
            for(let i = 0; i < 4; i++)
            {
                this.drawLineAngle(thisTheta, this.majorTickColor,
                    this.radius * this.majorTickWidth, this.radius * this.majorTickLen,
                    this.radius);
                thisTheta += Math.PI / 2;
            }
        }

        //Check if the outer ring is enabled.
        if(!(this.options & AClock.HIDE_RING))
        {
            //Draw the circle of the clock face.
            this.drawArc(0, 2 * Math.PI, this.radius, this.outerRingColor,
                this.radius * this.outerRingWidth);
        }

        //Check if hour hand is enabled
        if(!(this.options & AClock.HIDE_HOURS))
        {
            //Calculate the current piece the hour hand is on.
            thisPiece = Math.round(hour * 30 + min / 2);

            //Calculate Current angle of the hour hand.  12 o'clock is at -PI/2.
            thisTheta = -Math.PI / 2  + this.oneDegree * thisPiece;

            //Draw the hour hand.
            this.drawLineAngle(thisTheta, this.hourColor, this.radius * this.hourWidth,
                               0, this.radius * this.hourLen);
        }

        //Check if minute hand is enabled
        if(!(this.options &AClock. HIDE_MINUTES))
        {
            //Calculate the current piece the minute hand is on.
            thisPiece = Math.round(min * 6 + sec / 10);

            //Calculate Current angle of the minute hand.  12 o'clock is at -PI/2.
            thisTheta = -Math.PI / 2  + this.oneDegree * thisPiece;

            //Draw the minute hand.
            this.drawLineAngle(thisTheta, this.minuteColor, this.radius * this.minuteWidth,
                               0, this.radius * this.minuteLen);
        }

        //Check if second hand is enabled.
        if(!(this.options & AClock.HIDE_SECONDS))
        {
            //Calculate the current piece the second hand is on.
            var thisPiece = sec * 6;

            //Check if subseconds are enabled.
            if(this.options & AClock.SUBSECONDS)
            {
                thisPiece += Math.round(mil * this.secondConst);
            }

            //Calculate Current angle of the second hand.  12 o'clock is at -PI/2.
            var thisTheta = -Math.PI / 2 + this.oneDegree * thisPiece;

            //Draw the second hand.
            this.drawLineAngle(thisTheta, this.secondColor, this.radius * this.secondWidth,
                               0, this.radius * this.secondLen);
        }

        //Check if the center is enabled.
        if(!(this.options & AClock.HIDE_CENTER))
        {
            //Draw the inner circle the hands attach to.
            this.drawArc(0, 2 * Math.PI, this.radius * this.centerWidth, this.centerColor,
                this.radius * this.centerWidth * 2);
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