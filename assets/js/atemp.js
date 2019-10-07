/************************************ Analog emperature Class ************************************/
//Options bit flags.
const HIDE_RING3       = 0x01; //Set = hide outer clock ring.
const HIDE_TEXT        = 0x02; //Set = hide "C" or "F" indicator.
const HIDE_NUMBERS     = 0x04; //Set = hide numbers.
const HIDE_FREEZE_TICK = 0x08; //Set = hide the freeze tick.
const HIDE_MAJOR_TICK3 = 0x10; //Set = hide major ticks.
const HIDE_MINOR_TICK3 = 0x20; //Set = hide minor ticks.
const HIDE_CENTER3     = 0x40; //Set = hide center circle.
const HIDE_NEEDLE      = 0x80; //Set = hide needle.

class ATemp
{
    constructor
    (
        //canvas in the only required parameter in the constructor.  It is the reference to the
        //canvas that the clock will be drawn on.  options holds the bit flags shown above.
        canvas, options = 0x00,

        //These variables are the colors of the various termometer components.
        freezeTickColor = "#0000ff", majorTickColor = "#666666", minorTickColor = "#666666",
        ringColor       = "#000000", textColor      = "#000000", numberColor    = "#000000",
        needleColor     = "#ff0000", centerColor    = "#000000",

        //These variables control the line widths of the wind vane components. and are percentages
        //of the drawing radius.
        freezeWidth = .03, majorWidth  = .03, minorWidth = .03, ringWidth = .02,
        needleWidth = .10, centerWidth = .03,

        //These variables control the length and sizes of the thermometer components. textRatio
        //and numberRatio are the sizes of the letters as a percentage of the radius size.
        //radiusLength scales the entire clock and is the percentage of the canvas that is used
        //by the wind vane(based on the shortest axis of the canvas). minorLength and majorLength,
        //are the lengths of the ticks on the outer thermometer. The length of the ticks is
        //1 - the given value.  For example, if minorLength is .90, then the total length of the
        //tick is 1 - .90 = .1. The minor ticks will be 10% of the clock radius. textRadius is
        //the percentage of the total circle where the text is drawn.
        freezeLength = .70, majorLength = .80, minorLength = .85, needleLength = .95, 
        textRatio    = .40, numberRatio = .20, textRadius  = .60, radiusLength = .95
    )
    {
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.options = options;
        this.canvasWidth;
        this.canvasHeight;
        this.canvasMiddleX;
        this.canvasMiddleY;
        this.radius;

        this.thisTheta;

        //Optional arguments from above.
        this.freezeTickColor = freezeTickColor;
        this.majorTickColor  = majorTickColor;
        this.minorTickColor  = minorTickColor;
        this.ringColor       = ringColor;
        this.textColor       = textColor;
        this.numberColor     = numberColor;
        this.needleColor     = needleColor;
        this.centerColor     = centerColor;
        this.freezeWidth     = freezeWidth;
        this.majorWidth      = majorWidth;
        this.minorWidth      = minorWidth;
        this.ringWidth       = ringWidth;
        this.needleWidth     = needleWidth;
        this.centerWidth     = centerWidth;
        this.freezeLength    = freezeLength;
        this.majorLength     = majorLength;
        this.minorLength     = minorLength;
        this.needleLength    = needleLength;
        this.textRatio       = textRatio;
        this.numberRatio     = numberRatio;
        this.textRadius      = textRadius;
        this.radiusLength    = radiusLength;
        
        //Calculate the number of radians per degree C.
        //Celsius ranges from -40 to 60 C(100 degree C span).
        this.radsPerC = (6 * Math.PI / 4) / 100;

        //Calculate the number of radians per degree F.
        //Fahrenheit ranges from -40 to 140 F(180 degree F span).
        this.radsPerF = (6 * Math.PI / 4) / 180;

        //Calculate degrees per minor tick in C(every 5 degrees C).
        this.radPerMinorC = (6 * Math.PI / 4) / 20;

        //Calculate degrees per major tick in C(every 10 degrees C).
        this.radPerMajorC = (6 * Math.PI / 4) / 10;

        //Calculate degrees to freezing tick in C(40 degrees C above minimum).
        this.radToFreezeC = this.radsPerC * 40;

        //Calculate degrees per minor tick in F(every 10 degrees F).
        this.radPerMinorF = (6 * Math.PI / 4) / 18;

        //Calculate degrees per major tick in F(every 20 degrees F).
        this.radPerMajorF = (6 * Math.PI / 4) / 9;

        //Calculate degrees to freezing tick in F(72 degrees F above minimum).
        this.radToFreezeF = this.radsPerF * 72;
    }

