window.onload = function() {
    
    var me = {};
    var socket = io.connect('http://localhost:6969');
    var msg = document.getElementById("msg");
    var send = document.getElementById("send");
    var content = document.getElementById("content");
 
    socket.on('messageReceived', function (data) {
        if(data.message) {
            console.log(socket);
            content.innerHTML += '<b>' + (data.from === me.id ? 'Me' : 'Stranger') + ': </b>';
            content.innerHTML += data.message + '</br>';
            content.scrollTop = content.scrollHeight;
        } 
        else {
            console.log("There is a problem:", data);
        }

    });

    socket.on('requestData', function (person) {
        me = person;
        // show UI modal dialog asking to input the data
        // and possible search criteria

        var criteria = {};
        socket.emit('updateData',me);
        socket.emit('findPartner',criteria);
    });

    socket.on('waitingForPartner', function () {
       content.innerHTML += '<i>Waiting for partner...</i></br>';
    });

    socket.on('readyToChat', function (person) {
        me = person;
        content.innerHTML += '<i>Chat started! :)</i></br>';
    });

    socket.on('partnerLeft', function (person) {
        me = person;
        content.innerHTML += '<i>Partner left! :(</i></br>';

        var criteria = {};
        socket.emit('findPartner',criteria);
    });

    $('#form').live("submit", function() {
        $('#send').focus().click();
    });
 
    send.onclick = function() {

        if (me.partnerID) {
            var text = msg.value;
            msg.value = "";
            socket.emit('sendMessage', { message: text, from: me.id, to: me.partnerID });
            $('#msg').focus();
        }
        else {
            alert("Can't send message while still looking for partner!");
        }
    };
 
}