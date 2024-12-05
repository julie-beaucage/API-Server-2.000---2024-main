////// Author: Nicolas Chourot
////// 2024
//////////////////////////////

const periodicRefreshPeriod = 2;
const waitingGifTrigger = 2000;
const minKeywordLenth = 3;
const keywordsOnchangeDelay = 500;

let categories = [];
let selectedCategory = "";
let currentETag = "";
let currentPostsCount = -1;
let periodic_Refresh_paused = false;
let postsPanel;
let usersPanel;
let itemLayout;
let waiting = null;
let showKeywords = false;
let keywordsOnchangeTimger = null;

Init_UI();

async function Init_UI() {
    postsPanel = new PageManager('postsScrollPanel', 'postsPanel', 'postSample', renderPosts);
    $('#createPost').on("click", async function () {
        showCreatePostForm();
    });
    $('#abort').on("click", async function () {
        showPosts();
    });
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $("#showSearch").on('click', function () {
        toogleShowKeywords();
        showPosts();
    });
    installKeywordsOnkeyupEvent();
    await showPosts();
    start_Periodic_Refresh();
}


/////////////////////////// Search keywords UI //////////////////////////////////////////////////////////

function installKeywordsOnkeyupEvent() {
    $("#searchKeys").on('keyup', function () {
        clearTimeout(keywordsOnchangeTimger);
        keywordsOnchangeTimger = setTimeout(() => {
            cleanSearchKeywords();
            showPosts(true);
        }, keywordsOnchangeDelay);
    });
    $("#searchKeys").on('search', function () {
        showPosts(true);
    });
}
function cleanSearchKeywords() {
    /* Keep only keywords of 3 characters or more */
    let keywords = $("#searchKeys").val().trim().split(' ');
    let cleanedKeywords = "";
    keywords.forEach(keyword => {
        if (keyword.length >= minKeywordLenth) cleanedKeywords += keyword + " ";
    });
    $("#searchKeys").val(cleanedKeywords.trim());
}
function showSearchIcon() {
    $("#hiddenIcon").hide();
    $("#showSearch").show();
    if (showKeywords) {
        $("#searchKeys").show();
    }
    else
        $("#searchKeys").hide();
}
function hideSearchIcon() {
    $("#hiddenIcon").show();
    $("#showSearch").hide();
    $("#searchKeys").hide();
}
function toogleShowKeywords() {
    showKeywords = !showKeywords;
    if (showKeywords) {
        $("#searchKeys").show();
        $("#searchKeys").focus();
    }
    else {
        $("#searchKeys").hide();
        showPosts(true);
    }
}

/////////////////////////// Views management ////////////////////////////////////////////////////////////

