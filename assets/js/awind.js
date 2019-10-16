/**************************************** Wind Vane Class ****************************************/
class AWind
{
    //Options bit flags.
    static get HIDE_N()         {return 0x01} //Set = hide the letter N.
    static get HIDE_ESW()       {return 0x02} //Set = hide the letters E, S and W.
    static get HIDE_MAJOR_TICK(){return 0x04} //Set = hide the major ticks.
    static get HIDE_MINOR_TICK(){return 0x08} //Set = hide the minor ticks.
    static get HIDE_CENTER()    {return 0x10} //Set = hide the center circle.
    static get HIDE_ARROW()     {return 0x20} //Set = hide the arrow.

    constructor
    (
        //canvas in the only required parameter in the constructor.  It is the reference to the
        //canvas that the clock will be drawn on.  options holds the bit flags shown above.
        canvas, options = 0x00,

        //These variables are the colors of the various wind vane components.
        nColor      = "#ff0000", eswColor   = "#7f7f7f", arrowColor = "#000000",
        centerColor = "#000000", majorColor = "#7f7f7f", minorColor = "#7f7f7f",

        //These variables control the line widths of the wind vane components. and are percentages
        //of the drawing radius.
        arrowWidth = .04, pointerWidth = .06, centerWidth = .03,
        majorWidth = .06, minorWidth   = .04,

        //These variables control the length and sizes of the wind vane components. nRatio and
        //eswRatio are the sizes of the letters as a percentage of the radius size.  radiusLen
        //scales the entire clock and is the percentage of the canvas that is used by the
        //wind vane(based on the shortest axis of the canvas). minorTickLen and majorTickLen,
        //are the lengths of the ticks on the outer wind vane. The length of the ticks is
        //1 - the given value.  For example, if minorTickLen is .90, then the total length of
        //the tick is 1 - .90 = .1. The minor ticks will be 10% of the clock radius.
        nRatio       = .40, eswRatio  = .40, majorTickLen = .40, 
        minorTickLen = .70, radiusLen = .95
    )
    {
        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;
        this.canvasWidth;
        this.canvasHeight;
        this.canvasMiddleX;
        this.canvasMiddleY;
        this.radius;
        this.direction;

        //Optional arguments from above.
        this.options      = options;
        this.nColor       = nColor;
        this.eswColor     = eswColor;
        this.arrowColor   = arrowColor;
        this.centerColor  = centerColor;
        this.majorColor   = majorColor;
        this.minorColor   = minorColor;
        this.arrowWidth   = arrowWidth;
        this.pointerWidth = pointerWidth;
        this.centerWidth  = centerWidth;
        this.majorWidth   = majorWidth;
        this.minorWidth   = minorWidth;
        this.nRatio       = nRatio;
        this.eswRatio     = eswRatio;
        this.majorTickLen = majorTickLen;
        this.minorTickLen = minorTickLen;
        this.radiusLen    = radiusLen;

        //Convert radians to degrees (divide face into 360 pieces).
        this.oneDegree = Math.PI / 180;
    }

