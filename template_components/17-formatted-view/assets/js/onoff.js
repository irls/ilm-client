$(".onoffswitch-checkbox").click(function() {
    if($(this).is(':checked')) {
        $("#mylabel").text("Enabled");
    } else {
        $("#mylabel").text("Diabled");
    }
});