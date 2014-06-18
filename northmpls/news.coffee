$(document).ready () ->
  $.ajaxSetup({ cache: true });
  $.getScript '//connect.facebook.net/en_US/sdk.js', () ->
    FB.init {
      appId: '109302492423481',
      version    : 'v2.0'
    }
    FB.api '/v2.0/436620656417436/feed', (response) ->
      console.log response

  fireRef = new Firebase 'https://northmpls.firebaseio.com/'

  auth = new FirebaseSimpleLogin fireRef, (err, user) ->
    if err
      console.log err
    else if user
      #console.log user
      userRef = fireRef.child 'user/'+user.uid
      # Update user in the database because this is fun info to have on hand.
      userRef.set user
      return
    else
      console.log 'user is logged out'
      auth.login 'google', {preferRedirect: true}

  LogRef = fireRef.child 'list_log'

  #endpoint = 'http://'+make_id+'.cape.io/_view/client_data/_output'

  return

