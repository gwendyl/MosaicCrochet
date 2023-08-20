
$(document).ready(function () {

    ////////////////////////////////////////////
    // delete buttons
    ////////////////////////////////////////////
    
    var deleteButtons = [];
    deleteButtons = document.getElementsByClassName("delete");
    for(i=0;i<deleteButtons.length; i++)
    {
        deleteButtons[i].addEventListener("click", async function(e) {
            const userResponse = confirm("Delete the pattern named " + this.name + "?");
            if(userResponse) {
                axios.post('/deletePattern', {
                    _id: this.id.substring(6),
                })
                .then(function (response) {
                })
                .catch(function (error) {
                });
                location.reload()
            }
        })
    }


}); //document ready
