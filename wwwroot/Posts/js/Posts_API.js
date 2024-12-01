
class Posts_API {
    static API_URL() { return "http://localhost:5000/api/posts" };
    static serverHost() { 
        return "http://localhost:5000/api";
    }
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
    
    static storeAccessToken(token){
        sessionStorage.setItem('access_Token',token);
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
    static getBearerAuthorizationToken() {
        const token = this.retrieveAccesToken(); 
        return token ? { 'Authorization': `Bearer ${token}` } : {}; 
    }
    static logout() {
        this.eraseAccesToken();
        this.eraseLoggedUser();
        console.log("User logged out.");
    }
    static registerUserProfile(profil){
        this.initHttpState();
        console.log("Initialisation de l'état HTTP:", this.currentHttpError, this.currentStatus, this.error);
        console.log("Données de profil à enregistrer:", profil);
        return new Promise(resolve => {
            $.ajax({
                url:this.serverHost() + "/accounts/register/",
                type:'POST',
                contentType:'application/json',
                data:JSON.stringify(profil),
                success:(profile) =>{
                    console.log("Profil enregistré avec succès:", profile);
                    Posts_API.storeLoggedUser(profile);
                    this.storeAccessToken(profile.accessToken);
                    resolve(profile);
                },
                error: (xhr) => { 
                    Posts_API.setHttpErrorState(xhr);
                    console.log("Erreur lors de l'enregistrement du profil:", xhr.status, xhr.statusText);
                    console.log("Détails de la réponse:", xhr.responseJSON);
                    resolve(false); }
            });
        })  
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
                success:(profile) =>{
                    Posts_API.storeLoggedUser(profile);
                    resolve(profile);
                },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(false); }
            });
        })  
    }
    static verifyUserProfile(profil){
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url:this.serverHost() + "/Accounts/verify/" + this.verifyUserProfile.Id,
                type:'GET',
                contentType:'application/json',
                headers:this.getBearerAuthorizationToken(),
                data:JSON.stringify(profil),
                success:(profile) =>{
                    Posts_API.storeLoggedUser(profile);
                    resolve(profile);
                },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(false); }
            });
        })  
    }
    static login(user) {
        this.initHttpState(); 
        return new Promise((resolve) => {
            $.ajax({
                url: "/token", 
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(user),
                success: (response) => {
                    if (response.accessToken) {
                        this.storeAccessToken(response.accessToken);
                    }
                    this.storeLoggedUser(response.user || {}); 
                    resolve(response.user);
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr); 
                    console.error("Erreur lors de la tentative de connexion :", xhr.status, xhr.statusText);
                    resolve(false); 
                },
            });
        });
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