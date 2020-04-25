function joinroom(e) {
    e.preventDefault();
    var roomname = document.body.querySelector("#roomname").value;
    document.location.pathname = "/room/" + roomname;
    return false;
}
