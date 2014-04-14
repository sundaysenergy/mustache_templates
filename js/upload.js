window.log = function() {
  window.console && window.console.log && window.console.log.apply(window.console, arguments);
};

$(document).ready(function() {
  if (!window.make_id) {
    var make_id = 'files';
    console.log('No container_bucket variable found or it is false');
  }
  else {
    make_id = window.make_id
  }
  var endpoint = 'http://'+make_id+'.cape.io/_cdn';
  $.getJSON(endpoint, function(data) {
    var cdnuri = data.container.cdnUri;
    for (var i=0; i<data.files.length; i++) {
      data.files[i].cdn = data.container.cdnUri;
    }
    var template = Hogan.compile('{{#files}}<tr><td style="width: 15%">{{#image}}<img class="img-responsive" src="{{cdn}}/{{path}}">{{/image}}</td><td class="path">{{path}}</td><td><button class="btn btn-primary" data-toggle="modal" data-target="#myModal"><i class="fa fa-download"></i></button> <button class="btn btn-danger"><i class="fa fa-trash-o"></i></button></td></tr>{{/files}}');
    var markdown = Hogan.compile('<input type="text" value="{{{markdown}}}" style="border:0; width:100%">');
    $('div#cffiles tbody.list').append(template.render(data));
    var options = {
      valueNames: [ 'path' ]
    };
    cffiles = new List('cffiles', options)
    .on('updated', function() {
      $('button .fa-trash-o').parent().on('click touch', function(e) {
        var filename = $(this).closest('tr').find('td.path').html();
        $(this).closest('tr').remove();
        $.ajax({
          url: endpoint+'/'+filename,
          type: 'DELETE',
          success: function(result) {
            log(result);
          }
        });
      });
      $('button .fa-download').parent().on('click touch', function(e) {
        var filename = $(this).closest('tr').find('td.path').html();
        var image = ($(this).closest('tr').find('td:nth-of-type(1)').html().length > 0);
        var converted = image ? '!['+filename+']('+cdnuri+'/'+filename+')':'[Link Text]('+cdnuri+'/'+filename+')';
        console.log(converted);
        $('div.modal-body').html(markdown.render({markdown:converted}));
        $('div.modal-body input').each(function() {
          $(this).on('click', function() {
            $(this).select();
          });
        });
      });
    });
    cffiles.update();
    var $dropBox = $("#drop-box");
    var $uploadForm = $("#upload-form");
    var exitedToForm = false;
    var highlighted = false;
    var highlight = function(mode) {
      mode ? $dropBox.addClass('highlighted') : $dropBox.removeClass('highlighted');
    };
    $dropBox.on({
      dragenter: function() {
        highlight(true);
      },
      dragover: function() {
        highlighted || highlight(true);
        return false; // To prevent default action
      },
      dragleave: function() {
        setTimeout(function() {
          exitedToForm || highlight(false);
        }, 50);
      },
      drop: function() {
        highlight(false);
      }
    });
    $uploadForm.on({
      dragenter: function() {
        exitedToForm = true;
        highlighted || highlight(true);
      },
      dragleave: function() {
        exitedToForm = false;
      }
    });

    var $fileInput = $('#file-input');
    var $dropBox = $('#drop-box');
    var $uploadForm = $('#upload-form');
    var $uploadRows = $('#upload-rows');
    var $clearBtn = $('#clear-btn');
    var $sendBtn = $('#send-btn');
    var $textAddBtn = $('#text-add-btn');

    $fileInput.damnUploader({
      url: endpoint + '/upload',
      fieldName: 'file',
      dropBox: $dropBox,
      limit: false,
      dataType: 'json'
    });

    var isImgFile = function(file) {
      return file.type.match(/image.*/);
    };

    var createRowFromUploadItem = function(ui) {
      var $row = $('<tr/>').prependTo($uploadRows);
      var $progressBar = $('<div/>').addClass('progress-bar').css('width', '0%');
      var $pbWrapper = $('<div/>').addClass('progress').append($progressBar);

      // Defining cancel button & its handler
      var $cancelBtn = $('<a/>').attr('href', 'javascript:').append(
        $('<span/>').addClass('glyphicon glyphicon-remove')
      ).on('click', function() {
        var $statusCell = $pbWrapper.parent();
        $statusCell.empty().html('<i>cancelled</i>');
        ui.cancel();
        log((ui.file.name || "[custom-data]") + " canceled");
      });

      // Generating preview
      var $preview;
      if (isImgFile(ui.file)) {
        $preview = $('<img/>').attr('width', 120);
        ui.readAs('DataURL', function(e) {
          $preview.attr('src', e.target.result);
        });
      } else {
        $preview = $('<i>no preview</i>');
      }

      // Appending cells to row
      $('<td/>').append($preview).appendTo($row); // Preview
      $('<td/>').text(ui.file.name).appendTo($row); // Filename
      $('<td/>').text(Math.round(ui.file.size / 1024) + ' KB').appendTo($row); // Size in KB
      $('<td/>').append($pbWrapper).appendTo($row); // Status
      $('<td/>').append($cancelBtn).appendTo($row); // Cancel button
      return $progressBar;
    };

    // File adding handler
    var fileAddHandler = function(e) {
      var ui = e.uploadItem;
      var filename = ui.file.name || "";
      ui.addPostData('original-filename', filename);
      var $progressBar = createRowFromUploadItem(ui);
      ui.completeCallback = function(success, result, errorCode) {
        if (success) {
          var image = (result.file.type.match(/image.*/) !== null) ? cdnuri+'/'+filename:false;
          cffiles.add({path:filename});
          cffiles.update();
          $('div#cffiles tbody.list tr').last().find('td:nth-of-type(1) img').attr('src', image);
          if (!image) $('div#cffiles tbody.list tr').last().find('td:nth-of-type(1) img').remove();
        } else {
          log('uploading failed. Response code is:', errorCode);
        }
      };

      ui.progressCallback = function(percent) {
        $progressBar.css('width', Math.round(percent) + '%');
        if (Math.round(percent) == 100) {
          $progressBar.closest('tr').find('span.glyphicon-remove').remove();
          $progressBar.addClass('progress-bar-success');
        }
      };

      ui.upload();
    };

    $fileInput.on({
      'du.add': fileAddHandler,
      'du.limit': function() {
        log("File upload limit exceeded!");
      },
      'du.completed': function() {
        log('******');
        log("All uploads completed!");
      }
    });

    $clearBtn.on('click', function() {
      $fileInput.duCancelAll();
      $uploadRows.empty();
      log('******');
      log("All uploads canceled :(");
    });

    $uploadForm.on('submit', function(e) {
      if ($.support.fileSending) {
        e.preventDefault();
        $fileInput.duStart();
      }
    });
  });
});