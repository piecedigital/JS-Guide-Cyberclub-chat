var getData = function (data) {
  var obj = {};
  data.serializeArray()
    .map(function(elem) {
    obj[elem.name] = elem.value;
  });
  return obj;
};
var removeBackdrop = function() {
  $(".back-drop").remove();
};
var backdrop = function() {
  removeBackdrop();
  $("body").append(
    $("<div>")
    .addClass("back-drop")
    .css({
      "z-index": 10,
      "position": "fixed",
      "top": 0,
      "left": 0,
      "width": "100%",
      "height": "100%",
      "background-color": "black",
      "opacity": .5
    })
  );
};
var alert2 = function(msg, cb) {
	$(".alert-box").remove();
  // append back drop
  backdrop();
  // append dialog box
  $("body").append(
    $("<div>").addClass("alert-box").html(
    	$("<div>").addClass("alert").attr({
      "type": "post"
	    }).append(
	      $("<p>").text(msg),
	      $("<div>").addClass("commands").append(
	        $("<form>").append(
	          $("<input>").attr({
	            "type": "hidden",
	            "name": "action",
	            "value": true,
	          }),
	          $("<button>").text("OK")
	        )
	      )
	    )
    )
  );
  $(".alert-box input[value='true']").parent().find("button").focus();

  $(document).on("click", ".alert form button", function(e) {
    e.preventDefault();

    var data = getData( $(this).parent() );
    $(".alert").parent().remove();
    if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
    removeBackdrop();
    return null;
  });
}
var confirm2 = function(msg, cb) {
	$(".alert-box").remove();
  // append back drop
  backdrop();
  // append dialog box
  $("body").append(
    $("<div>").addClass("alert-box").html(
    	$("<div>").addClass("alert").attr({
      "type": "post"
	    }).append(
	      $("<p>").text(msg),
	      $("<div>").addClass("commands").append(
	        $("<form>").append(
	          $("<input>").attr({
	            "type": "hidden",
	            "name": "action",
	            "value": true,
	          }),
	          $("<button>").text("OK")
	        ),
	        $("<form>").append(
	          $("<input>").attr({
	            "type": "hidden",
	            "name": "action",
	            "value": false,
	          }),
	          $("<button>").text("Cancel")
	        )
	      )
	    )
    )
  );
  $(".alert-box input[value='true']").parent().find("button").focus();

  $(document).on("click", ".alert form button", function(e) {
    e.preventDefault();

    var data = getData( $(this).parent() );
    $(".alert").parent().remove();
    if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
    removeBackdrop();
    return false;
  });
}
var prompt2 = function(msg, defaultVal, cb) {
	$(".alert-box").remove();
  // append back drop
  backdrop();
  // append dialog box
  $("body").append(
    $("<div>").addClass("alert-box").html(
    	$("<div>").addClass("alert").attr({
      "type": "post"
	    }).append(
	      $("<p>").text(msg),
	      $("<div>").addClass("commands").html(
	      	$("<form>").addClass("top-form").append(
	      		$("<input>").attr({
	      			"type": "text",
	      			"name": "response",
	      			"value": defaultVal || ""
	      		}),
		        $("<form>").addClass("true").append(
		          $("<input>").attr({
		            "type": "hidden",
		            "name": "action",
		            "value": true,
		          }),
		          $("<button>").text("OK")
		        ),
		        $("<form>").addClass("false").append(
		          $("<input>").attr({
		            "type": "hidden",
		            "name": "action",
		            "value": false,
		          }),
		          $("<button>").text("Cancel")
		        )
	      	)
	      )
	    )
    )
  );
  $(".alert-box .top-form input[type='text']").focus();

  $(document).on("keydown", ".alert .top-form", function(e) {
  	if(e.keyCode === 13) {
      $(this).parent().find("form.true").submit();
	  	return false;
  	}
  });

  $(document).on("submit", ".alert form form.true", function(e) {
    e.preventDefault();
  	var data = getData( $(this).parent() );
  	data.action = "true";
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
    removeBackdrop();
  });
  $(document).on("click", ".alert form form.true button", function(e) {
    e.preventDefault();
  	var data = getData( $(this).parent().parent() );
  	data.action = "true";
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
    removeBackdrop();
  });

  $(document).on("submit", ".alert form form.false", function(e) {
    e.preventDefault();
    var data = getData( $(this) );
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
    removeBackdrop();
  });
  $(document).on("submit", ".alert form form.false button", function(e) {
    e.preventDefault();
    var data = getData( $(this).parent() );
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
    removeBackdrop();
  });
}
