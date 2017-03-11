$("..onoffswitch-checkbox").click(function() {
    if($(this).is(':checked')) {
        $("#mystatus").text("Published, ver 3.1");
    } else {
        $("#mystatus").text("Unpublished, ver 0.1");
    }
});