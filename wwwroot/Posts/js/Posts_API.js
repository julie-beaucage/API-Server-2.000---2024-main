
class Posts_API {
    static Host_URL() { return "http://localhost:5000"; }
    static API_URL() { return this.Host_URL() + "/api/posts" };
    //static API_URL() { return "http://localhost:5000/api/posts" };
    static serverHost() {
        return "http://localhost:5000";
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
    static eraseAccessToken(){
        sessionStorage.removeItem('access_Token');
    }
    static retrieveAccesToken(){
        const token = sessionStorage.getItem('access_Token');
        return token;
    }
    static storeLoggedUser(user){
      sessionStorage.setItem('user', JSON.stringify(user));
    }
    static retrieveLoggedUser() {
        const storedUser = sessionStorage.getItem('user'); 
        if (!storedUser) {
            console.log("Aucun utilisateur trouvé dans sessionStorage.");
            return null;
        }
        const user = JSON.parse(storedUser); 

        return user;
    }
    static eraseLoggedUser(){
       sessionStorage.removeItem('user');
    }
    static getBearerAuthorizationToken() {
        const token = this.retrieveAccesToken(); 
        return token ? { 'Authorization': `Bearer ${token}` } : {}; 
    }
    /***LOG OUT */
    static logout() {
        this.eraseAccessToken();
        this.eraseLoggedUser();
    }
    /*** Creation user */
    static registerUserProfile(profil){
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url:this.serverHost() + "/accounts/register/",
                type:'POST',
                contentType:'application/json',
                data:JSON.stringify(profil),
                success:(profile) =>{
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
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(false); console.log(xhr);}
            });
        })  
    }
    static conflictUserProfile(profil){
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url:this.serverHost() + "/Accounts/modify/" + this.modifyUserProfile.Id,
                type:'GET',
                contentType:'application/json',
                headers:this.getBearerAuthorizationToken(),
                data:JSON.stringify(profil),
                success:(profile) =>{
                    Posts_API.storeLoggedUser(profile);
                    resolve(profile);
                },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(false); console.log(xhr);}
            });
        })  
    }
    static verifyUserProfile(user,code){
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url:this.serverHost() + "/accounts/verify?id="+user.Id+"&code="+code,
                type:'GET',
                contentType:'application/json',
                headers:this.getBearerAuthorizationToken(),
                success:(user) =>{
                    Posts_API.storeLoggedUser(user);
                    resolve(user);
                },
                error: (xhr) => { 
                    Posts_API.setHttpErrorState(xhr); 
                    resolve(false); }
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
                    if (response.Access_token) {
                        this.storeAccessToken(response.Access_token);
                    }
                    this.storeLoggedUser(response.User); 
                    resolve(response.User);
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr); 
                    console.error("Erreur lors de la tentative de connexion :", xhr.status, xhr.statusText);
                    resolve(false); 
                },
            });
        });
    }
    static async getUsers(id = null) {
        this.initHttpState();
        return new Promise(resolve => {
            console.log(id)
            const url = this.serverHost() + "/accounts" + (id ? `/${id}` : "");
            console.log(url);
            $.ajax({
                url: url,
                type: 'GET',
                headers: this.getBearerAuthorizationToken(), 
                success: (data) => {
                    resolve(data); 
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr);
                    console.error(`Erreur lors de la récupération de l'utilisateur avec ID ${id}:`, xhr);
                    resolve(null);
                }
            });
        });
    }
    static async removeUser(id) {
        this.initHttpState(); 
        return new Promise((resolve) => {
            if (!id) {
                console.error("Aucun ID spécifié pour la suppression.");
                resolve(false);
                return;
            }
            const url = this.serverHost() + `/api/accounts/${id}`;
            $.ajax({
                url: url,
                type: 'DELETE',
                headers: this.getBearerAuthorizationToken(), 
                success: () => {
                    console.log(`Utilisateur avec ID ${id} supprimé.`);
                    resolve(true);
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr); 
                    console.error(`Erreur lors de la suppression de l'utilisateur avec ID ${id}:`, xhr);
                    resolve(false); 
                },
            });
        });
    }
    static async getUsers2() {
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url:this.serverHost() +  "/accounts", 
                type: 'GET',
                headers: this.getBearerAuthorizationToken(),
                //data:JSON.stringify(profil),
                success: (users) => {
                    resolve(users); 
                },
                error: (xhr) => { 
                    this.setHttpErrorState(xhr); 
                    resolve(false); 
                    console.log(xhr);
                }
            });
        });
    }
    static blockUser(user){
        console.log(user);
        this.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url:this.serverHost() + "/accounts/block/" + user.id,
                type:'POST',
                contentType:'application/json',
                headers:this.getBearerAuthorizationToken(),
                data:JSON.stringify(user),
                success:(user) =>{
                    Posts_API.storeLoggedUser(profile);
                    resolve(profile);
                },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(false); console.log(xhr);}
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