function intialView() {
    $("#createPost").show();
    $("#hiddenIcon").hide();
    $("#hiddenIcon2").hide();
    $('#menu').show();
    $('#commit').hide();
    $('#abort').hide();
    $('#form').hide();
    $('#form').empty();
    $('#aboutContainer').hide();
    $('#errorContainer').hide();
    $('#userManagerContainer').hide();
    let loggedUser = Posts_API.retrieveLoggedUser();
    //console.log(loggedUser);
    if(loggedUser && loggedUser.isSuper){
        timeout();
    }
    showSearchIcon();
}
async function showPosts(reset = false) {
    intialView();
    $("#viewTitle").text("Fil de nouvelles");
    periodic_Refresh_paused = false;
    await postsPanel.show(reset);
}
function showUsers() {
    hidePosts();
    $('#userManagerContainer').show();
    renderUsers();
    $('#abort').show();
    $("#viewTitle").text("Gestions des usagers");
}
function hideUsers() {
    $('#userManagerContainer').hide();
    $("#createUser").hide();
    $('#menu').hide();
    periodic_Refresh_paused = true;
}
function hidePosts() {
    postsPanel.hide();
    hideSearchIcon();
    $("#createPost").hide();
    $("#usersScrollPanel").hide();
    $('#menu').hide();
    periodic_Refresh_paused = true;
}
function showForm() {
    hidePosts();
    //hideUsers();
    $("#createPost").hide();
    $('#form').show();
    $('#commit').show();
    $('#abort').show();
}
function showError(message, details = "") {
    hidePosts();
    $('#form').hide();
    $('#form').empty();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#commit').hide();
    $('#abort').show();
    $("#viewTitle").text("Erreur du serveur...");
    $("#errorContainer").show();
    $("#errorContainer").empty();
    $("#errorContainer").append($(`<div>${message}</div>`));
    $("#errorContainer").append($(`<div>${details}</div>`));
}
function showLoginForm() {
    showForm();
    $("#viewTitle").text("Ajout de nouvelle");
    $('#commit').hide();
    renderLoginProfil();
}
function showEditProfileForm(id){
    showForm();
    $("#viewTitle").text("Modification");
    renderEditUserForm(id);
}
function showDeleteUserForm(id) {
    showForm();
    $("#viewTitle").text("Retrait");
    renderDeleteUserForm(id);
}
function showCreatePostForm() {
    showForm();
    $("#viewTitle").text("Ajout de nouvelle");
    renderPostForm();
}
function showEditPostForm(id) {
    showForm();
    $("#viewTitle").text("Modification");
    renderEditPostForm(id);
}
function showDeletePostForm(id) {
    showForm();
    $("#viewTitle").text("Retrait");
    renderDeletePostForm(id);
}
function showAbout() {
    hidePosts();
    $("#hiddenIcon").show();
    $("#hiddenIcon2").show();
    $('#abort').show();
    $("#viewTitle").text("À propos...");
    $("#aboutContainer").show();
}

//////////////////////////// USER rendering /////////////////////////////////////////////////////////////
async function renderUsers() {
    let users = await Posts_API.getUsers();
    if (!Posts_API.error) {
        console.log(users.length);
        if (users.length > 0) {
            users.forEach(user => {
                $('#userManagerContainer').append(renderUser(user));
            });
        } 
    } else {
        showError(Posts_API.currentHttpError);
    }

}
function renderUser(user, loggedUser) {
    let crudIcon =
    ` <span id="blockUserCmd" class=" editCmd cmdIconSmall fa-stack fa-lg cmdIconSmall" postId="${user.Id}" title="Bloquer usager">
        <i class="fa fa-user fa-stack-1x"></i>
        <i class="fa fa-ban fa-stack-2x text-danger" style="color:red;"></i>
    </span>
    <span id="deleteUserCmd" class="deleteCmd cmdIconSmall fa fa-trash" postId="${user.Id}" title="Effacer usager"></span>
    `;
    let $userElement =  $(`
        <div class="user" id="${user.Id}"> 
            <div class="userContainer noselect">
                <div class="userLayout">
                    <div class="avatar" style="background-image:url('${user.Avatar}')"></div>
                    <div class="userInfo">
                        <span class="contactName">${user.Name}</span>
                        <a href="mailto:${user.Email}" class="contactEmail" target="_blank" >${user.Email}</a>
                    </div>
                </div>
                <div class="userCommandPanel">
                    ${crudIcon}
                </div>
            </div>
        </div>
    `);
    $userElement.find(".deleteCmd").on("click", async function () {
        let userId = $(this).attr("userId"); // Récupérer l'ID utilisateur
        showDeleteUserForm(user); // Appeler la fonction pour afficher le formulaire de suppression
    });

    return $userElement;
}
function changeRoleUser(userId){
    if(user.isAdmin){

    }

}

//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

