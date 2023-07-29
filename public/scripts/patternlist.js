
$(document).ready(function () {

    ////////////////////////////////////////////
    // delete buttons
    ////////////////////////////////////////////
    
    var deleteButtons = [];
    deleteButtons = document.getElementsByClassName("delete");
    for(i=0;i<deleteButtons.length; i++)
    {
        deleteButtons[i].addEventListener("click", function(e) {
            const userResponse = confirm("Delete the pattern named " + this.id.substring(6) + "?");
            if(userResponse) {
                axios.post('/deletePattern', {
                    _id: this.id.substring(6),
                })
                .then(function (response) {
                    console.log('calling reload');
                    // window.location.reload()
                })
                .catch(function (error) {
                    console.log(error);
                });
            }
        })
    }


}); //document ready
6