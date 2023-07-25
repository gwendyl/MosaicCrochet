
$(document).ready(function () {

    ////////////////////////////////////////////
    // file links
    ////////////////////////////////////////////
    
    // var linkBars = [];
    // linkBars = document.getElementsByClassName("patternlink");
    // for(i=0;i<linkBars.length; i++)
    // {
    //     linkBars[i].addEventListener("click", function(e) {
    //         axios.get('/openPattern', {
    //             patternName: this.id.substring(4),
    //         })
    //         .then(function (response) {
    //             console.log('axios .then response');
    //             console.log(response);
    //         })
    //         .catch(function (error) {
    //             console.log(error);
    //         });

    //         // axios.post('/openPattern', {
    //         //     patternName: this.id.substring(4),
    //         // })
    //         // .then(function (response) {
    //         //     console.log('axios .then response');
    //         //     console.log(response);
    //         // })
    //         // .catch(function (error) {
    //         //     console.log(error);
    //         // });
    //     })
    // }


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
                    console.log(response);
                })
                .catch(function (error) {
                    console.log(error);
                });
                window.location.reload()
            }
        })
    }


}); //document ready
6