function start_Periodic_Refresh() {
    $("#reloadPosts").addClass('white');
    $("#reloadPosts").on('click', async function () {
        $("#reloadPosts").addClass('white');
        postsPanel.resetScrollPosition();
        await showPosts();
    })
    setInterval(async () => {
        if (!periodic_Refresh_paused) {
            let etag = await Posts_API.HEAD();
            // the etag contain the number of model records in the following form
            // xxx-etag
            let postsCount = parseInt(etag.split("-")[0]);
            if (currentETag != etag) {           
                if (postsCount != currentPostsCount) {
                    console.log("postsCount", postsCount)
                    currentPostsCount = postsCount;
                    $("#reloadPosts").removeClass('white');
                } else
                    await showPosts();
                currentETag = etag;
            }
        }
    },
        periodicRefreshPeriod * 1000);
}
async function renderPosts(queryString) {
    let endOfData = false;
    queryString += "&sort=date,desc";
    compileCategories();
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    if (showKeywords) {
        let keys = $("#searchKeys").val().replace(/[ ]/g, ',');
        if (keys !== "")
            queryString += "&keywords=" + $("#searchKeys").val().replace(/[ ]/g, ',')
    }
    addWaitingGif();
    let response = await Posts_API.Get(queryString);
    if (!Posts_API.error) {
        currentETag = response.ETag;
        currentPostsCount = parseInt(currentETag.split("-")[0]);
        let Posts = response.data;
        if (Posts.length > 0) {
            Posts.forEach(Post => {
                postsPanel.append(renderPost(Post));
            });
        } else
            endOfData = true;
        linefeeds_to_Html_br(".postText");
        highlightKeywords();
        attach_Posts_UI_Events_Callback();
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}
function renderPost(post, loggedUser) {
    let date = convertToFrenchDate(UTC_To_Local(post.Date));
    let crudIcon= `
    <span class="editCmd cmdIconSmall fa fa-pencil" postId="${post.Id}" title="Modifier nouvelle"></span>
    <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
    `;
    if(!loggedUser){

    }else{
    if(loggedUser.Id == post.OwnerId){
        crudIcon =  `
        <span class="editCmd cmdIconSmall fa fa-pencil" postId="${post.Id}" title="Modifier nouvelle"></span>
        <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
        `;

    }else{
        if(loggedUser.isAdmin){
            crudIcon = `
            <span>&nbsp</span>
            <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
            `;
        }else{
            crudIcon = `
            <span>&nbsp</span>
            <span>&nbsp</span>
            `;
        }
    }
}
    return $(`
    <div class="post" id="${post.Id}">
        <div class="postHeader">
            ${post.Category}
            ${crudIcon}
        </div>
        <div class="postTitle"> ${post.Title} </div>
        <img class="postImage" src='${post.Image}'/>
        <div class="flex-row postInfo">
            <div class="flex-row">
                <div class="" style="background-image: url('${post.Author.Avatar}'); margin-right:0.7em; width: 40px; height: 40px; background-size: cover; border-radius: 50%;">
                </div>
                <b class="">${post.Author.Name}</b>
            </div>
            <div class="postDate"> ${date} </div>
        </div>
        <div postId="${post.Id}" class="postTextContainer hideExtra">
            <div class="postText" >${post.Text}</div>
        </div>
        <div class="postfooter">
            <span postId="${post.Id}" class="moreText cmdIconXSmall fa fa-angle-double-down" title="Afficher la suite"></span>
            <span postId="${post.Id}" class="lessText cmdIconXSmall fa fa-angle-double-up" title="Réduire..."></span>
        </div>         
    </div>
`);
}
async function compileCategories() {
    categories = [];
    let response = await Posts_API.GetQuery("?fields=category&sort=category");
    if (!Posts_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
            if (!categories.includes(selectedCategory))
                selectedCategory = "";
            updateDropDownMenu(categories);
        }
    }
}
function updateDropDownMenu() {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    let loggedUser = Posts_API.retrieveLoggedUser();
    DDMenu.empty();
    if (loggedUser) {
        loggedUserMenu();
        DDMenu.append($(`<div class="dropdown-divider"></div>`));
    }else{
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="login">
            <i class="menuIcon fa fa-fw mx-2"></i> Connexion
        </div>
        `));
        DDMenu.append($(`<div class="dropdown-divider"></div>`));
    }
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        showAbout();
    });
    $('#allCatCmd').on("click", async function () {
        selectedCategory = "";
        await showPosts(true);
        updateDropDownMenu();
    });
    $('.category').on("click", async function () {
        selectedCategory = $(this).text().trim();
        await showPosts(true);
        updateDropDownMenu();
    });
    $('#login').on("click", async function () {
        showLoginForm();
    });
    $('#editProfileCmd').on('click', function () {
        showEditProfileForm(); 
    });
}

function loggedUserMenu(){
    let loggedUser= Posts_API.retrieveLoggedUser();
    if(loggedUser){
        let connectedUser=(`
            <span class="dropdown-item " id="editProfileMenuCmdFromAvatar">
             <div class="loggedUserItemMenuLayout">
                 <div class="" style="background-image: url('${loggedUser.Avatar}'); margin-right:0.7em; width: 40px; height: 40px; background-size: cover; border-radius: 50%;">
                 </div>
                 <span class="">${loggedUser.Name}</span>
              </div>
            </span>        
        `);
        $("#DDMenu").prepend(connectedUser); 
        if(loggedUser.isAdmin){
            $("#DDMenu").append($(`<div class="dropdown-divider"></div>`));
            $("#DDMenu").append(`
                <div class="dropdown-item menuItemLayout" id="gestionUser">
                    <i class="menuIcon fas fa-user-cog mx-2"></i> Gestion des usagers
                </div>
            `);
        }
        $("#DDMenu").append($(`<div class="dropdown-divider"></div>`));
        $("#DDMenu").append(`
            <div class="dropdown-item menuItemLayout" id="editProfile">
                <i class="menuIcon fas fa-user-edit mx-2"></i> Modifier votre profil
            </div>
        `);
        $("#DDMenu").append(`
            <div class="dropdown-item menuItemLayout" id="logoutCmd">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </div>
        `);
        $('#editProfile').on("click", function () {
            showEditProfileForm(loggedUser); 
        });
        $('#gestionUser').on("click", function () {
            showUsers();
        });

        $('#logoutCmd').on("click", function () {
            console.log("click logout");
            Posts_API.logout();
            location.reload(); 
        });
    }
}
function attach_Posts_UI_Events_Callback() {

    linefeeds_to_Html_br(".postText");
    // attach icon command click event callback
    $(".editCmd").off();
    $(".editCmd").on("click", function () {
        showEditPostForm($(this).attr("postId"));
    });
    $(".deleteCmd").off();
    $(".deleteCmd").on("click", function () {
        showDeletePostForm($(this).attr("postId"));
    });
    $(".moreText").off();
    $(".moreText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).show();
        $(`.lessText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('showExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('hideExtra');
    })
    $(".lessText").off();
    $(".lessText").click(function () {
        $(`.commentsPanel[postId=${$(this).attr("postId")}]`).hide();
        $(`.moreText[postId=${$(this).attr("postId")}]`).show();
        $(this).hide();
        postsPanel.scrollToElem($(this).attr("postId"));
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass('hideExtra');
        $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass('showExtra');
    })
}
function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        postsPanel.itemsPanel.append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove();
}

