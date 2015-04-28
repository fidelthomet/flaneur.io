$(document).ready(function()
{
    var scale = 1;  // scale of the image
    var xLast = 0;  // last x location on the screen
    var yLast = 0;  // last y location on the screen
    var xImage = 0; // last x location on the image
    var yImage = 0; // last y location on the image

    // if mousewheel is moved
    $("body").mousewheel(function(e, delta)
    {
        // find current location on screen 
        var xScreen = e.pageX - $("#container_inner").offset().left;
        var yScreen = e.pageY - $("#container_inner").offset().top;

        // find current location on the image at the current scale
        xImage = xImage + ((xScreen - xLast) / scale);
        yImage = yImage + ((yScreen - yLast) / scale);

        // determine the new scale
        if (delta > 0)
        {
            scale *= 2;
        }
        else
        {
            scale /= 2;
        }
        scale = scale < 1 ? 1 : (scale > 64 ? 64 : scale);

        // determine the location on the screen at the new scale
        var xNew = (xScreen - xImage) / scale;
        var yNew = (yScreen - yImage) / scale;

        // save the current screen location
        xLast = xScreen;
        yLast = yScreen;

        // redraw
        $("#container_inner").css('-moz-transform', 'scale(' + scale + ')' + 'translate(' + xNew + 'px, ' + yNew + 'px' + ')')
                           .css('-moz-transform-origin', xImage + 'px ' + yImage + 'px')
        return false;
    });
});