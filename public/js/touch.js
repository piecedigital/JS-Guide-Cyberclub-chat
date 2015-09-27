$(document).ready(function() {
	$("label").on("touchstart mousedown", function(e) {
		e.stopPropagation();
		e.preventDefault();

		$("#" + $(this).attr("for") ).prop("checked", true);
	});
	$("a").on("touchstart mousedown", function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		window.location.href = $(this).attr("href");
	});
	$("button").on("touchstart mousedown", function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		$(this).parent().submit();
	});
});