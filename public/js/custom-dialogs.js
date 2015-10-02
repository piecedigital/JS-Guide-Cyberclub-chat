var alert2 = function(msg, cb) {
	$(".alert-box").remove();
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

  $(document).on("click", ".alert form button", function(e) {
    e.preventDefault();
    
    var data = getData( $(this).parent() );
    $(".alert").parent().remove();
    if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
    return null;
  });
}
var confirm2 = function(msg, cb) {
	$(".alert-box").remove();
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

  $(document).on("click", ".alert form button", function(e) {
    e.preventDefault();
    
    var data = getData( $(this).parent() );
    $(".alert").parent().remove();
    if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
    return false;
  });
}
var prompt2 = function(msg, defaultVal, cb) {
	$(".alert-box").remove();
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

  $(document).on("keydown", ".alert .top-form", function(e) {
  	if(e.keyCode === 13) {
	  	return false;
  	}
  	return false;
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
  });

  $(document).on("submit", ".alert form form.false", function(e) {
    e.preventDefault();
    var data = getData( $(this) );
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
  });
  $(document).on("submit", ".alert form form.false button", function(e) {
    e.preventDefault();
    var data = getData( $(this).parent() );
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	cb(data);
    	cb = null;
    }
  });
}