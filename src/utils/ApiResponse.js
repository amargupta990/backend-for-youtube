class ApiResponse{
    constructor(statuscode,data,messege="success"){
            this.statuscode=statuscode
            this.data=data
            this.messege=messege
            this.success=statuscode<400
    }
}
export{ApiResponse}