/////////////////////// Posts content manipulation ///////////////////////////////////////////////////////


function linefeeds_to_Html_br(selector) {
    $.each($(selector), function () {
        let postText = $(this);
        var str = postText.html();
        var regex = /[\r\n]/g;
        postText.html(str.replace(regex, "<br>"));
    })
}
function highlight(text, elem) {
    text = text.trim();
    if (text.length >= minKeywordLenth) {
        var innerHTML = elem.innerHTML;
        let startIndex = 0;

        while (startIndex < innerHTML.length) {
            var normalizedHtml = innerHTML.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            var index = normalizedHtml.indexOf(text, startIndex);
            let highLightedText = "";
            if (index >= startIndex) {
                highLightedText = "<span class='highlight'>" + innerHTML.substring(index, index + text.length) + "</span>";
                innerHTML = innerHTML.substring(0, index) + highLightedText + innerHTML.substring(index + text.length);
                startIndex = index + highLightedText.length + 1;
            } else
                startIndex = innerHTML.length + 1;
        }
        elem.innerHTML = innerHTML;
    }
}
function highlightKeywords() {
    if (showKeywords) {
        let keywords = $("#searchKeys").val().split(' ');
        if (keywords.length > 0) {
            keywords.forEach(key => {
                let titles = document.getElementsByClassName('postTitle');
                Array.from(titles).forEach(title => {
                    highlight(key, title);
                })
                let texts = document.getElementsByClassName('postText');
                Array.from(texts).forEach(text => {
                    highlight(key, text);
                })
            })
        }
    }
}

