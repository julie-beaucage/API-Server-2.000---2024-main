
class Posts_API {
    static API_URL() { return "http://localhost:5000/api/posts" };
    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
    }
    static setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            this.currentHttpError = xhr.responseJSON.error_description;
        else
            this.currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        this.currentStatus = xhr.status;
        this.error = true;
    }
    static storeAccessToken(){
        sessionStorage.setItem('access_Token');
    }
    static eraseAccesToken(){
        sessionStorage.removeItem('access_Token');
    }
    static retrieveAccesToken(){
        sessionStorage.getItem('access_Token');
    }
    static storeLoggedUser(user){
      sessionStorage.setItem('user', JSON.stringify(user));
    }
    static retrieveLoggedUser(){
        let user = JSON.parse(sessionStorage.getItem('user'));
        return user;
    }
    static eraseLoggedUser(){
       sessionStorage.removeItem('user');
    }
    static modifyUserProfile(profil){
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url:this.serverHost() + "/Accounts/modify/" + this.modifyUserProfile.Id,
                type:'PUT',
                contentType:'application/json',
                headers:this.getBearerAuthorizationToken(),
                data:JSON.stringify(profil),
                succes:(profile) =>{
                    Posts_API.storeLoggedUser(profile);
                    resolve(profile);
                },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(false); }
            });
        })  
    }
    static async HEAD() {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL(),
                type: 'HEAD',
                contentType: 'text/plain',
                complete: data => { resolve(data.getResponseHeader('ETag')); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Get(id = null) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + (id != null ? "/" + id : ""),
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async GetQuery(queryString = "") {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + queryString,
                complete: data => {
                    resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON });
                },
                error: (xhr) => {
                    Posts_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async Save(data, create = true) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? this.API_URL() : this.API_URL() + "/" + data.Id,
                type: create ? "POST" : "PUT",
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Delete(id) {
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + "/" + id,
                type: "DELETE",
                complete: () => {
                    Posts_API.initHttpState();
                    resolve(true);
                },
                error: (xhr) => {
                    Posts_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
}