    //This is the function that draws a wind vane from degrees.
    draw(degrees)
    {
        //Get canvas height and width.
        this.canvasWidth  = this.canvas.clientWidth;
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

        //Calculate the direction of the wind in radians.
        this.direction = -Math.PI / 2 + Math.round(degrees) * this.oneDegree;

        var thisTheta;

        //Check if minor ticks are enabled.
        if(!(this.options & AWind.HIDE_MINOR_TICK))
        {
            //Prepare to draw 8 minor ticks.
            thisTheta = 0;

            //Draw the minor ticks.
            for(let i = 0; i < 16; i++)
            {
                //Dont draw minor ticks over the letters.
                if(i !== 0 && i !== 4 && i !== 8 && i !== 12)
                {
                    this.drawLineAngle2(thisTheta, thisTheta, this.minorColor,
                        this.radius * this.minorWidth, this.radius * this.minorTickLen,
                        this.radius);
                }
                thisTheta += Math.PI / 8;
            }
        }

        //Check if major ticks are enabled.
        if(!(this.options & AWind.HIDE_MAJOR_TICK))
        {
            //Prepare to draw 4 major ticks.
            thisTheta = Math.PI / 4;

            //Draw the major ticks.
            for(let i = 0; i < 4; i++)
            {
                this.drawLineAngle2(thisTheta, thisTheta, this.majorColor, 
                    this.radius * this.majorWidth, this.radius * this.majorTickLen,
                    this.radius);
                thisTheta += Math.PI / 2;
            }
        }

        //Check if the letter N are enabled.
        if(!(this.options & AWind.HIDE_N))
        {
            //Draw N.
            var textSize = this.radius * this.nRatio;
            this.ctx.font = textSize + "px Arial";
            this.ctx.fillStyle = this.nColor;
            this.ctx.fillText("N", this.canvasMiddleX - textSize * .35, 
                                   this.canvasMiddleY - this.radius * .85 + .50 * textSize);
        }

        //Check if the letters E, S and W are enabled.
        if(!(this.options & AWind.HIDE_ESW))
        {
            //Draw E, S, W.
            var textSize = this.radius * this.eswRatio;
            this.ctx.font = textSize + "px Arial";
            this.ctx.fillStyle = this.eswColor;
            this.ctx.fillText("E", this.canvasMiddleX + this.radius - textSize * .80, 
                                   this.canvasMiddleY + .40 * textSize);
            this.ctx.fillText("S", this.canvasMiddleX - textSize * .35, 
                                   this.canvasMiddleY + this.radius * .75 + .50 * textSize);
            this.ctx.fillText("W", this.canvasMiddleX - this.radius + textSize * .15, 
                                   this.canvasMiddleY + .40 * textSize);
        }

        //Check if arrow is enabled.
        if(!(this.options & AWind.HIDE_ARROW))
        {
            //Draw the back shaft portion of the wind vane.
            this.drawLineAngle2(this.direction, this.direction, this.arrowColor,
                                this.radius * this.arrowWidth, 0, this.radius * .60);

            //Draw the front shaft portion of the wind vane.
            this.drawLineAngle2(this.direction + Math.PI, this.direction + Math.PI,
                                this.arrowColor, this.radius * this.arrowWidth, 0,
                                this.radius * .80);

            //Draw arrow front.
            this.drawLineAngle2(this.direction + Math.PI, this.direction + Math.PI + .2,
                                this.arrowColor, this.radius * this.pointerWidth, 
                                this.radius * .78, this.radius * .60);
            this.drawLineAngle2(this.direction + Math.PI, this.direction + Math.PI - .2,
                                this.arrowColor, this.radius * this.pointerWidth, this.radius * .78,
                                this.radius * .60);

            //Draw arrow back.
            this.drawLineAngle2(this.direction, this.direction + .20, this.arrowColor,
                this.radius * this.pointerWidth, this.radius * .60, this.radius * .80);
            this.drawLineAngle2(this.direction, this.direction - .20, this.arrowColor,
                this.radius * this.pointerWidth, this.radius * .60, this.radius * .80);
            this.drawLineAngle2(this.direction, this.direction + .27, this.arrowColor,
                this.radius * this.pointerWidth, this.radius * .40, this.radius * .65);
            this.drawLineAngle2(this.direction, this.direction - .27, this.arrowColor,
                this.radius * this.pointerWidth, this.radius * .40, this.radius * .65);
        }

        //Check if center is enabled.
        if(!(this.options & AWind.HIDE_CENTER))
        {
            //Draw the center circle of the wind vane.
            this.drawArc(0, 2 * Math.PI, this.radius * this.centerWidth, this.centerColor,
                this.radius * this.centerWidth * 2);
        }
    }

    //Draw lines in polar coordinates. Not limited to radius lines.
    drawLineAngle2(angle1, angle2, color, width, rStart, rEnd)
    {
        this.ctx.beginPath();
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;
        this.ctx.moveTo(this.canvasMiddleX + rStart * Math.cos(angle1), 
                        this.canvasMiddleY + rStart * Math.sin(angle1));
        this.ctx.lineTo(this.canvasMiddleX + rEnd   * Math.cos(angle2),
                        this.canvasMiddleY + rEnd   * Math.sin(angle2));
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