    //This is the function that draws the temperature dial. Temperature is in Kelvins,
    //convType is either C(for Celsius) or F(for Fahrenheit).
    draw(temperature, convType)
    {
        //Conversion type constants.
        this.C = 0;
        this.F = 1;

        //Get canvas height and width.
        this.canvasWidth  = this.canvas.clientWidth;
        this.canvasHeight = this.canvas.clientHeight;
                
        //Calculate the center of the canvas.
        this.canvasMiddleX = this.canvasWidth / 2;
        this.canvasMiddleY = this.canvasHeight / 2;

        //Calculate the drawing radius.
        this.radius = (this.canvasWidth > this.canvasHeight) ? 
                       this.canvasMiddleY : this.canvasMiddleX;
        this.radius *= this.radiusLength;

        //Clear the canvas.
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        //Convert temperature to C or F.
        temperature = this.tempCalc(temperature, convType);

        //Set the critical points for drawing F or C.
        if(convType === this.F)
        {
            this.minorTicks = 19;
            this.majorTicks = 10;
            this.radPerMinor = this.radPerMinorF;
            this.radPerMajor = this.radPerMajorF;
            this.radToFreeze = this.radToFreezeF;
            this.dNumber = 20;
            this.radsPerDeg = this.radsPerF;
            this.tempMax = 140;
            this.text = "F";
        }
        else
        {
            this.minorTicks = 21;
            this.majorTicks = 11;
            this.radPerMinor = this.radPerMinorC;
            this.radPerMajor = this.radPerMajorC;
            this.radToFreeze = this.radToFreezeC;
            this.dNumber = 10;
            this.radsPerDeg = this.radsPerC;
            this.tempMax = 60;
            this.text = "C";
        }

        //Check if the minor ticks are enabled.
        if(!(this.options & HIDE_MINOR_TICK3))
        {
            //Prepare to draw minor ticks.
            this.thisTheta = -5 * Math.PI / 4;

            //Draw minor ticks.
            for(let i = 0; i < this.minorTicks; i++)
            {
                this.drawLineAngle(this.thisTheta, this.minorTickColor,
                    this.radius * this.minorWidth, this.radius * this.minorLength,
                    this.radius *.95);
                this.thisTheta += this.radPerMinor;
            }
        }

        //Check if the major ticks are enabled.
        if(!(this.options & HIDE_MAJOR_TICK3))
        {
            //Prepare to draw major ticks.
            this.thisTheta = -5 * Math.PI / 4;

            //Draw major ticks.
            for(let i = 0; i < this.majorTicks; i++)
            {
                this.drawLineAngle(this.thisTheta, this.majorTickColor,
                    this.radius * this.majorWidth, this.radius * this.majorLength,
                    this.radius * .95);
                this.thisTheta += this.radPerMajor;
            }
        }

        //Check if the freeze tick is enabled.
        if(!(this.options & HIDE_FREEZE_TICK))
        {
            //Prepare to draw freezing point tick.
            this.thisTheta = (-5 * Math.PI / 4) + this.radToFreeze;

            //Draw tick for freezing mark.
            this.drawLineAngle(this.thisTheta, this.freezeTickColor,
                this.radius * this.freezeWidth, this.radius * this.freezeLength,
                this.radius * .95);
        }

        //Check if the numbers are enabled.
        if(!(this.options & HIDE_NUMBERS))
        {
            //prepare to draw the numbers.
            this.thisTheta = (-5 * Math.PI / 4);
            this.thisNumber = -40;

            //Draw the numbers.
            for(let i = 0; i < this.majorTicks; i++)
            {
                //Prepend blank spaces to align the numbers on the dial.
                this.numText = this.thisNumber;
                if(this.thisNumber < 100 && this.thisNumber > -1)
                {
                    this.numText = " " + this.numText;
                }

                if(this.thisNumber < 10 && this.thisNumber > -1)
                {
                    this.numText = " " + this.numText;
                }

                this.drawTextAngle(this.thisTheta, this.numText, this.numberColor,
                    this.numberRatio, this.textRadius);
                this.thisTheta += this.radPerMajor;
                this.thisNumber += this.dNumber;
            }
        }

        //Check if the needle is enabled.
        if(!(this.options & HIDE_NEEDLE))
        {
            //Clamp the minimum and maximum values of the temperature.
            if(temperature < -40)
            {
                temperature = -40;
            }

            if(temperature > this.tempMax)
            {
                temperature = this.tempMax;
            }

            //Calculate difference in temperature from minimum value.
            this.dTemperature = temperature + 40;

            //Calculate the angle to draw the needle.
            this.handAngle = (-5 * Math.PI / 4) + this.dTemperature * this.radsPerDeg;

            //Draw the needle on the dial.
            this.drawTriangle(this.handAngle, this.needleColor, this.needleWidth,
                this.needleLength);
        }

        //Check if the center is enabled.
        if(!(this.options & HIDE_CENTER3))
        {
            //Draw the center circle of the dial.
            this.drawArc(0, 2 * Math.PI, this.radius * this.centerWidth, this.centerColor,
                this.radius * this.centerWidth * 2);
        }

        //Check if the text is enabled.
        if(!(this.options & HIDE_TEXT))
        {
            //Draw F or C.
            var textSize = this.radius * this.textRatio;
            this.ctx.font = textSize + "px Arial";
            this.ctx.fillStyle = this.textColor;
            this.ctx.fillText(this.text, this.canvasMiddleX - textSize * .35,
                this.canvasMiddleY + this.radius * .95 - .50 * textSize);
        }

        //Check if the outer ring is enabled.
        if(!(this.options & HIDE_RING3))
        {
            //Draw semi-circle around dial.
            this.drawArc(-5 * Math.PI / 4,  Math.PI / 4, this.radius, this.ringColor,
                this.radius * this.ringWidth);
        }
    }

