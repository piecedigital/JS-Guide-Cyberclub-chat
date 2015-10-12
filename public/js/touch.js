$(document).ready(function() {
	$("label").on("touchstart click", function(e) {
		e.stopPropagation();
		e.preventDefault();

		$("#" + $(this).attr("for") ).prop("checked", true);
	});
	$("a").on("touchstart click", function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		window.location.href = $(this).attr("href");
	});
	$("button").on("touchstart click", function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		$(this).parent().submit();
	});
});