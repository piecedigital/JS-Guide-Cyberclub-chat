$(document).ready(function() {
	$("label").on("touchend", function(e) {
		$("#" + $(this).attr("for") ).prop("checked", true);

		e.stopPropagation();
		e.preventDefault();
	});
	$("a").on("touchend", function(e) {
		window.location.href = $(this).attr("href");
		
		e.stopPropagation();
		e.preventDefault();
	});
	$("button").on("touchend", function(e) {
		$(this).parent().submit();
		
		e.stopPropagation();
		e.preventDefault();
	});
});