//////////////////////// Forms rendering /////////////////////////////////////////////////////////////////
async function renderEditUserForm(id) {
    $('#commit').show();
    addWaitingGif();
    //let response = await Posts_API.Get(id)
    let response= await Posts_API.retrieveLoggedUser();
    console.log(response);
    if (!Posts_API.error) {
       // let User = response.data;
        if ( response !== null)
            renderFormProfile( response);
        else
            showError("Post introuvable!");
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeleteUserForm(user) {
    //let response = await Posts_API.getUsers(id)
    //console.log(response);
    //if (!Posts_API.error) {
        //let user = response.data;
        if (user !== null) {
            $("#form").append(`
                <div class="user" id="${user.Id}"> 
                    <div class="userContainer noselect">
                        <div class="userLayout">
                            <div class="avatar" style="background-image:url('${user.Avatar}')"></div>
                            <div class="userInfo">
                                <span class="contactName">${user.Name}</span>
                                <a href="mailto:${user.Email}" class="contactEmail" target="_blank" >${user.Email}</a>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            $('#commit').on("click", async function () {
                await Posts_API.removeUser(user.Id);
                if (!Posts_API.error) {
                    await showUsers();
                }
                else {
                    console.log(Posts_API.currentHttpError)
                    showError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", async function () {
                await showUsers();
            });

        } else {
            showError("Post introuvable!");
        }
   // } else
        //showError(Posts_API.currentHttpError);
}
function newUser() {
    let User = {};
    User.Id = 0;
    User.Created = Local_to_UTC(Date.now());
    User.Name = "";
    User.Email = "";
    User.Password = "";
    User.VerifyCode = "";
    User.Avatar = "no-avatar.png";
    return User;
}

function renderVerify(){
    $("#form").empty();
    $("#form").append(`
        <fieldset>
         <legend> Verifications< </legend>
         <form class="form" id="verifyForm">
           <p>Veuillez entrer le code de vérification que vous avez reçu par courriel </p>
           <br><br>
           <input type="text"
                  name="Code"
                  class="form-control"
                  required
                  RequireMessage="Veuillez entrer un titre"
                  InvalidMessage="Le titre comporte un caractère illégal"
                  placeholder = "Code de verification de couriel"
                  value="${User.VerifyCode}" />
            <br/>
            <input type="submit" name ="submit" value="Vérifier" id="savePost" class="btn btn-primary displayNone">
        </fieldset>
    `);
    initFormValidation();
    $('#verifyForm').on("submit", function(event){
       let verifyForm = getFormData($('#verifyForm'));
       event.preventDefault();
       verify(verifyForm.Code);
    });  
}

function renderLoginProfil(message=null){
    let User = Posts_API.retrieveLoggedUser() || { Email: '', Password: '' };
    $("#viewTitle").text("Connexion");
    $("#form").empty();
    $("#form").append(`
        <div class="messageContainer">
         
        </div>
        <form class="form" id ="loginProfilForm">
            <input type="email"
                 class="form-control Email"
                 name="Email"
                 placeholder="Courriel"
                 required
                 RequireMessage="Veuillez entrer un courriel"
                 InvalidMessage="Courriel introuvable"
                 CustomErrorMessage="Courriel introuvable"
                 value="${User.Email}"/>
                 <div class="error-message" style="color: red; id="email-error" ></div>
                 </br>
            <input type="password"
                class="form-control Password"
                name="Password"
                placeholder="Mot de passe"
                required
                RequireMessage="Veuillez entrer un mot de passe"
                InvalidMessage="Mot de passe incorrect"
                value="${User.Password}"/>
            <div class="error-message"  style="color: red; id="password-error"></div>
            <br/>
            <input type="submit" name ="submit" value="Entrer" id="loginButton" class="login_btn btn btn-primary" >
            <hr>
            <input type="button" name ="button" value="Nouveau compte" id="createAccountButton" class="nouveau_btn btn btn-primary ">
        </form>
    `);
    initFormValidation(); 
    $("#loginProfilForm").on("submit", async function (event)  {
        event.preventDefault();
        $(".error-message").text("");
        let user = getFormData($("#loginProfilForm"));
        user = await Posts_API.login(user);
        if (!Posts_API.error) {
            loggedUserMenu();
            await showPosts();
        }
        else{
            let errors = Posts_API.currentHttpError;
            console.log(Posts_API.currentHttpError);
            console.log(errors.includes("email"));
            if (errors.includes("email"))  {
                $("#email-error").text(errors);
            }
            if (errors.Password) {
                $("#password-error").text(errors);
            }
            else{
                //showError("Une erreur est survenue! ", Posts_API.currentHttpError);
                console.log(Posts_API.currentHttpError);
            }
        }
       // $("#errorMessage").text("Mot de passe incorrect").show();
            //showError("Une erreur est survenue! ", Posts_API.currentHttpError);
    });
    $("#createAccountButton").on("click", function () {
        renderFormProfile(); 
    });
}

function renderFormProfile(User=null){
    console.log(User);
    let create = User == null;
    if (create) User = newUser();
    $("#viewTitle").text("Inscription");
    $("#form").empty();
    $("#form").append(`
        <form class="form" id ="createProfilForm">
            <input type="hidden" name="Id" value="${User.Id}"/>
            <input type="hidden" name="Created" value="${User.Created}"/>
            <fieldset>
                <legend> Adress de courriel </legend>
                <input type="email"
                    class="form-control Email"
                    name="Email"
                    placeholder="Courriel"
                    value="${User.Email}"
                />
                </br>
                <input type="email"
                    class="form-control Email EmailVerification MatchedInput"
                    name="Email"
                    placeholder="Verification"
                    matchedInputId="Email"
                />
            </fieldset>
            <fieldset>
                <legend> Mot de passe </legend>
                <input type="password"
                    class="form-control Password"
                    name="Password"
                    placeholder="Mot de passe"
                    value="${User.Password}"
                />
                </br>
                <input type="password"
                    class="form-control password"
                    name="Password"
                    placeholder="Verification"
                    matchedInputId="Password"
                />
            </fieldset>
            <fieldset>
                <legend> Nom </legend>
                <input type="text"
                    class="form-control text"
                    name="Name"
                    placeholder="Nom" 
                    value="${User.Name}"
                    />
            </fieldset>
            <fieldset>
                <legend> Avatar </legend>
                <div class='imageUploaderContainer'>
                    <div class='imageUploader' 
                        newImage='${create}' 
                        controlId='Avatar' 
                        imageSrc='${User.Avatar}' 
                        waitingImage="Loading_icon.gif">
                    </div>
                </div>
            </fieldset>
            <input type="submit" value="Enregistrer" id="saveUser" class="btn btn-primary ">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
            <input type="button" name ="button" value="Effacer le compte" id="deleteAccountButton" class="btn btn-primary ">

        </form>
    `);
    initImageUploaders();
    initFormValidation(); 
    $("#commit").click(function () {
        $("#commit").off();modifyUserProfile
        return $('#saveUser').trigger("click");
    });
    const serviceUrl = `${Posts_API.serverHost()}/accounts/conflict`;
    addConflictValidation(serviceUrl,"Email","saveUser");
    $('#createProfilForm').on("submit", async function (event) {
        event.preventDefault();
        let user = getFormData($("#createProfilForm"));
        //user = await Posts_API.Save(post, create);
        user = await Posts_API.registerUserProfile(user);
        if (!Posts_API.error) {
            let message="Votre compte a été créé. Veuillez prendre vos courriels pour récupérer votre code de vérification qui vous sera demandé lors de vottre prochaine connexion.";
            renderLoginProfil(message);
            
        }
        else
            showError("Une erreur est survenue! ", Posts_API.currentHttpError);
    });
    $('#cancel').on("click", async function () {
        await showPosts();
    });
    $("#deleteAccountButton").on("click", function () {
        renderFormProfile(); 
    });
    
}

//////////////////////// Forms rendering (POST) /////////////////////////////////////////////////////////////////

async function renderEditPostForm(id) {
    $('#commit').show();
    addWaitingGif();
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let Post = response.data;
        if (Post !== null)
            renderPostForm(Post);
        else
            showError("Post introuvable!");
    } else {
        showError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeletePostForm(id) {
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let post = response.data;
        if (post !== null) {
            let date = convertToFrenchDate(UTC_To_Local(post.Date));
            $("#form").append(`
                <div class="post" id="${post.Id}">
                <div class="postHeader">  ${post.Category} </div>
                <div class="postTitle ellipsis"> ${post.Title} </div>
                <img class="postImage" src='${post.Image}'/>
                <div class="postDate"> ${date} </div>
                <div class="postTextContainer showExtra">
                    <div class="postText">${post.Text}</div>
                </div>
            `);
            linefeeds_to_Html_br(".postText");
            // attach form buttons click event callback
            $('#commit').on("click", async function () {
                await Posts_API.Delete(post.Id);
                if (!Posts_API.error) {
                    await showPosts();
                }
                else {
                    console.log(Posts_API.currentHttpError)
                    showError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", async function () {
                await showPosts();
            });

        } else {
            showError("Post introuvable!");
        }
    } else
        showError(Posts_API.currentHttpError);
}
function newPost() {
    let Post = {};
    Post.Id = 0;
    Post.Title = "";
    Post.Text = "";
    Post.Image = "news-logo-upload.png";
    Post.Category = "";
    return Post;
}
function renderPostForm(post = null) {
    let create = post == null;
    if (create) post = newPost();
    $("#form").show();
    $("#form").empty();
    $("#form").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>
             <input type="hidden" name="Date" value="${post.Date}"/>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${post.Category}"
            />
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal"
                value="${post.Title}"
            />
            <label for="Url" class="form-label">Texte</label>
             <textarea class="form-control" 
                          name="Text" 
                          id="Text"
                          placeholder="Texte" 
                          rows="9"
                          required 
                          RequireMessage = 'Veuillez entrer une Description'>${post.Text}</textarea>

            <label class="form-label">Image </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader' 
                     newImage='${create}' 
                     controlId='Image' 
                     imageSrc='${post.Image}' 
                     waitingImage="Loading_icon.gif">
                </div>
            </div>
            <div id="keepDateControl">
                <input type="checkbox" name="keepDate" id="keepDate" class="checkbox" checked>
                <label for="keepDate"> Conserver la date de création </label>
            </div>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary displayNone">
        </form>
    `);
    if (create) $("#keepDateControl").hide();

    initImageUploaders();
    initFormValidation(); // important do to after all html injection!

    $("#commit").click(function () {
        $("#commit").off();
        return $('#savePost').trigger("click");
    });
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        if (post.Category != selectedCategory)
            selectedCategory = "";
        if (create || !('keepDate' in post))
            post.Date = Local_to_UTC(Date.now());
        delete post.keepDate;
        post = await Posts_API.Save(post, create);
        if (!Posts_API.error) {
            await showPosts();
            postsPanel.scrollToElem(post.Id);
        }
        else
            showError("Une erreur est survenue! ", Posts_API.currentHttpError);
    });
    $('#cancel').on("click", async function () {
        await showPosts();
    });
}
function getFormData($form) {
    // prevent html injections
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    // grab data from all controls
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}