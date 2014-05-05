$(document).ready(function() {
  if (!window.make_id) {
    var make_id = 'mortenson';
    console.log('No container_bucket variable found or it is false');
  }
  else {
    make_id = window.make_id
  }
  var endpoint = 'http://'+make_id+'.cape.io/_view/client_data/_output';
  function update() {
    $.getJSON(endpoint, function(data) {
      if (data) {
        var template = Hogan.compile($('#slideshow-template').html());
        $('div#slideshow').append(template.render(data));
      }
    });
  }
  setInterval(update, 30000);
  update();

});