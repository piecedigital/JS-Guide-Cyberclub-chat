$(document).ready(function() {
  function dragNdrop(dragTab) {
    console.log("calling dragNdrop");

    var x, y, mx, my;
    $(document).on("mousedown", dragTab, function(mouse) {
      console.log(this)
      mx = mouse.clientX;
      my = mouse.clientY;
      x = mx - $(this).parent().parent().offset().left;
      y = my - $(this).parent().parent().offset().top;
      
      $(this).parent().parent().addClass("draggable");
    });
    $(document).on("mouseup", function() {
      $(dragTab).parent().parent().removeClass("draggable");
    });
    $(document).on("mousemove", function(mouse) {
      if($(dragTab).parent().parent().hasClass("draggable")) {
        var mx = mouse.clientX;
        var my = mouse.clientY;
        //console.log(mx - x);
        //console.log(my - y);
        //console.log(mx);
        //console.log(my);
        //console.log(e);
        $(".draggable").css({ "top" : my - y, "left" : mx - x });
      }
    });
  }
  dragNdrop(dragTab);
});