    //Draw the needle on the dial.
    drawTriangle(angle, color, base, height)
    {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.moveTo(this.canvasMiddleX + this.radius * height * Math.cos(angle), 
                        this.canvasMiddleY + this.radius * height * Math.sin(angle));
        this.ctx.lineTo(this.canvasMiddleX + this.radius * base / 2 * Math.cos(angle + Math.PI/2),
                        this.canvasMiddleY + this.radius * base / 2 * Math.sin(angle + Math.PI/2));
        this.ctx.lineTo(this.canvasMiddleX + this.radius * base / 2 * Math.cos(angle - Math.PI/2), 
                        this.canvasMiddleY + this.radius * base / 2 * Math.sin(angle - Math.PI/2));
        this.ctx.fill();
    }

    //Draw text in polar coordinates.  Used for drawing temperature numbers.
    drawTextAngle(angle, text, color, ratio, textRadius)
    {
        var textSize = this.radius * ratio;
        this.ctx.font = textSize + "px Arial";
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, this.canvasMiddleX - (textSize * .8) + 
                                this.radius * textRadius * Math.cos(angle), 
                                this.canvasMiddleY + (textSize * .2) +
                                this.radius * textRadius * Math.sin(angle));   
    }

    //Draw lines in polar coordinates.  Used for drawing temperature ticks.
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

    //Convert Kelvin to Celsius or Fahrenheit
    tempCalc(temperature, convType)
    {
        const C = 0;
        return convType === C ? temperature - 273.15 : temperature * 9/5 - 459.67;
    }
}