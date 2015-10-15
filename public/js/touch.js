$(document).ready(function() {
	$("label").on("touchend click", function(e) {
		e.stopPropagation();
		e.preventDefault();

		$("#" + $(this).attr("for") ).prop("checked", true);
	});
	$("a").on("touchend click", function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		window.location.href = $(this).attr("href");
	});
	$("button").on("touchend click", function(e) {
		e.stopPropagation();
		e.preventDefault();
		
		$(this).parent().submit();
	});
});