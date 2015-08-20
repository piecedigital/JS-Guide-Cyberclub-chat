function dragNdrop(parent, item, dragTab) {
  var x, y, mx, my, lastItem;
  
  //click event
  $(document).on("mousedown", item, function(mouse) {
    mx = mouse.clientX;
    my = mouse.clientY;
    x = mx - $(this).offset().left;
    y = my - $(this).offset().top;
    
    var width = $(this).width();
    var height = $(this).height();
    lastItem = $(item + ":last").offset().top;
    
    $(this).css({ "width" : width, "height" : height });
    $(this).after("<li id='place-holder'></li>");
    $("#place-holder").css({ "height" : $(this).height() });
    $(this).addClass("draggable");
  });
  //drag event
  $(document).on("mousemove", function(mouse) {
    var holdPlace = $("#place-holder");
    //if($(item).hasClass("draggable")) {}
    mx = mouse.clientX;
    my = mouse.clientY;
    
    var item = $(item);
    for(i = item.length - 1; i >= 0; i--) {
      console.log($(item[i]).find("span").html());
      if(!$(item[i]).hasClass("draggable")) {
      //if(true) {
        var dragTop = $(".draggable").offset().top;
        var noDrag = $(item[i]).offset().top;
        
        //console.log(lastItem);
        if(dragTop > lastItem) {
          //console.log($(item[i]).html());
          $("#place-holder").remove();
          $(parent).append(holdPlace);
        }
        if(dragTop < noDrag) {
          //console.log($(item[i]).html());
          $("#place-holder").remove();
          $(item[i]).before(holdPlace);
          console.log(noDrag);
        }
      }
    }
    $(".draggable").css({ "top" : my - y});//, "left" : mx - x });
      
  });
  //mouse release event
  $(document).on("mouseup", function() {
    if($(item).hasClass("draggable")) {
      deselect();
    }
    var toPlace = $(".draggable");
    $(".draggable").remove();
    //console.log(toPlace);
    $(document).find("#place-holder").after(toPlace).remove();
    $(item).attr("style", "").removeClass("draggable");
    console.log($(item));
  });
  function deselect() {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else
      if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else
    if (document.selection) {  // IE?
      document.selection.empty();
    }
  }
}